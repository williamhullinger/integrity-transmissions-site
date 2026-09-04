import assert from "node:assert/strict";
import test from "node:test";
import { createOfficeApi } from "../server/office-api.mjs";
import { PostgresOfficeRepository } from "../server/repository.mjs";

const identity = { subject: "auth0|staff" };
const principal = (roles) => ({ id: "c59c09f8-ef0f-4a84-9346-50a10f04a77c", subject: identity.subject, email: "staff@example.com", name: "Staff", roles });

const event = (path, { method = "GET", body, headers = {}, queryStringParameters } = {}) => ({
  httpMethod: method,
  path: `/api${path}`,
  headers,
  body: body === undefined ? undefined : JSON.stringify(body),
  queryStringParameters,
});

const repositoryFor = (roles, overrides = {}) => ({
  getStaffPrincipal: async () => principal(roles),
  dashboard: async () => ({ activeOrders: 2 }),
  listOrders: async (options) => ({ items: [], page: options.page, pageSize: options.pageSize, total: 0 }),
  getOrder: async () => ({ id: "order" }),
  listStaff: async () => [],
  listPromotions: async () => [],
  listFreightExceptions: async () => ({ items: [], page: 1, pageSize: 25, total: 0 }),
  listAssignableStaff: async () => [],
  listSystemExceptions: async () => ({ items: [], page: 1, pageSize: 25, total: 0 }),
  financeReport: async ({ startAt, endAt }) => ({ startAt, endAt, accounts: [] }),
  getReconciliationByKey: async () => null,
  recordReconciliation: async (data) => ({ repeated: false, data }),
  recentAudit: async () => ({ items: [], total: 0 }),
  executeIdempotent: async ({ action }) => ({ repeated: false, ...await action({}) }),
  createPromotion: async (_client, input) => ({ id: "b3a69431-8ac2-4c67-b89a-a7dd28fdbd7f", ...input }),
  ...overrides,
});

const mutationHeaders = Object.freeze({
  origin: "https://office.integritydrivetrain.com",
  "content-type": "application/json",
  "idempotency-key": "command:1234567890abcdef",
});

test("serves only non-secret Auth0 browser configuration before sign-in", async () => {
  const handler = createOfficeApi({ env: { OFFICE_AUTH0_DOMAIN: "tenant.auth0.com", OFFICE_AUTH0_CLIENT_ID: "client", OFFICE_AUTH0_AUDIENCE: "office-api" } });
  const response = await handler(event("/config"));
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(body.data.auth, { domain: "tenant.auth0.com", clientId: "client", audience: "office-api" });
  assert.doesNotMatch(response.body, /secret|DATABASE_URL|STRIPE_RESTRICTED_KEY/);
});

test("enforces database-backed roles on every protected route", async () => {
  const viewer = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["viewer"]) });
  assert.equal((await viewer(event("/dashboard"))).statusCode, 200);
  assert.equal((await viewer(event("/promotions"))).statusCode, 403);
  assert.equal((await viewer(event("/freight-exceptions"))).statusCode, 403);
  assert.equal((await viewer(event("/audit"))).statusCode, 403);

  const finance = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["finance"]) });
  assert.equal((await finance(event("/promotions"))).statusCode, 200);
  assert.equal((await finance(event("/reports/finance"))).statusCode, 200);
  assert.equal((await finance(event("/freight-exceptions"))).statusCode, 403);
});

test("requires idempotency and creates unapproved margin-protected promotions", async () => {
  const handler = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["administrator"]) });
  const payload = { code: "FALL-500", amountOffCents: 5000, startsAt: "2026-09-04T00:00:00Z", minimumMarginCents: 50000, reason: "September campaign" };
  const missingKey = await handler(event("/promotions", { method: "POST", body: payload, headers: { origin: "https://office.integritydrivetrain.com", "content-type": "application/json" } }));
  assert.equal(missingKey.statusCode, 400);
  const created = await handler(event("/promotions", { method: "POST", body: payload, headers: { origin: "https://office.integritydrivetrain.com", "content-type": "application/json", "idempotency-key": "promotion:1234567890abcdef" } }));
  assert.equal(created.statusCode, 201, created.body);
  assert.equal(JSON.parse(created.body).data.code, "FALL-500");
  assert.equal(JSON.parse(created.body).data.minimumMarginCents, 50000);
});

