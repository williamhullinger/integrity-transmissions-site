import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { createInternalFreightHandler } from "../server/internal-freight.mjs";
import { createInternalIngestHandler, _internals as ingestInternals } from "../server/internal-ingest.mjs";
import { createInternalPromotionHandler } from "../server/internal-promotion.mjs";
import { conflict } from "../server/errors.mjs";
import { reconcileStripe } from "../server/reconciliation.mjs";
import { createStripeWebhookHandler } from "../server/stripe-webhook.mjs";
import { claimStripeEvents, _internals as eventInternals } from "../server/stripe-events.mjs";

test("durable webhook intake rejects invalid signatures and acknowledges duplicates", async () => {
  let ingested = 0;
  const handler = createStripeWebhookHandler({
    env: { OFFICE_STRIPE_WEBHOOK_SECRET: "whsec_test" },
    stripeFactory: () => ({ webhooks: { constructEvent: (_raw, signature) => {
      if (signature !== "valid") throw new Error("bad signature");
      return { id: "evt_123", type: "checkout.session.completed" };
    } } }),
    poolFactory: () => ({}),
    ingest: async () => { ingested += 1; return false; },
    logger: { warn() {}, error() {} },
  });
  assert.equal((await handler({ httpMethod: "POST", headers: { "stripe-signature": "bad" }, body: "{}" })).statusCode, 400);
  const accepted = await handler({ httpMethod: "POST", headers: { "stripe-signature": "valid" }, body: "{}" });
  assert.equal(accepted.statusCode, 200);
  assert.equal(JSON.parse(accepted.body).duplicate, true);
  assert.equal(ingested, 1);
});

