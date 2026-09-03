const crypto = require("node:crypto");
const Stripe = require("stripe");
const { _internals: ace } = require("./ace-lookup.js");
const { _internals: catalog } = require("./reman-catalog.js");
const { _internals: shipping } = require("./reman-shipping.js");

const SITE_URL = "https://integritydrivetrain.com";
const TERMS_VERSION = "2026-09-03";
const TERMS_SHA256 = "164638adeaa82c1287f590979560f2a966551afaa2b0bdda69dd1f66937e1ebf";
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;
const CHECKOUT_LIMIT = 6;
const requestCounts = new Map();

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const jsonResponse = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const allowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === SITE_URL) return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const withinCheckoutLimit = (key, now = Date.now()) => {
  if (requestCounts.size > 2_000) {
    for (const [entryKey, entry] of requestCounts) {
      if (now - entry.startedAt >= CHECKOUT_WINDOW_MS) requestCounts.delete(entryKey);
    }
  }
  const current = requestCounts.get(key);
  if (!current || now - current.startedAt >= CHECKOUT_WINDOW_MS) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= CHECKOUT_LIMIT;
};

const clean = (value, max = 500) => String(value || "")
  .replace(/[<>]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, max);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = (value) => String(value || "").replace(/\D/g, "");
const cents = (value) => Math.round(Number(value) * 100);
const dollars = (value) => (cents(value) / 100).toFixed(2);

const checkoutError = (statusCode, message, extra = {}) => Object.assign(new Error(message), { statusCode, extra });

const checkoutAttemptKey = (payload) => {
  const attemptId = clean(payload.checkoutAttemptId, 80);
  if (!/^[a-z0-9-]{16,80}$/i.test(attemptId)) throw checkoutError(400, "Please try the secure checkout again.");
  return crypto.createHash("sha256").update([
    "integrity-reman-checkout-v1",
    attemptId,
    ace.normalizeVin(payload.vin),
    clean(payload.selectionId, 64),
    clean(payload.freightRateId, 64),
    clean(payload.email, 160).toLowerCase(),
  ].join("|")).digest("hex").slice(0, 40);
};

const checkoutExpiry = (payload, now = Date.now()) => {
  const requested = Number(payload.checkoutExpiresAt);
  const minimum = Math.floor((now + 30 * 60 * 1000) / 1000);
  const maximum = Math.floor((now + 60 * 60 * 1000) / 1000);
  if (!Number.isInteger(requested) || requested < minimum || requested > maximum) {
    throw checkoutError(400, "Please try the secure checkout again.");
  }
  return requested;
};

const customerInput = (payload) => {
  const name = clean(payload.name, 120);
  const email = clean(payload.email, 160).toLowerCase();
  const phone = clean(payload.phone, 40);
  const address = shipping.normalizeFreightRequest(payload).address;
  const deliveryLocation = clean(payload.deliveryLocation || payload["delivery-location"], 80);
  const coreReturnFreight = clean(payload.coreReturnFreight || payload["core-return-freight"], 80);

  if (!name) throw checkoutError(400, "Enter the name for this order.");
  if (!emailPattern.test(email)) throw checkoutError(400, "Enter a valid email address.");
  if (phoneDigits(phone).length < 10) throw checkoutError(400, "Enter a valid phone number.");
  if (!shipping.validAddress(address)) throw checkoutError(400, "Enter a complete U.S. delivery address.");
  if (![
    "Repair shop or commercial dock",
    "Commercial address without dock",
    "Residential with liftgate needed",
  ].includes(deliveryLocation)) {
    throw checkoutError(409, "This delivery choice needs a personal quote before payment.", { assistedOrder: true });
  }
  if (![
    "Include delivery and prepaid core return",
    "Outbound delivery only — I will arrange the core return",
    "Include round-trip freight",
    "Quote outbound first",
  ].includes(coreReturnFreight)) {
    throw checkoutError(409, "Choose whether to include prepaid core-return shipping before checkout.");
  }
  if (payload.termsAccepted !== true) throw checkoutError(400, "Accept the order and core-return terms before checkout.");

  return { name, email, phone, address, deliveryLocation, coreReturnFreight };
};

