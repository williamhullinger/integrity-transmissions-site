import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _internals: checkout } = require("../../../netlify/functions/reman-checkout.js");
const { _internals: status } = require("../../../netlify/functions/reman-order-status.js");
const { _internals: webhook } = require("../../../netlify/functions/stripe-webhook.js");

const selected = {
  candidate: {
    family: "10R80",
    transmission: "10R80 / Automatic 10 Speed",
    description: "10R80 remanufactured transmission",
    coreCharge: 1500,
  },
  upgrade: {
    name: "1000",
    description: "Heavy-duty package",
    stock: { quantity: 2, location: "Omaha Warehouse" },
  },
  packageData: {
    warranty: "36 months, Unlimited miles",
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
  termsAccepted: true,
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

const customerParams = calls.customers[0].params;
const sessionParams = calls.sessions[0].params;
assert.equal(customerParams.shipping.address.postal_code, "65807");
assert.equal(sessionParams.customer, "cus_test_checkout");
assert.equal(sessionParams.automatic_tax.enabled, true);
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
assert.doesNotMatch(notificationRequests[0].body, /wholesale/i);
assert.equal(webhookUpdates[0].params.metadata.order_state, "paid_fitment_review");

console.log("Reman checkout test passed: server-priced Stripe Checkout, automatic tax, itemized core/freight, status and paid-order notification.");