test("storefront checkout ingestion requires a fresh HMAC and preserves the verified snapshot", async () => {
  const secret = "a".repeat(64);
  const snapshot = {
    requestId: "request-12345678",
    stripeSessionId: "cs_test_1234567890",
    stripeSessionCreatedAt: Math.floor(Date.now() / 1_000),
    stripeCustomerId: "cus_1234567890",
    stripePaymentIntentId: null,
    checkoutAttemptKey: "attempt-1234567890abcdef",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    vin: "1FTFW1E50JFA00000",
    customer: { name: "Customer", email: "customer@example.com", phone: "417-555-0100" },
    vehicle: { year: 2018, make: "Ford", model: "F-150", engine: "5.0L", driveType: "4WD", mileage: 120000 },
    address: { line1: "123 Main", line2: null, city: "Springfield", region: "MO", postalCode: "65807", locationType: "Commercial" },
    selectionId: "selection-1234567890",
    application: "10R80",
    packageName: "Base",
    warranty: "36 months",
    availability: { code: "in_stock", text: "In stock" },
    supplierUnitCostCents: 360000,
    customerUnitPriceCents: 410000,
    coreDepositCents: 150000,
    freightChargedCents: 45000,
    supplierFreightCostCents: 45000,
    currency: "usd",
    supplierSnapshot: { application: "10R80" },
    freightSnapshot: { carrier: "Carrier" },
    termsVersion: "2026-09-03",
    termsSha256: "a".repeat(64),
  };
  const raw = JSON.stringify(snapshot);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  let received;
  const handler = createInternalIngestHandler({
    env: { OFFICE_INTERNAL_INGEST_SECRET: secret },
    repositoryFactory: () => ({ ingestCheckout: async (value) => { received = value; return { orderNumber: "1001", repeated: false }; } }),
    logger: { warn() {}, error() {} },
  });
  const accepted = await handler({ httpMethod: "POST", headers: { "x-office-timestamp": timestamp, "x-office-signature": signature }, body: raw });
  assert.equal(accepted.statusCode, 201, accepted.body);
  assert.equal(received.supplierUnitCostCents, 360000);
  assert.equal(received.customer.email, "customer@example.com");
  assert.match(received.stripeSessionCreatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(ingestInternals.verifySignature({ raw, timestamp: String(Number(timestamp) - 301), signature, secret }), false);

  const unsupportedRaw = JSON.stringify({ ...snapshot, currency: "cad" });
  const unsupportedSignature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${unsupportedRaw}`).digest("hex")}`;
  const unsupported = await handler({ httpMethod: "POST", headers: { "x-office-timestamp": timestamp, "x-office-signature": unsupportedSignature }, body: unsupportedRaw });
  assert.equal(unsupported.statusCode, 400);
});

test("freight recovery ingestion validates contact data and deduplicates by public reference", async () => {
  const secret = "b".repeat(64);
  const request = {
    publicReference: "123e4567-e89b-12d3-a456-426614174000",
    vin: "1FTFW1E50JFA00000",
    name: "Customer",
    email: "customer@example.com",
    phone: "417-555-0100",
    destinationPostalCode: "65807",
    destinationRegion: "MO",
    locationType: "Repair shop or commercial dock",
    requestedSelectionId: "selection-1234567890",
    requestedPackage: "1000",
    failureCode: "supplier_freight_rate_unavailable",
    failureRequestId: "freight-request-123",
  };
  const raw = JSON.stringify(request);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  let received;
  const handler = createInternalFreightHandler({
    env: { OFFICE_INTERNAL_INGEST_SECRET: secret },
    repositoryFactory: () => ({
      ingestFreightRequest: async (value) => {
        received = value;
        return { reference: value.publicReference, repeated: true };
      },
    }),
    logger: { warn() {}, error() {} },
  });
  const accepted = await handler({
    httpMethod: "POST",
    headers: { "x-office-timestamp": timestamp, "x-office-signature": signature },
    body: raw,
  });
  assert.equal(accepted.statusCode, 200, accepted.body);
  assert.equal(JSON.parse(accepted.body).duplicate, true);
  assert.equal(received.destinationRegion, "MO");
  assert.equal(received.phone, "417-555-0100");
});

test("promotion reservation intake requires signed server pricing and returns only the approved discount", async () => {
  const secret = "c".repeat(64);
  const request = {
    requestId: "request-promotion-123",
    checkoutAttemptKey: "attempt-promotion-1234567890",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    code: "SAVE-50",
    customerEmail: "customer@example.com",
    listUnitPriceCents: 410000,
    freightChargedCents: 45000,
    supplierUnitCostCents: 360000,
    supplierFreightCostCents: 45000,
  };
  const raw = JSON.stringify(request);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  let received;
  const handler = createInternalPromotionHandler({
    env: { OFFICE_INTERNAL_INGEST_SECRET: secret },
    repositoryFactory: () => ({
      reservePromotion: async (value) => {
        received = value;
        return { id: "7f573082-2a5b-4d7f-a05f-2af8721af43b", code: value.code, discountCents: 5000, reservedUntil: value.reservedUntil, repeated: false };
      },
    }),
    logger: { warn() {}, error() {} },
  });
  const accepted = await handler({
    httpMethod: "POST",
    headers: { "x-office-timestamp": timestamp, "x-office-signature": signature },
    body: raw,
  });
  assert.equal(accepted.statusCode, 200, accepted.body);
  assert.equal(JSON.parse(accepted.body).discountCents, 5000);
  assert.equal(received.listUnitPriceCents - received.supplierUnitCostCents, 50000);

  const invalid = JSON.stringify({ ...request, supplierUnitCostCents: 359999 });
  const invalidSignature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${invalid}`).digest("hex")}`;
  assert.equal((await handler({ httpMethod: "POST", headers: { "x-office-timestamp": timestamp, "x-office-signature": invalidSignature }, body: invalid })).statusCode, 400);

  const rejected = createInternalPromotionHandler({
    env: { OFFICE_INTERNAL_INGEST_SECRET: secret },
    repositoryFactory: () => ({ reservePromotion: async () => { throw conflict("wholesale margin detail"); } }),
    logger: { warn() {}, error() {} },
  });
  const rejectedResponse = await rejected({
    httpMethod: "POST",
    headers: { "x-office-timestamp": timestamp, "x-office-signature": signature },
    body: raw,
  });
  assert.equal(rejectedResponse.statusCode, 409);
  assert.equal(JSON.parse(rejectedResponse.body).error, "That promotion code cannot be applied to this order.");
  assert.doesNotMatch(rejectedResponse.body, /wholesale|margin/i);
});

test("Stripe reconciliation reports missing and mismatched sessions", async () => {
  const sessions = [
    { id: "cs_paid", payment_status: "paid", amount_total: 10000, metadata: { order_type: "reman_transmission" } },
    { id: "cs_missing", payment_status: "paid", amount_total: 20000, metadata: { order_type: "reman_transmission" } },
    { id: "cs_other", payment_status: "paid", amount_total: 500, metadata: { order_type: "other" } },
  ];
  const result = await reconcileStripe({
    stripe: { checkout: { sessions: { list: async function* () { yield* sessions; } } } },
    repository: { localStripePayments: async () => [
      { stripeSessionId: "cs_paid", amountCents: 9999 },
      { stripeSessionId: "cs_local_only", amountCents: 30000 },
    ] },
    startAt: "2026-09-01T00:00:00Z",
    endAt: "2026-09-05T00:00:00Z",
  });
  assert.equal(result.balanced, false);
  assert.deepEqual(result.unmatchedStripe, ["cs_missing"]);
  assert.deepEqual(result.unmatchedOffice, ["cs_local_only"]);
  assert.deepEqual(result.amountMismatches, [{ stripeSessionId: "cs_paid", stripeCents: 10000, officeCents: 9999 }]);
});

test("retrieves the authoritative Stripe balance transaction before posting fees", async () => {
  const row = {
    event_type: "charge.succeeded",
    payload: { data: { object: { paid: true, balance_transaction: "txn_fee_source" } } },
  };
  let retrieved;
  const context = await eventInternals.prepareEvent(row, { balanceTransactions: { retrieve: async (id) => {
    retrieved = id;
    return { id, fee: 1234, currency: "usd", created: 1_788_480_000 };
  } } });
  assert.equal(retrieved, "txn_fee_source");
  assert.equal(context.balanceTransaction.fee, 1234);
  await assert.rejects(() => eventInternals.prepareEvent({
    event_type: "charge.updated",
    payload: { data: { object: { id: "ch_waiting", paid: true, balance_transaction: null } } },
  }, { charges: { retrieve: async () => ({ id: "ch_waiting", paid: true, balance_transaction: null }) } }), /waiting for its balance transaction/);
  const refreshed = await eventInternals.prepareEvent({
    event_type: "charge.updated",
    payload: { data: { object: { id: "ch_refresh", paid: true, balance_transaction: null } } },
  }, { charges: { retrieve: async (_id, options) => ({ id: "ch_refresh", paid: true, payment_intent: "pi_refresh", balance_transaction: { id: "txn_refresh", fee: 321, currency: "usd" }, options }) } });
  assert.equal(refreshed.charge.payment_intent, "pi_refresh");
  assert.equal(refreshed.balanceTransaction.fee, 321);
});

test("refreshes disputes and materializes their authoritative balance movements", async () => {
  const eventDispute = { id: "du_current", charge: "ch_current", status: "needs_response", balance_transactions: [] };
  const retrieved = [];
  const context = await eventInternals.prepareEvent({
    event_type: "charge.dispute.funds_withdrawn",
    payload: { data: { object: eventDispute } },
  }, {
    disputes: { retrieve: async (id, options) => {
      assert.equal(id, "du_current");
      assert.deepEqual(options, { expand: ["charge"] });
      return {
        ...eventDispute,
        status: "under_review",
        charge: { id: "ch_current", payment_intent: "pi_current" },
        balance_transactions: ["txn_dispute_withdrawal"],
      };
    } },
    balanceTransactions: { retrieve: async (id) => {
      retrieved.push(id);
      return { id, object: "balance_transaction", type: "adjustment", source: "du_current", net: -2500, currency: "usd", created: 1_788_480_000 };
    } },
  });
  assert.equal(context.dispute.status, "under_review");
  assert.equal(context.charge.payment_intent, "pi_current");
  assert.deepEqual(retrieved, ["txn_dispute_withdrawal"]);
  assert.equal(context.balanceTransactions[0].net, -2500);
});

test("posts dispute withdrawals and reinstatements without allowing unrelated balance transactions", async () => {
  const run = async ({ status, paymentStatus, net, transactionId }) => {
    const queries = [];
    const client = { query: async (sql, values = []) => {
      const statement = String(sql);
      queries.push({ statement, values });
      if (statement.includes("FROM checkout_sessions cs")) {
        return { rows: [{ id: "order-dispute", payment_status: paymentStatus, currency: "usd", captured_cents: "10000", refunded_cents: "0" }], rowCount: 1 };
      }
      if (statement.includes("INSERT INTO journal_entries")) return { rows: [{ id: `journal-${transactionId}` }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    } };
    const dispute = {
      id: "du_ledger",
      amount: 10000,
      currency: "usd",
      charge: "ch_ledger",
      created: 1_788_470_000,
      reason: "general",
      status,
      evidence_details: {},
    };
    await eventInternals.processDispute(client, {
      stripe_event_id: `evt_${status}`,
      payload: { created: 1_788_480_000, data: { object: dispute } },
    }, {
      dispute,
      charge: { id: "ch_ledger", payment_intent: "pi_ledger" },
      balanceTransactions: [{ id: transactionId, type: "adjustment", source: "du_ledger", net, currency: "usd", created: 1_788_480_000 }],
    });
    return queries;
  };

  const withdrawn = await run({ status: "under_review", paymentStatus: "paid", net: -10000, transactionId: "txn_withdrawn" });
  assert.deepEqual(withdrawn.find(({ statement }) => statement.includes("UPDATE orders SET payment_status"))?.values, ["order-dispute", "disputed"]);
  assert.deepEqual(withdrawn.filter(({ statement }) => statement.includes("INSERT INTO journal_lines")).map(({ values }) => values.slice(1)), [["6300", 10000, 0], ["1000", 0, 10000]]);

  const reinstated = await run({ status: "won", paymentStatus: "disputed", net: 10000, transactionId: "txn_reinstated" });
  assert.deepEqual(reinstated.find(({ statement }) => statement.includes("UPDATE orders SET payment_status"))?.values, ["order-dispute", "paid"]);
  assert.deepEqual(reinstated.filter(({ statement }) => statement.includes("INSERT INTO journal_lines")).map(({ values }) => values.slice(1)), [["1000", 10000, 0], ["6300", 0, 10000]]);

  await assert.rejects(() => eventInternals.processDispute({ query: async (sql) => {
    if (String(sql).includes("FROM checkout_sessions cs")) return { rows: [{ id: "order-dispute", payment_status: "paid", currency: "usd", captured_cents: "10000", refunded_cents: "0" }] };
    return { rows: [], rowCount: 1 };
  } }, {
    stripe_event_id: "evt_wrong_source",
    payload: { created: 1_788_480_000, data: { object: { id: "du_ledger", amount: 10000, currency: "usd", charge: "ch_ledger", created: 1_788_470_000, status: "under_review", evidence_details: {} } } },
  }, {
    dispute: { id: "du_ledger", amount: 10000, currency: "usd", charge: "ch_ledger", created: 1_788_470_000, status: "under_review", evidence_details: {} },
    charge: { id: "ch_ledger", payment_intent: "pi_ledger" },
    balanceTransactions: [{ id: "txn_unrelated", type: "charge", source: "ch_other", net: -10000, currency: "usd" }],
  }), /not an adjustment for this dispute/);
});

test("refund events preserve an active dispute until Stripe resolves it", async () => {
  const updates = [];
  const client = { query: async (sql, values = []) => {
    const statement = String(sql);
    if (statement.includes("FROM checkout_sessions cs")) return { rows: [{ id: "order-disputed", payment_status: "disputed", captured_cents: "10000", currency: "usd" }] };
    if (statement.includes("SELECT COALESCE(sum(amount_cents)")) return { rows: [{ refunded_cents: "2500" }] };
    if (statement.includes("UPDATE orders SET payment_status")) updates.push(values);
    return { rows: [], rowCount: 1 };
  } };
  await eventInternals.applyEvent(client, {
    event_type: "refund.updated",
    stripe_event_id: "evt_refund_during_dispute",
    payload: { created: 1_788_480_000, data: { object: { id: "re_disputed", status: "succeeded", amount: 2500, currency: "usd", payment_intent: "pi_disputed" } } },
  });
  assert.deepEqual(updates, []);
});

test("rejects payment-link and currency mismatches before ledger posting", async () => {
  const order = {
    id: "order-1",
    list_unit_price_cents: 10000,
    freight_charged_cents: 0,
    core_deposit_cents: 0,
    discount_cents: 0,
    currency: "usd",
  };
  const session = { id: "cs_live_control", payment_intent: "pi_control", payment_status: "paid", amount_total: 10000, currency: "cad", total_details: { amount_tax: 0 }, automatic_tax: { status: "complete" } };
  await assert.rejects(() => eventInternals.ensurePaidJournal({ query: async () => { throw new Error("query should not run"); } }, { created: 1_788_480_000 }, session, order), /currency does not match/);

  const statements = [];
  await assert.rejects(() => eventInternals.ensurePaidJournal({ query: async (sql) => {
    statements.push(String(sql));
    return { rowCount: 0, rows: [] };
  } }, { created: 1_788_480_000 }, { ...session, currency: "usd" }, order), /PaymentIntent does not match/);
  assert.equal(statements.length, 1);
  assert.match(statements[0], /stripe_payment_intent_id IS NULL OR stripe_payment_intent_id = \$2/);

  await assert.rejects(() => eventInternals.ensurePaidJournal({ query: async () => { throw new Error("query should not run"); } }, { created: 1_788_480_000 }, {
    ...session,
    currency: "usd",
    total_details: { amount_tax: 1 },
  }, order), /Stripe tax does not reconcile/);
});

test("reclaims expired processing leases without allowing stale workers to overwrite them", async () => {
  const statements = [];
  const client = {
    query: async (sql) => {
      statements.push(String(sql));
      return String(sql).includes("RETURNING we.*") ? { rows: [] } : { rows: [], rowCount: 0 };
    },
    release() {},
  };
  await claimStripeEvents({ connect: async () => client }, "worker-current", 20);
  assert.match(statements.join("\n"), /processing_status = 'processing' AND locked_until < now\(\)/);
  let retryQuery;
  await eventInternals.retryEvent({ query: async (sql, values) => { retryQuery = { sql, values }; return { rowCount: 1 }; } }, {
    stripe_event_id: "evt_lease",
    attempts: 2,
    locked_by: "worker-original",
  }, new Error("transient"));
  assert.match(retryQuery.sql, /locked_by = \$5/);
  assert.equal(retryQuery.values[4], "worker-original");
});

test("retries refunds that arrive before their captured payment event", async () => {
  const statements = [];
  const client = { query: async (sql) => {
    statements.push(String(sql));
    if (String(sql).includes("FROM checkout_sessions cs")) {
      return { rows: [{ id: "order-1", payment_status: "checkout_open", captured_cents: "0", currency: "usd" }] };
    }
    throw new Error("Refund processing advanced before a captured payment existed");
  } };
  await assert.rejects(() => eventInternals.applyEvent(client, {
    event_type: "refund.updated",
    stripe_event_id: "evt_refund_early",
    payload: { created: 1_788_480_000, data: { object: { id: "re_early", status: "succeeded", amount: 1000, currency: "usd", payment_intent: "pi_early" } } },
  }), /waiting for its captured payment event/);
  assert.equal(statements.length, 1);
});