const requiredChoice = (payload, camelName, formName, allowed, message) => {
  const value = clean(payload[camelName] || payload[formName], 160);
  if (!allowed.includes(value)) throw checkoutError(400, message);
  return value;
};

const findChosenRate = (quote, suppliedRateId) => {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(String(suppliedRateId || ""))) {
    throw checkoutError(400, "Choose a current delivery option before checkout.");
  }
  const rate = quote.rates.find((candidate) => shipping.sameOpaqueId(candidate.rateId, suppliedRateId));
  if (!rate) {
    throw checkoutError(409, "The delivery rate changed. Choose a refreshed option before continuing.", {
      freightChanged: true,
      checkedAt: new Date().toISOString(),
      rates: quote.rates,
      roundTrip: quote.freightRequest.roundTrip,
    });
  }
  return rate;
};

const verifiedOrder = async (payload, quoteLoader = shipping.loadFreightQuote) => {
  const customer = customerInput(payload);
  const quote = await quoteLoader(payload);
  const rate = findChosenRate(quote, payload.freightRateId);
  const { candidate, upgrade, packageData } = quote.selected;
  const unitPrice = cents(packageData.integrityRecommendedRetail);
  const coreDeposit = cents(candidate.coreCharge);
  const freight = cents(rate.customerFreightTotal);
  const expectedUnitPrice = cents(payload.expectedUnitPrice ?? payload["catalog-unit-price"]);
  const expectedCoreDeposit = cents(payload.expectedCoreDeposit ?? payload["catalog-core-deposit"]);

  if (!Number.isSafeInteger(unitPrice) || unitPrice <= 50_000) throw checkoutError(409, "Current online pricing is not available for this transmission.");
  if (!Number.isSafeInteger(coreDeposit) || coreDeposit < 0) throw checkoutError(409, "The current core deposit could not be confirmed.");
  if (!Number.isSafeInteger(freight) || freight < 50) throw checkoutError(409, "The current delivery rate could not be confirmed.");
  if (expectedUnitPrice !== unitPrice || expectedCoreDeposit !== coreDeposit) {
    throw checkoutError(409, "The package price or core deposit changed. Run the VIN lookup again to review the current total.", {
      priceChanged: true,
    });
  }

  const coreStatus = requiredChoice(payload, "coreStatus", "core-status", [
    "Original transmission available",
    "Original transmission damaged or incomplete",
    "No core available",
    "Unknown",
  ], "Choose the condition of the original transmission.");
  const installerStatus = requiredChoice(payload, "installerStatus", "installer-status", [
    "Qualified installer selected",
    "Installer still needed",
    "Repair shop ordering",
    "Local installation requested",
  ], "Choose the installer status for this order.");
  const programmingCapability = requiredChoice(payload, "programmingCapability", "programming-capability", [
    "Installer can program and perform relearn",
    "Dealership programming will be arranged",
    "Need programming assistance",
    "Unknown",
  ], "Choose the programming plan for this order.");

  return {
    vin: quote.vin,
    customer,
    address: quote.freightRequest.address,
    availability: quote.availability,
    application: catalog.scrubText(candidate.family || candidate.transmission || candidate.description || "Remanufactured transmission"),
    description: catalog.scrubText(candidate.description || candidate.transmission),
    upgrade: catalog.scrubText(upgrade.name || "Base"),
    warranty: catalog.scrubText(packageData.warranty || "Warranty shown with selected package"),
    selectionId: quote.selectionId,
    unitPrice,
    coreDeposit,
    freight,
    rate,
    roundTrip: quote.freightRequest.roundTrip,
    vehicle: clean(payload.vehicle, 160),
    engine: clean(payload.engine, 100),
    driveType: clean(payload.driveType || payload["drive-type"], 40),
    mileage: clean(payload.mileage, 40),
    coreStatus,
    installerStatus,
    programmingCapability,
    vehicleUse: clean(payload.vehicleUse || payload["vehicle-use-modifications"], 500),
    message: clean(payload.message, 500),
  };
};

