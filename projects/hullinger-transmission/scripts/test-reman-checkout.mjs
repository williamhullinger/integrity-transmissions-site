import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { _internals: checkout } = require("../../../netlify/functions/reman-checkout.js");
const { _internals: freightAssistance } = require("../../../netlify/functions/reman-freight-assistance.js");
const { _internals: status } = require("../../../netlify/functions/reman-order-status.js");
const { _internals: webhook } = require("../../../netlify/functions/stripe-webhook.js");

const storefrontHtml = readFileSync(resolve(import.meta.dirname, "../reman-transmissions.html"), "utf8");
for (const consentName of [
  "purchase-terms-acceptance",
  "core-warranty-acknowledgment",
  "electronic-records-consent",
]) {
  assert.match(storefrontHtml, new RegExp(`name=["']${consentName}["'][^>]*required`, "i"), `${consentName} must be an affirmative required checkbox`);
}
assert.match(storefrontHtml, /\/legal\/reman-policy-bundle-2026-09-04/);
assert.match(storefrontHtml, /href=["']\/privacy["']/);

const selected = {
  candidate: {
    family: "10R80",
    transmission: "10R80 / Automatic 10 Speed",
    description: "10R80 remanufactured transmission",
    partUid: "ace-part-test-123",
    coreCharge: 1500,
  },
  upgrade: {
    name: "1000",
    description: "Heavy-duty package",
    stock: { quantity: 2, location: "Omaha Warehouse" },
  },
  packageData: {
    warranty: "36 months, Unlimited miles",
    wholesale: 3600,
    integrityRecommendedRetail: 4100,
  },
};

const quote = {
  vin: "1FTFW1E50JFA00000",
  selectionId: "selection_test_1234567890123456",
  selected,
  availability: { code: "in_stock", orderable: true },
  freightRequest: {
    address: {
      addressLine1: "123 Main Street",
      addressLine2: "Suite A",
      city: "Springfield",
      state: "MO",
      postalCode: "65807",
    },
    roundTrip: true,
  },
  rates: [{
    rateId: "rate_test_12345678901234567890",
    carrier: "Test Freight",
    transitDays: 2,
    oneWay: 225,
    roundTrip: true,
    customerFreightTotal: 450,
  }],
};

const payload = {
  vin: quote.vin,
  selectionId: quote.selectionId,
  freightRateId: quote.rates[0].rateId,
  name: "Test Customer",
  email: "customer@example.com",
  phone: "417-555-0100",
  addressLine1: "123 Main Street",
  addressLine2: "Suite A",
  city: "Springfield",
  state: "MO",
  postalCode: "65807",
  deliveryLocation: "Repair shop or commercial dock",
  coreReturnFreight: "Include delivery and prepaid core return",
  coreStatus: "Original transmission available",
  installerStatus: "Qualified installer selected",
  programmingCapability: "Installer can program and perform relearn",
  vehicle: "2018 Ford F-150",
  engine: "5.0L • 8-cylinder",
  driveType: "4WD",
  mileage: "125000",
  vehicleUse: "Daily driving",
  message: "No modifications",
  purchaseTermsAccepted: true,
  coreWarrantyAcknowledged: true,
  electronicRecordsConsented: true,
  "catalog-unit-price": "4100.00",
  "catalog-core-deposit": "1500.00",
  checkoutAttemptId: "123e4567-e89b-12d3-a456-426614174000",
  checkoutExpiresAt: Math.floor((Date.now() + 36 * 60 * 1000) / 1000),
};

const calls = { customers: [], sessions: [] };
const fakeStripe = {
  customers: {
    create: async (params, options) => {
      calls.customers.push({ params, options });
      return { id: "cus_test_checkout" };
    },
  },
  checkout: {
    sessions: {
      create: async (params, options) => {
        calls.sessions.push({ params, options });
        return {
          id: "cs_test_123456789012345678901234",
          created: Math.floor(Date.now() / 1_000),
          url: "https://checkout.stripe.com/c/pay/test-session",
          expires_at: params.expires_at,
        };
      },
    },
  },
};

process.env.REMAN_CHECKOUT_ENABLED = "true";
const handler = checkout.createCheckoutHandler({
  stripeFactory: () => fakeStripe,
  quoteLoader: async () => quote,
});

const response = await handler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.20" },
  body: JSON.stringify({ ...payload, "catalog-freight-total": "1.00" }),
});
assert.equal(response.statusCode, 200, response.body);
assert.equal(calls.customers.length, 1);
assert.equal(calls.sessions.length, 1);