test("requires operations access and structured evidence for fulfillment commands", async () => {
  const orderId = "a1c342f6-0dd5-4e1a-a839-560bf0e11a21";
  const recorded = [];
  const operations = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["operations"], {
    recordFitmentReview: async (_client, input) => { recorded.push(input); return { id: "review", ...input }; },
    recordSupplierOrder: async (_client, input) => ({ id: "supplier", ...input }),
    recordShipment: async (_client, input) => ({ id: "shipment", ...input }),
  }) });
  const approved = await operations(event(`/orders/${orderId}/fitment-review`, {
    method: "POST",
    headers: mutationHeaders,
    body: { version: 3, decision: "approved", supplierPartUid: "ACE-10R80-001", reason: "VIN and catalog application verified" },
  }));
  assert.equal(approved.statusCode, 201, approved.body);
  assert.equal(recorded[0].supplierPartUid, "ACE-10R80-001");

  const viewer = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["viewer"]) });
  assert.equal((await viewer(event(`/orders/${orderId}/shipment`, {
    method: "POST", headers: mutationHeaders, body: { version: 3, carrier: "Carrier", trackingNumber: "PRO123", reason: "Shipped" },
  }))).statusCode, 403);

  const incomplete = await operations(event(`/orders/${orderId}/shipment`, {
    method: "POST", headers: mutationHeaders, body: { version: 3, carrier: "Carrier", reason: "Shipped" },
  }));
  assert.equal(incomplete.statusCode, 400);
});

test("separates finance refund classification from operations access", async () => {
  const orderId = "a1c342f6-0dd5-4e1a-a839-560bf0e11a21";
  const refundId = "re_controlled123";
  const finance = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["finance"], {
    classifyRefund: async (_client, input) => input,
  }) });
  const response = await finance(event(`/orders/${orderId}/refunds/${refundId}/classification`, {
    method: "POST",
    headers: mutationHeaders,
    body: { allocations: [{ category: "transmission", amountCents: 10000 }, { category: "sales_tax", amountCents: 825 }], reason: "Matched to Stripe refund" },
  }));
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(JSON.parse(response.body).data.allocations.length, 2);

  const operations = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["operations"]) });
  assert.equal((await operations(event(`/orders/${orderId}/refunds/${refundId}/classification`, {
    method: "POST", headers: mutationHeaders, body: { allocations: [{ category: "other", amountCents: 10825 }], reason: "Attempt" },
  }))).statusCode, 403);
});

test("limits staff access management to administrators", async () => {
  const createdStaffId = "10cf4783-40b7-4d9f-9d3a-d3df89b131c0";
  const administrator = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["administrator"], {
    createStaff: async (_client, input) => ({ id: createdStaffId, ...input, active: true }),
  }) });
  const created = await administrator(event("/staff", {
    method: "POST",
    headers: mutationHeaders,
    body: { auth0Subject: "auth0|new-staff", email: "New.Staff@example.com", displayName: "New Staff", roles: ["viewer", "operations"], reason: "Order operations assignment" },
  }));
  assert.equal(created.statusCode, 201, created.body);
  assert.equal(JSON.parse(created.body).data.email, "new.staff@example.com");

  const finance = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["finance"]) });
  assert.equal((await finance(event("/staff"))).statusCode, 403);
});

test("uses the configured Office origin for every staff mutation", async () => {
  const handler = createOfficeApi({
    authenticate: async () => identity,
    repository: repositoryFor(["administrator"]),
    env: { OFFICE_ORIGIN: "https://office-staging.integritydrivetrain.com" },
  });
  const response = await handler(event("/promotions", {
    method: "POST",
    headers: mutationHeaders,
    body: { code: "ORIGIN-CHECK", amountOffCents: 100, startsAt: "2026-09-04T00:00:00Z", reason: "Origin control test" },
  }));
  assert.equal(response.statusCode, 403);
});

test("reserves core forfeiture and verified-refund completion for finance", async () => {
  const orderId = "a1c342f6-0dd5-4e1a-a839-560bf0e11a21";
  const payload = { target: "forfeited", version: 4, reason: "Deadline passed after documented follow-up" };
  const operations = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["operations"]) });
  assert.equal((await operations(event(`/orders/${orderId}/core-transition`, { method: "POST", headers: mutationHeaders, body: payload }))).statusCode, 403);

  const finance = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["finance"], {
    transitionOrder: async (_client, input) => ({ id: input.id, state: input.target, version: input.version + 1 }),
  }) });
  const forfeited = await finance(event(`/orders/${orderId}/core-transition`, { method: "POST", headers: mutationHeaders, body: payload }));
  assert.equal(forfeited.statusCode, 200, forfeited.body);
  const operationsTarget = await finance(event(`/orders/${orderId}/core-transition`, {
    method: "POST", headers: mutationHeaders, body: { ...payload, target: "received" },
  }));
  assert.equal(operationsTarget.statusCode, 403);
});

