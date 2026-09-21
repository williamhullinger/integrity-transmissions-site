import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { Pool } from "pg";
import { PostgresOfficeRepository } from "../server/repository.mjs";

const databaseUrl = process.env.OFFICE_TEST_DATABASE_URL || "";

const applyMigrations = async (pool, names) => {
  for (const name of names) {
    const sql = await readFile(new URL(`../db/${name}`, import.meta.url), "utf8");
    await pool.query(sql);
  }
};

const policyAcceptance = Object.freeze({
  version: "2026-09-04",
  sha256: "a".repeat(64),
  url: "https://integritydrivetrain.com/legal/reman-policy-bundle-2026-09-04",
  acceptedAt: "2026-09-20T12:00:00.000Z",
  acceptanceMethod: "clickwrap",
  purchaseTermsAccepted: true,
  coreWarrantyAcknowledged: true,
  electronicRecordsConsented: true,
});

const seedLegacyOrder = async (pool) => {
  await pool.query("BEGIN");
  try {
    const customer = await pool.query("INSERT INTO customers (stripe_customer_id,name,email,phone) VALUES ('cus_legacy','Legacy Customer','legacy@example.com','417-555-0100') RETURNING id");
    const customerId = customer.rows[0].id;
    const vehicle = await pool.query("INSERT INTO vehicles (customer_id,vin,year,make,model) VALUES ($1,'1FTFW1E50JFA00000',2018,'Ford','F-150') RETURNING id", [customerId]);
    const address = await pool.query("INSERT INTO addresses (customer_id,line1,city,region,postal_code,location_type) VALUES ($1,'100 Test Dock','Springfield','MO','65807','commercial') RETURNING id", [customerId]);
    const quote = await pool.query("INSERT INTO quotes (customer_id,vehicle_id,current_version,expires_at) VALUES ($1,$2,1,now()+interval '1 day') RETURNING id", [customerId, vehicle.rows[0].id]);
    await pool.query(`
      INSERT INTO quote_versions (
        quote_id,version,selection_id,transmission_family,package_name,warranty_text,
        availability_code,availability_text,supplier_unit_cost_cents,customer_unit_price_cents,
        core_deposit_cents,freight_charged_cents,supplier_freight_cost_cents,currency,
        supplier_snapshot,freight_snapshot,terms_version,terms_sha256,list_unit_price_cents,
        promotion_discount_cents,policy_accepted_at,policy_acceptance
      ) VALUES ($1,1,'legacy-selection','10R80','Base','Written warranty','in_stock','Verified',
        300000,350000,100000,40000,40000,'usd',$2::jsonb,'{}'::jsonb,'2026-09-04',$3,
        350000,0,$4,$5::jsonb)
    `, [quote.rows[0].id, JSON.stringify({ partUid: "legacy-part" }), "a".repeat(64), policyAcceptance.acceptedAt, JSON.stringify(policyAcceptance)]);
    const order = await pool.query(`
      INSERT INTO orders (customer_id,vehicle_id,delivery_address_id,quote_id,quote_version,core_status)
      VALUES ($1,$2,$3,$4,1,'awaiting_return') RETURNING id
    `, [customerId, vehicle.rows[0].id, address.rows[0].id, quote.rows[0].id]);
    await pool.query("COMMIT");
    return order.rows[0].id;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

const checkoutSnapshot = (suffix) => ({
  requestId: `request-${suffix}`,
  stripeSessionId: `cs_test_${suffix}`,
  stripeSessionCreatedAt: "2026-09-20T12:00:00.000Z",
  stripeCustomerId: `cus_${suffix}`,
  stripePaymentIntentId: null,
  checkoutAttemptKey: `attempt-${suffix}-1234567890`,
  expiresAt: "2026-09-20T13:00:00.000Z",
  vin: "1GCWGFFF0F1000001",
  customer: { name: "Integration Customer", email: `${suffix}@example.com`, phone: "417-555-0101" },
  vehicle: { year: 2015, make: "Chevrolet", model: "Express", engine: "5.3L", driveType: "RWD", mileage: 100000 },
  address: { line1: "200 Test Dock", line2: null, city: "Springfield", region: "MO", postalCode: "65807", locationType: "commercial" },
  selectionId: `selection-${suffix}`,
  application: "6L80",
  packageName: "Base",
  warranty: "Written warranty",
  availability: { code: "in_stock", text: "Verified" },
  supplierUnitCostCents: 310000,
  listUnitPriceCents: 360000,
  customerUnitPriceCents: 360000,
  promotionCode: null,
  promotionDiscountCents: 0,
  promotionReservationId: null,
  coreDepositCents: 100000,
  freightChargedCents: 40000,
  supplierFreightCostCents: 40000,
  currency: "usd",
  supplierSnapshot: { partUid: `part-${suffix}`, application: "6L80" },
  freightSnapshot: { carrier: "Integration Carrier" },
  termsVersion: "2026-09-04",
  termsSha256: "a".repeat(64),
  policyAcceptedAt: policyAcceptance.acceptedAt,
  policyAcceptance,
});

test("PostgreSQL migrations enforce nationwide order, purchase, shipment and warranty integrity", {
  skip: !databaseUrl,
  timeout: 60_000,
}, async () => {
  const parsed = new URL(databaseUrl);
  assert.match(parsed.pathname, /_test$/, "Refusing to reset a database not named with the _test suffix");
  const pool = new Pool({ connectionString: databaseUrl, max: 8 });
  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const migrations = (await readdir(new URL("../db/", import.meta.url))).filter((name) => /^00[1-6]_.*[.]sql$/.test(name)).sort();
    await applyMigrations(pool, migrations.slice(0, 4));
    const legacyOrderId = await seedLegacyOrder(pool);
    await applyMigrations(pool, migrations.slice(4));

    const legacy = await pool.query(`
      SELECT oi.id, oi.supplier_sku_snapshot, co.id AS core_obligation_id
      FROM order_items oi LEFT JOIN order_item_core_obligations co ON co.order_item_id=oi.id
      WHERE oi.order_id=$1
    `, [legacyOrderId]);
    assert.equal(legacy.rowCount, 1);
    assert.equal(legacy.rows[0].supplier_sku_snapshot, "legacy-part");
    assert.ok(legacy.rows[0].core_obligation_id);

    const repository = new PostgresOfficeRepository(pool);
    const current = await repository.ingestCheckout(checkoutSnapshot("dualwrite"));
    const replay = await repository.ingestCheckout(checkoutSnapshot("dualwrite"));
    assert.equal(replay.repeated, true);
    const materialized = await pool.query(`
      SELECT count(*)::int AS item_count, count(co.id)::int AS core_count
      FROM order_items oi LEFT JOIN order_item_core_obligations co ON co.order_item_id=oi.id
      WHERE oi.order_id=$1
    `, [current.id]);
    assert.deepEqual(materialized.rows[0], { item_count: 1, core_count: 1 });

    const staff = await pool.query("INSERT INTO staff_users (auth0_subject,email,display_name) VALUES ('auth0|postgres-test','staff@example.com','Postgres Test') RETURNING id");
    await pool.query("INSERT INTO user_roles (staff_user_id,role,granted_by,reason) VALUES ($1,'administrator',$1,'integration test')", [staff.rows[0].id]);
    const supplier = await pool.query("INSERT INTO suppliers (code,display_name) VALUES ('TEST','Test Supplier') RETURNING id");
    const orderItem = await pool.query("SELECT id FROM order_items WHERE order_id=$1", [legacyOrderId]);

    const clientOne = await pool.connect();
    const clientTwo = await pool.connect();
    let secondInsert;
    try {
      await clientOne.query("BEGIN");
      await clientTwo.query("BEGIN");
      const poOne = await clientOne.query("INSERT INTO supplier_purchase_orders (order_id,supplier_id,purchase_order_number,created_by) VALUES ($1,$2,'PO-RACE-1',$3) RETURNING id", [legacyOrderId, supplier.rows[0].id, staff.rows[0].id]);
      const poTwo = await clientTwo.query("INSERT INTO supplier_purchase_orders (order_id,supplier_id,purchase_order_number,created_by) VALUES ($1,$2,'PO-RACE-2',$3) RETURNING id", [legacyOrderId, supplier.rows[0].id, staff.rows[0].id]);
      await clientOne.query(`INSERT INTO supplier_purchase_order_lines (purchase_order_id,order_id,supplier_id,order_item_id,line_number,supplier_sku_snapshot,description,quantity,unit_cost_cents) VALUES ($1,$2,$3,$4,1,'part','Unit',1,300000)`, [poOne.rows[0].id, legacyOrderId, supplier.rows[0].id, orderItem.rows[0].id]);
      secondInsert = clientTwo.query(`INSERT INTO supplier_purchase_order_lines (purchase_order_id,order_id,supplier_id,order_item_id,line_number,supplier_sku_snapshot,description,quantity,unit_cost_cents) VALUES ($1,$2,$3,$4,1,'part','Unit',1,300000)`, [poTwo.rows[0].id, legacyOrderId, supplier.rows[0].id, orderItem.rows[0].id]);
      await clientOne.query("COMMIT");
      await assert.rejects(secondInsert, /quantity exceeds/);
      await clientTwo.query("ROLLBACK");

      await pool.query("UPDATE supplier_purchase_orders SET state='canceled', canceled_at=now(), cancellation_reason='test release' WHERE id=$1", [poOne.rows[0].id]);
      const poThree = await pool.query("INSERT INTO supplier_purchase_orders (order_id,supplier_id,purchase_order_number,created_by) VALUES ($1,$2,'PO-REUSED',$3) RETURNING id", [legacyOrderId, supplier.rows[0].id, staff.rows[0].id]);
      const poLine = await pool.query(`INSERT INTO supplier_purchase_order_lines (purchase_order_id,order_id,supplier_id,order_item_id,line_number,supplier_sku_snapshot,description,quantity,unit_cost_cents) VALUES ($1,$2,$3,$4,1,'part','Unit',1,300000) RETURNING id`, [poThree.rows[0].id, legacyOrderId, supplier.rows[0].id, orderItem.rows[0].id]);

      const shipment = await pool.query("INSERT INTO fulfillment_shipments (order_id,purchase_order_id,direction,status) VALUES ($1,$2,'outbound','planned') RETURNING id", [legacyOrderId, poThree.rows[0].id]);
      await assert.rejects(pool.query("INSERT INTO shipment_items (shipment_id,order_id,purchase_order_id,order_item_id,quantity) VALUES ($1,$2,$3,$4,1)", [shipment.rows[0].id, legacyOrderId, poThree.rows[0].id, orderItem.rows[0].id]), /exact purchase order line provenance/);
      await pool.query("INSERT INTO shipment_items (shipment_id,order_id,purchase_order_id,purchase_order_line_id,order_item_id,quantity) VALUES ($1,$2,$3,$4,$5,1)", [shipment.rows[0].id, legacyOrderId, poThree.rows[0].id, poLine.rows[0].id, orderItem.rows[0].id]);

      const other = await repository.ingestCheckout(checkoutSnapshot("otherorder"));
      const otherItem = await pool.query("SELECT id FROM order_items WHERE order_id=$1", [other.id]);
      await assert.rejects(pool.query(`INSERT INTO warranty_claims (order_id,order_item_id,supplier_id,state,complaint) VALUES ($1,$2,$3,'intake','Cross-order attempt')`, [legacyOrderId, otherItem.rows[0].id, supplier.rows[0].id]), /foreign key|claim order/i);
    } finally {
      if (secondInsert) await secondInsert.catch(() => {});
      await clientOne.query("ROLLBACK").catch(() => {});
      await clientTwo.query("ROLLBACK").catch(() => {});
      clientOne.release();
      clientTwo.release();
    }
  } finally {
    await pool.end();
  }
});