const oversizedCheckout = await handler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.24" },
  body: JSON.stringify({ ...payload, padding: "x".repeat(25_000) }),
});
assert.equal(oversizedCheckout.statusCode, 413);
assert.equal(calls.sessions.length, 1, "An oversized request must not reach Stripe");

const customerParams = calls.customers[0].params;
const sessionParams = calls.sessions[0].params;
assert.equal(customerParams.shipping.address.postal_code, "65807");
assert.equal(sessionParams.customer, "cus_test_checkout");
assert.equal(sessionParams.automatic_tax.enabled, true);
assert.equal("shipping" in sessionParams.payment_intent_data, false);
assert.equal(sessionParams.invoice_creation.enabled, true);
assert.equal(sessionParams.origin_context, "web");
assert.match(sessionParams.integration_identifier, /[a-z]{8}$/);
assert.equal("payment_method_types" in sessionParams, false);
assert.deepEqual(sessionParams.line_items.map((item) => item.price_data.unit_amount), [410000, 150000, 45000]);
assert.deepEqual(sessionParams.line_items.map((item) => item.price_data.product_data.tax_code), [
  "txcd_99999999",
  "txcd_99999999",
  "txcd_92010001",
]);
assert.deepEqual(sessionParams.line_items.map((item) => item.metadata.order_component), [
  "transmission",
  "refundable_core_deposit",
  "freight",
]);
assert.doesNotMatch(JSON.stringify(sessionParams), /wholesale|ACE authenticated|Distributor Partner/i);
assert.equal(calls.sessions[0].options.idempotencyKey.startsWith("reman_session_"), true);
assert.equal(sessionParams.metadata.terms_version, "2026-09-04");
assert.equal(sessionParams.metadata.acceptance_method, "clickwrap");
assert.equal(sessionParams.metadata.purchase_terms_accepted, "true");
assert.equal(sessionParams.metadata.core_warranty_acknowledged, "true");
assert.equal(sessionParams.metadata.electronic_records_consented, "true");
assert.equal(sessionParams.metadata.policy_bundle_url, "https://integritydrivetrain.com/legal/reman-policy-bundle-2026-09-04");
assert.equal(sessionParams.metadata.warranty_provider, "ACE Transmission Remanufacturing");
assert.equal(sessionParams.metadata.warranty_publication_url, "https://acetransmissionreman.com/warranty/");
assert.equal(sessionParams.metadata.warranty_publication_checked_on, "2026-09-04");
const termsPath = resolve(import.meta.dirname, "../legal/reman-policy-bundle-2026-09-04.html");
const currentTermsHash = createHash("sha256").update(readFileSync(termsPath)).digest("hex");
assert.equal(sessionParams.metadata.terms_sha256, currentTermsHash, "Checkout terms fingerprint must match the published terms file");
assert.match(sessionParams.metadata.terms_accepted_at, /^\d{4}-\d{2}-\d{2}T/);

for (const [field, message] of [
  ["purchaseTermsAccepted", /purchase agreement/i],
  ["coreWarrantyAcknowledged", /core-return, limited warranty and installation/i],
  ["electronicRecordsConsented", /electronic records and signatures/i],
]) {
  assert.throws(() => checkout.customerInput({ ...payload, [field]: false }), message);
}

const tamperedPrice = await handler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.22" },
  body: JSON.stringify({ ...payload, "catalog-unit-price": "1.00" }),
});
assert.equal(tamperedPrice.statusCode, 409, tamperedPrice.body);
assert.equal(JSON.parse(tamperedPrice.body).priceChanged, true);
assert.equal(calls.sessions.length, 1, "A browser-supplied price mismatch must not create a Stripe session");