test("persists Stripe reconciliation and rejects an idempotency-key body mismatch", async () => {
  const result = {
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-09-05T00:00:00.000Z",
    stripe: { count: 1, totalCents: 10000 },
    office: { count: 1, totalCents: 10000 },
    unmatchedStripe: [],
    unmatchedOffice: [],
    amountMismatches: [],
    balanced: true,
  };
  let stored;
  const finance = createOfficeApi({
    authenticate: async () => identity,
    repository: repositoryFor(["finance"], {
      recordReconciliation: async (data, context) => { stored = { data, context }; return { repeated: false, data: result }; },
    }),
    stripeFactory: () => ({ checkout: { sessions: {} } }),
    reconcileStripe: async () => result,
  });
  const response = await finance(event("/reconciliation", { method: "POST", headers: mutationHeaders, body: { days: 7 } }));
  assert.equal(response.statusCode, 201, response.body);
  assert.equal(stored.data.balanced, true);
  assert.equal(stored.context.key, mutationHeaders["idempotency-key"]);
  assert.match(stored.context.requestHash, /^[a-f0-9]{64}$/);

  const mismatch = createOfficeApi({
    authenticate: async () => identity,
    repository: repositoryFor(["finance"], { getReconciliationByKey: async () => ({ data: result, requestHash: "0".repeat(64) }) }),
  });
  const mismatchResponse = await mismatch(event("/reconciliation", { method: "POST", headers: mutationHeaders, body: { days: 3 } }));
  assert.equal(mismatchResponse.statusCode, 409);
});

test("restricts payload-redacted system recovery to administrators", async () => {
  const rawRow = {
    exception_kind: "stripe_event",
    exception_id: "evt_failed",
    event_type: "checkout.session.completed",
    status: "dead_letter",
    attempts: 10,
    manual_requeues: 0,
    next_attempt_at: "2026-09-05T00:00:00Z",
    occurred_at: "2026-09-04T00:00:00Z",
    last_error: "temporary database failure",
    total_count: 1,
    payload: { customer_email: "must-not-leak@example.com" },
  };
  const repository = new PostgresOfficeRepository({ query: async () => ({ rows: [rawRow] }) });
  const listed = await repository.listSystemExceptions({ page: 1, pageSize: 25 });
  assert.equal(listed.items[0].id, "evt_failed");
  assert.doesNotMatch(JSON.stringify(listed), /must-not-leak/);

  let requeued;
  const administrator = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["administrator"], {
    requeueSystemException: async (_client, input) => { requeued = input; return { data: { ...input, status: "retry" }, beforeValue: { status: "dead_letter", attempts: 10 } }; },
  }) });
  const response = await administrator(event("/system-exceptions/requeue", {
    method: "POST",
    headers: mutationHeaders,
    body: { kind: "stripe_event", id: "evt_failed", reason: "Database connectivity restored and verified" },
  }));
  assert.equal(response.statusCode, 200, response.body);
  assert.deepEqual(requeued, { kind: "stripe_event", id: "evt_failed" });

  const operations = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["operations"]) });
  assert.equal((await operations(event("/system-exceptions"))).statusCode, 403);
});

