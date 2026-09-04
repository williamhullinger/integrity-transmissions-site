import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { createInternalFreightHandler } from "../server/internal-freight.mjs";
import { createInternalIngestHandler, _internals as ingestInternals } from "../server/internal-ingest.mjs";
import { reconcileStripe } from "../server/reconciliation.mjs";
import { createStripeWebhookHandler } from "../server/stripe-webhook.mjs";

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
  assert.equal(ingestInternals.verifySignature({ raw, timestamp: String(Number(timestamp) - 301), signature, secret }), false);
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