const staleRate = await handler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.21" },
  body: JSON.stringify({ ...payload, freightRateId: "stale_rate_12345678901234567890" }),
});
assert.equal(staleRate.statusCode, 409, staleRate.body);
assert.equal(JSON.parse(staleRate.body).freightChanged, true);
assert.equal(calls.sessions.length, 1, "A changed freight rate must not create a Stripe session");

const zeroWholesaleHandler = checkout.createCheckoutHandler({
  stripeFactory: () => fakeStripe,
  quoteLoader: async () => ({
    ...quote,
    selected: {
      ...selected,
      packageData: { ...selected.packageData, integrityRecommendedRetail: 500 },
    },
  }),
});
const zeroWholesaleResponse = await zeroWholesaleHandler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.23" },
  body: JSON.stringify({ ...payload, "catalog-unit-price": "500.00" }),
});
assert.equal(zeroWholesaleResponse.statusCode, 409, zeroWholesaleResponse.body);
assert.equal(calls.sessions.length, 1, "A missing wholesale price must never create a Stripe session");

const mismatchedWholesaleHandler = checkout.createCheckoutHandler({
  stripeFactory: () => fakeStripe,
  quoteLoader: async () => ({
    ...quote,
    selected: { ...selected, packageData: { ...selected.packageData, wholesale: 3599 } },
  }),
});
const mismatchedWholesaleResponse = await mismatchedWholesaleHandler({
  httpMethod: "POST",
  headers: { origin: "https://integritydrivetrain.com", "x-nf-client-connection-ip": "203.0.113.25" },
  body: JSON.stringify(payload),
});
assert.equal(mismatchedWholesaleResponse.statusCode, 409, mismatchedWholesaleResponse.body);
assert.equal(calls.sessions.length, 1, "Checkout must enforce the exact $500 server-side margin");

const orderForOffice = await checkout.verifiedOrder(payload, async () => quote);
orderForOffice.termsAcceptedAt = new Date().toISOString();
const officeSession = await checkout.createStripeCheckout({
  stripe: fakeStripe,
  order: orderForOffice,
  attemptKey: "office-sync-test-1234567890",
  expiresAt: payload.checkoutExpiresAt,
});
process.env.OFFICE_ORDER_INGEST_URL = "https://office.integritydrivetrain.com/.netlify/functions/internal-ingest";
process.env.OFFICE_INTERNAL_INGEST_SECRET = "s".repeat(64);
let officeSyncRequest;
await checkout.syncOfficeOrder({
  order: orderForOffice,
  session: officeSession,
  attemptKey: "office-sync-test-1234567890",
  expiresAt: payload.checkoutExpiresAt,
  requestId: "request-office-sync",
  fetchImpl: async (url, options) => {
    officeSyncRequest = { url: String(url), options };
    return new Response("ok", { status: 201 });
  },
});
delete process.env.OFFICE_ORDER_INGEST_URL;
delete process.env.OFFICE_INTERNAL_INGEST_SECRET;
assert.equal(officeSyncRequest.url, "https://office.integritydrivetrain.com/.netlify/functions/internal-ingest");
assert.equal(officeSyncRequest.options.redirect, "error");
assert.match(officeSyncRequest.options.headers["X-Office-Signature"], /^sha256=[a-f0-9]{64}$/);
const officePayload = JSON.parse(officeSyncRequest.options.body);
assert.equal(officePayload.supplierUnitCostCents, 360000);
assert.equal(officePayload.stripeSessionCreatedAt, officeSession.created);
assert.equal(officePayload.customerUnitPriceCents - officePayload.supplierUnitCostCents, 50000);
assert.equal(officePayload.supplierSnapshot.partUid, "ace-part-test-123");
assert.equal(officePayload.supplierSnapshot.warrantyProvider, "ACE Transmission Remanufacturing");
assert.equal(officePayload.policyAcceptance.version, "2026-09-04");
assert.equal(officePayload.policyAcceptance.sha256, currentTermsHash);
assert.equal(officePayload.policyAcceptance.acceptanceMethod, "clickwrap");
assert.equal(officePayload.policyAcceptance.purchaseTermsAccepted, true);
assert.equal(officePayload.policyAcceptance.coreWarrantyAcknowledged, true);
assert.equal(officePayload.policyAcceptance.electronicRecordsConsented, true);