test("serializes reconciliation exception arrays as JSONB parameters", async () => {
  let insert;
  const row = {
    id: "d41314de-fb3d-48ed-a915-2022725c62a3",
    period_start: "2026-09-01T00:00:00Z",
    period_end: "2026-09-05T00:00:00Z",
    stripe_payment_count: 2,
    stripe_payment_cents: "30000",
    office_payment_count: 1,
    office_payment_cents: "10000",
    unmatched_stripe_ids: ["cs_missing"],
    unmatched_office_ids: [],
    amount_mismatches: [{ stripeSessionId: "cs_mismatch", stripeCents: 20000, officeCents: 10000 }],
    created_at: "2026-09-05T00:00:00Z",
  };
  const client = {
    query: async (sql, values) => {
      if (String(sql).includes("INSERT INTO stripe_reconciliation_runs")) {
        insert = { sql: String(sql), values };
        return { rows: [row], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = new PostgresOfficeRepository({ connect: async () => client });
  const data = {
    startAt: row.period_start,
    endAt: row.period_end,
    stripe: { count: 2, totalCents: 30000 },
    office: { count: 1, totalCents: 10000 },
    unmatchedStripe: row.unmatched_stripe_ids,
    unmatchedOffice: row.unmatched_office_ids,
    amountMismatches: row.amount_mismatches,
  };
  await repository.recordReconciliation(data, {
    key: "reconcile:jsonb:123456",
    requestHash: "a".repeat(64),
    principal: principal(["finance"]),
    requestId: "request-jsonb",
  });
  assert.match(insert.sql, /\$7::jsonb,\$8::jsonb,\$9::jsonb/);
  assert.equal(insert.values[6], JSON.stringify(row.unmatched_stripe_ids));
  assert.equal(insert.values[7], "[]");
  assert.equal(insert.values[8], JSON.stringify(row.amount_mismatches));
});

test("maps every order-detail result set to the correct controlled record", async () => {
  const base = {
    id: "order-detail",
    public_order_number: "1042",
    customer_name: "Customer Name",
    customer_email: "customer@example.com",
    customer_phone: "417-555-0100",
    vin: "1FTFW1E50JFA00000",
    year: 2018,
    make: "Ford",
    model: "F-150",
    delivery_line1: "123 Main Street",
    delivery_line2: "Dock 2",
    delivery_city: "Springfield",
    delivery_region: "MO",
    delivery_postal_code: "65807",
    delivery_country_code: "US",
    delivery_location_type: "commercial",
    transmission_family: "10R80",
    package_name: "Base",
    list_unit_price_cents: "410000",
    customer_unit_price_cents: "405000",
    promotion_code: "SAVE50",
    promotion_discount_cents: "5000",
    core_deposit_cents: "150000",
    freight_charged_cents: "45000",
    supplier_unit_cost_cents: "360000",
    supplier_freight_cost_cents: "45000",
    collected_cents: "600000",
    payment_status: "disputed",
    fulfillment_status: "shipped",
    core_status: "awaiting_return",
    version: 8,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-04T00:00:00Z",
  };
  const pool = { query: async (sql) => {
    const statement = String(sql);
    if (statement.includes("SELECT o.*")) return { rows: [base] };
    if (statement.includes("FROM status_history")) return { rows: [{ workflow: "payment", from_state: "paid", to_state: "disputed", reason: "Stripe dispute", created_at: "2026-09-04T00:00:00Z" }] };
    if (statement.includes("FROM order_notes")) return { rows: [{ id: "note-1", note: "Customer confirmed dock hours.", author_name: "Operations Staff", created_at: "2026-09-03T00:00:00Z" }] };
    if (statement.includes("FROM payment_disputes")) return { rows: [{ stripe_dispute_id: "du_detail", stripe_charge_id: "ch_detail", amount_cents: "10000", currency: "usd", status: "needs_response", reason: "general", evidence_due_at: "2026-09-10T00:00:00Z", opened_at: "2026-09-04T00:00:00Z", closed_at: null, updated_at: "2026-09-04T00:00:00Z" }] };
    if (statement.includes("FROM supplier_orders")) return { rows: [{ supplier_name: "ACE", supplier_order_reference: "ACE-100", ordered_at: "2026-09-02T00:00:00Z", estimated_ship_at: "2026-09-05T00:00:00Z", shipped_at: "2026-09-04T00:00:00Z", carrier: "Carrier", tracking_number: "PRO100" }] };
    if (statement.includes("FROM core_returns")) return { rows: [{ due_at: "2026-10-01T00:00:00Z", received_at: null, accepted_at: null, rejected_at: null, rejection_reason: null, refund_due_cents: "150000", stripe_refund_id: null }] };
    if (statement.includes("FROM fitment_reviews")) return { rows: [{ supplier_part_uid: "ACE-10R80-001", decision: "approved", reason: "VIN verified", reviewed_at: "2026-09-01T12:00:00Z" }] };
    if (statement.includes("FROM payment_transactions pt")) return { rows: [{ id: "refund-row", stripe_object_id: "re_detail", amount_cents: "2500", currency: "usd", occurred_at: "2026-09-04T00:00:00Z", allocations: [{ category: "other", amountCents: 2500 }] }] };
    throw new Error(`Unexpected order-detail query: ${statement}`);
  } };
  const order = await new PostgresOfficeRepository(pool).getOrder("order-detail", { includeFinancials: true });
  assert.equal(order.deliveryAddress.postalCode, "65807");
  assert.equal(order.notes[0].authorName, "Operations Staff");
  assert.equal(order.disputes[0].stripeDisputeId, "du_detail");
  assert.equal(order.supplier.orderReference, "ACE-100");
  assert.equal(order.core.refundDueCents, 150000);
  assert.equal(order.fitment.supplierPartUid, "ACE-10R80-001");
  assert.equal(order.refunds[0].stripeRefundId, "re_detail");
});