const stripeMetadata = (order) => ({
  order_type: "reman_transmission",
  order_state: "payment_pending",
  vin: order.vin,
  vehicle: order.vehicle,
  application: order.application,
  upgrade: order.upgrade,
  warranty: order.warranty,
  selection_id: order.selectionId,
  availability: order.availability.code,
  unit_price: dollars(order.unitPrice / 100),
  core_deposit: dollars(order.coreDeposit / 100),
  freight: dollars(order.freight / 100),
  freight_carrier: order.rate.carrier,
  freight_transit: order.rate.transitDays ? `${order.rate.transitDays} days after shipment` : "Confirm with carrier",
  freight_scope: order.roundTrip ? "outbound_and_core_return" : "outbound_only",
  delivery_type: order.customer.deliveryLocation,
  core_status: order.coreStatus,
  installer_status: order.installerStatus,
  programming: order.programmingCapability,
  vehicle_use: order.vehicleUse,
  customer_note: order.message,
  terms_version: TERMS_VERSION,
  terms_sha256: TERMS_SHA256,
  terms_accepted_at: order.termsAcceptedAt,
});

const stripeAddress = (address) => ({
  line1: address.addressLine1,
  line2: address.addressLine2 || undefined,
  city: address.city,
  state: address.state,
  postal_code: address.postalCode,
  country: "US",
});

const lineItem = ({ name, description, amount, taxCode, component, metadata = {} }) => ({
  quantity: 1,
  metadata: { order_component: component, ...metadata },
  price_data: {
    currency: "usd",
    unit_amount: amount,
    tax_behavior: "exclusive",
    product_data: {
      name,
      description,
      tax_code: taxCode,
      metadata: { order_component: component, ...metadata },
    },
  },
});

const createStripeCheckout = async ({ stripe, order, attemptKey, expiresAt }) => {
  const address = stripeAddress(order.address);
  const metadata = stripeMetadata(order);
  const customer = await stripe.customers.create({
    name: order.customer.name,
    email: order.customer.email,
    phone: order.customer.phone,
    address,
    shipping: { name: order.customer.name, phone: order.customer.phone, address },
    metadata: {
      latest_order_type: "reman_transmission",
      latest_order_vin: order.vin,
    },
  }, { idempotencyKey: `reman_customer_${attemptKey}` });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    origin_context: "web",
    integration_identifier: "integrity_reman_checkout_hvmqzjpt",
    customer: customer.id,
    automatic_tax: { enabled: true },
    billing_address_collection: "auto",
    customer_update: { address: "never", name: "never", shipping: "never" },
    expires_at: expiresAt,
    success_url: `${SITE_URL}/reman-order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/reman-transmissions#vin-quote`,
    submit_type: "pay",
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `VIN-matched remanufactured transmission order for ${order.vin}`,
        footer: "The core deposit is refundable after the correct, complete core is returned within 30 days and accepted under Integrity's core-return terms. Applicable tax is adjusted with an approved core refund.",
        custom_fields: [
          { name: "VIN", value: order.vin },
          { name: "Package", value: clean(`${order.application} / ${order.upgrade} / ${order.warranty}`, 140) },
        ],
        metadata,
      },
    },
    payment_intent_data: {
      description: `Reman transmission order — ${order.application}`,
      receipt_email: order.customer.email,
      metadata,
    },
    custom_text: {
      submit: {
        message: "Payment is made to Integrity Transmission & Drivetrain. The VIN-matched package, availability, price and delivery rate were refreshed before this checkout opened.",
      },
      after_submit: {
        message: "We begin final fitment review after payment is confirmed. If we cannot supply the correct unit, your order will be refunded.",
      },
    },
    client_reference_id: `reman_${attemptKey.slice(0, 24)}`,
    metadata,
    line_items: [
      lineItem({
        name: `${order.application} remanufactured transmission`,
        description: `${order.upgrade} package • ${order.warranty}. Exact application is tied to the VIN on this order.`,
        amount: order.unitPrice,
        taxCode: process.env.STRIPE_TRANSMISSION_TAX_CODE || "txcd_99999999",
        component: "transmission",
        metadata: { vin: order.vin },
      }),
      ...(order.coreDeposit > 0 ? [lineItem({
        name: "Refundable transmission core deposit",
        description: "Refunded after the correct, complete original transmission is returned within 30 days and accepted under the published core-return terms.",
        amount: order.coreDeposit,
        taxCode: process.env.STRIPE_CORE_TAX_CODE || "txcd_99999999",
        component: "refundable_core_deposit",
        metadata: { return_window_days: "30" },
      })] : []),
      lineItem({
        name: order.roundTrip ? "Transmission delivery and prepaid core return" : "Transmission delivery",
        description: `${order.rate.carrier}${order.rate.transitDays ? ` • estimated ${order.rate.transitDays} days after shipment` : ""}. Build time, when shown, is separate.`,
        amount: order.freight,
        taxCode: process.env.STRIPE_FREIGHT_TAX_CODE || "txcd_92010001",
        component: "freight",
        metadata: { scope: order.roundTrip ? "round_trip" : "outbound_only" },
      }),
    ],
  }, { idempotencyKey: `reman_session_${attemptKey}` });

  return session;
};