const assistancePayload = freightAssistance.normalizeRequest({
  publicReference: "123e4567-e89b-12d3-a456-426614174000",
  vin: payload.vin,
  name: payload.name,
  email: payload.email,
  phone: payload.phone,
  postalCode: payload.postalCode,
  region: payload.state,
  locationType: payload.deliveryLocation,
  requestedSelectionId: payload.selectionId,
  requestedPackage: "1000",
  failureCode: "supplier_freight_rate_unavailable",
  failureRequestId: "request-freight-123",
});
process.env.OFFICE_FREIGHT_INGEST_URL = "https://office.integritydrivetrain.com/.netlify/functions/internal-freight";
process.env.OFFICE_INTERNAL_INGEST_SECRET = "f".repeat(64);
let freightOfficeRequest;
const forwardedAssistance = await freightAssistance.forwardToOffice(assistancePayload, {
  fetchImpl: async (url, options) => {
    freightOfficeRequest = { url: String(url), options };
    return new Response("ok", { status: 201 });
  },
});
delete process.env.OFFICE_FREIGHT_INGEST_URL;
delete process.env.OFFICE_INTERNAL_INGEST_SECRET;
assert.equal(forwardedAssistance.queued, true);
assert.equal(freightOfficeRequest.url, "https://office.integritydrivetrain.com/.netlify/functions/internal-freight");
assert.equal(freightOfficeRequest.options.redirect, "error");
assert.match(freightOfficeRequest.options.headers["X-Office-Signature"], /^sha256=[a-f0-9]{64}$/);
assert.equal(JSON.parse(freightOfficeRequest.options.body).phone, payload.phone);

const promotedOrder = await checkout.verifiedOrder(payload, async () => quote);
process.env.OFFICE_PROMOTION_RESERVE_URL = "https://office.integritydrivetrain.com/.netlify/functions/internal-promotion";
process.env.OFFICE_INTERNAL_INGEST_SECRET = "p".repeat(64);
let promotionOfficeRequest;
await checkout.reserveOfficePromotion({
  order: promotedOrder,
  payload: { ...payload, promotionCode: "SAVE-50" },
  attemptKey: "promotion-attempt-1234567890",
  expiresAt: payload.checkoutExpiresAt,
  requestId: "request-promotion-sync",
  fetchImpl: async (url, options) => {
    promotionOfficeRequest = { url: String(url), options };
    return new Response(JSON.stringify({
      accepted: true,
      reservationId: "7f573082-2a5b-4d7f-a05f-2af8721af43b",
      code: "SAVE-50",
      discountCents: 5000,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  },
});
delete process.env.OFFICE_PROMOTION_RESERVE_URL;
delete process.env.OFFICE_INTERNAL_INGEST_SECRET;
assert.equal(promotionOfficeRequest.url, "https://office.integritydrivetrain.com/.netlify/functions/internal-promotion");
assert.equal(promotionOfficeRequest.options.redirect, "error");
assert.match(promotionOfficeRequest.options.headers["X-Office-Signature"], /^sha256=[a-f0-9]{64}$/);
assert.equal(promotedOrder.listUnitPrice, 410000);
assert.equal(promotedOrder.unitPrice, 405000);
assert.equal(promotedOrder.promotionDiscount, 5000);
const promotedSession = await checkout.createStripeCheckout({
  stripe: fakeStripe,
  order: promotedOrder,
  attemptKey: "promotion-attempt-1234567890",
  expiresAt: payload.checkoutExpiresAt,
});
assert.equal(calls.sessions.at(-1).params.line_items[0].price_data.unit_amount, 405000);
assert.match(calls.sessions.at(-1).params.line_items[0].price_data.product_data.description, /SAVE-50/);
assert.equal(checkout.officeSnapshot({ order: promotedOrder, session: promotedSession, attemptKey: "promotion-attempt-1234567890", expiresAt: payload.checkoutExpiresAt, requestId: "request" }).promotionDiscountCents, 5000);

const statusHandler = status.createStatusHandler({
  stripeFactory: () => ({
    checkout: {
      sessions: {
        retrieve: async () => ({
          id: "cs_test_123456789012345678901234",
          status: "complete",
          payment_status: "paid",
          amount_total: 604500,
          currency: "usd",
          total_details: { amount_tax: 49500 },
          customer_details: { email: "customer@example.com" },
          metadata: { order_type: "reman_transmission", application: "10R80", upgrade: "1000", warranty: "36 months" },
          invoice: { hosted_invoice_url: "https://invoice.stripe.com/i/test" },
        }),
      },
    },
  }),
});
const statusResponse = await statusHandler({
  httpMethod: "GET",
  headers: { origin: "https://integritydrivetrain.com" },
  queryStringParameters: { session_id: "cs_test_123456789012345678901234" },
});
assert.equal(statusResponse.statusCode, 200, statusResponse.body);
assert.equal(JSON.parse(statusResponse.body).paymentStatus, "paid");
assert.equal(JSON.parse(statusResponse.body).email, "cu******@example.com");

const webhookUpdates = [];
const notificationRequests = [];
const paidSession = {
  id: "cs_test_123456789012345678901234",
  payment_status: "paid",
  amount_total: 604500,
  total_details: { amount_tax: 49500 },
  metadata: sessionParams.metadata,
  customer: {
    name: "Test Customer",
    email: "customer@example.com",
    phone: "417-555-0100",
    shipping: { name: "Test Customer", address: customerParams.shipping.address },
  },
};
const notified = await webhook.processPaidCheckout({
  checkout: {
    sessions: {
      retrieve: async () => paidSession,
      update: async (id, params) => webhookUpdates.push({ id, params }),
    },
  },
}, paidSession, async (url, options) => {
  notificationRequests.push({ url, body: String(options.body) });
  return new Response("ok", { status: 200 });
});
assert.equal(notified, true);
assert.equal(notificationRequests.length, 1);
assert.match(notificationRequests[0].body, /form-name=reman-paid-order/);
assert.match(notificationRequests[0].body, /payment-verification=Confirm\+this\+payment\+directly\+in\+Stripe/);
assert.doesNotMatch(notificationRequests[0].body, /wholesale/i);
assert.equal(webhookUpdates.length, 2);
assert.equal(webhookUpdates[0].params.metadata.order_state, "paid_risk_review");
assert.equal(webhookUpdates[0].params.metadata.notification_state, "pending");
assert.equal(webhookUpdates[1].params.metadata.order_state, "paid_risk_review");
assert.equal(webhookUpdates[1].params.metadata.notification_state, "sent");

const failedUpdates = [];
const ignoredLateFailure = await webhook.processFailedCheckout({
  checkout: {
    sessions: {
      retrieve: async () => ({ ...paidSession, metadata: { ...paidSession.metadata, order_state: "paid_risk_review" } }),
      update: async (id, params) => failedUpdates.push({ id, params }),
    },
  },
}, paidSession, "evt_late_failure");
assert.equal(ignoredLateFailure, false);
assert.equal(failedUpdates.length, 0, "A late failure event must not regress an already-paid order");

const failedSession = { ...paidSession, payment_status: "unpaid", metadata: { ...paidSession.metadata, order_state: "payment_pending" } };
const recordedFailure = await webhook.processFailedCheckout({
  checkout: {
    sessions: {
      retrieve: async () => failedSession,
      update: async (id, params) => failedUpdates.push({ id, params }),
    },
  },
}, failedSession, "evt_current_failure");
assert.equal(recordedFailure, true);
assert.equal(failedUpdates[0].params.metadata.order_state, "payment_failed");
assert.equal(failedUpdates[0].params.metadata.last_stripe_event, "evt_current_failure");

console.log("Reman checkout test passed: server-priced Stripe Checkout, automatic tax, itemized core/freight, status, notifications, and monotonic payment state.");