const defaultStripeFactory = () => {
  const key = process.env.STRIPE_RESTRICTED_KEY || "";
  if (!key) throw checkoutError(503, "Secure checkout is not available yet.");
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia", maxNetworkRetries: 2, timeout: 20000 });
};

const createCheckoutHandler = ({ stripeFactory = defaultStripeFactory, quoteLoader = shipping.loadFreightQuote } = {}) => async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "POST required" });

  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return jsonResponse(403, { error: "Origin not allowed" });
  if ((process.env.REMAN_CHECKOUT_ENABLED || "false").toLowerCase() !== "true") {
    return jsonResponse(503, { error: "Secure checkout is not available yet.", assistedOrder: true });
  }
  if (!withinCheckoutLimit(`checkout:${catalog.sourceIp(event)}`)) {
    return jsonResponse(429, { error: "Too many checkout attempts. Please wait a few minutes or call (417) 815-3315." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid checkout request" });
  }

  try {
    const attemptKey = checkoutAttemptKey(payload);
    const expiresAt = checkoutExpiry(payload);
    const order = await verifiedOrder(payload, quoteLoader);
    order.termsAcceptedAt = new Date().toISOString();
    const stripe = stripeFactory();
    const session = await createStripeCheckout({ stripe, order, attemptKey, expiresAt });
    if (!session?.id || !/^https:\/\/checkout\.stripe\.com\//i.test(session.url || "")) {
      throw new Error("Stripe did not return a secure checkout URL");
    }
    return jsonResponse(200, {
      checkoutUrl: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.type === "StripeInvalidRequestError" ? 400 : 502);
    if (statusCode >= 500) console.error("Reman checkout creation failed:", error.message);
    return jsonResponse(statusCode, {
      error: statusCode >= 500 ? "Secure checkout could not be opened. Please try again or call (417) 815-3315." : error.message,
      ...(error.extra || {}),
    });
  }
};

exports.handler = createCheckoutHandler();
exports._internals = {
  checkoutAttemptKey,
  checkoutExpiry,
  clean,
  createCheckoutHandler,
  createStripeCheckout,
  customerInput,
  findChosenRate,
  lineItem,
  requiredChoice,
  stripeMetadata,
  verifiedOrder,
};
