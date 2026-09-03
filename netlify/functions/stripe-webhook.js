const Stripe = require("stripe");
const processingSessions = new Set();

const formValue = (value, max = 500) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);

const orderFormFields = (session, customer, stripeEventId = "") => {
  const metadata = session.metadata || {};
  const shipping = customer?.shipping || session.shipping_details || {};
  const address = shipping.address || {};
  return {
    "form-name": "reman-paid-order",
    "stripe-session-id": session.id,
    "stripe-event-id": stripeEventId,
    "payment-verification": "Confirm this payment directly in Stripe before fulfillment",
    "payment-status": session.payment_status,
    "amount-total": ((session.amount_total || 0) / 100).toFixed(2),
    "amount-tax": ((session.total_details?.amount_tax || 0) / 100).toFixed(2),
    name: customer?.name || session.customer_details?.name || shipping.name,
    email: customer?.email || session.customer_details?.email,
    phone: customer?.phone || session.customer_details?.phone || shipping.phone,
    vin: metadata.vin,
    vehicle: metadata.vehicle,
    application: metadata.application,
    upgrade: metadata.upgrade,
    warranty: metadata.warranty,
    availability: metadata.availability,
    "transmission-price": metadata.unit_price,
    "core-deposit": metadata.core_deposit,
    freight: metadata.freight,
    "freight-carrier": metadata.freight_carrier,
    "freight-transit": metadata.freight_transit,
    "freight-scope": metadata.freight_scope,
    "delivery-type": metadata.delivery_type,
    "delivery-address": [address.line1, address.line2, address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    "core-status": metadata.core_status,
    installer: metadata.installer_status,
    programming: metadata.programming,
    "vehicle-use": metadata.vehicle_use,
  };
};

const postOrderNotification = async (session, customer, fetchImpl = fetch, stripeEventId = "") => {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(orderFormFields(session, customer, stripeEventId))) {
    params.set(name, formValue(value));
  }
  const notificationUrl = new URL(process.env.REMAN_ORDER_NOTIFICATION_URL || "https://integritydrivetrain.com/");
  if (notificationUrl.origin !== "https://integritydrivetrain.com") {
    throw new Error("Order notification destination is not an approved Integrity endpoint");
  }
  const response = await fetchImpl(notificationUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Order notification returned HTTP ${response.status}`);
};

const processPaidCheckout = async (stripe, eventSession, fetchImpl = fetch, stripeEventId = "") => {
  if (processingSessions.has(eventSession.id)) return false;
  processingSessions.add(eventSession.id);
  try {
    const session = await stripe.checkout.sessions.retrieve(eventSession.id, { expand: ["customer"] });
    if (session.metadata?.order_type !== "reman_transmission" || session.payment_status !== "paid") return false;
    if (session.metadata?.notification_sent === "true") return false;

    const paidAt = session.metadata?.paid_at || new Date().toISOString();
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        notification_state: "pending",
        order_state: "paid_risk_review",
        paid_at: paidAt,
        last_stripe_event: formValue(stripeEventId, 120),
      },
    });

    const customer = session.customer && typeof session.customer === "object" ? session.customer : null;
    await postOrderNotification(session, customer, fetchImpl, stripeEventId);
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        notification_sent: "true",
        notification_state: "sent",
        order_state: "paid_risk_review",
        paid_at: paidAt,
        last_stripe_event: formValue(stripeEventId, 120),
      },
    });
    return true;
  } finally {
    processingSessions.delete(eventSession.id);
  }
};

const processFailedCheckout = async (stripe, eventSession, stripeEventId = "") => {
  const session = await stripe.checkout.sessions.retrieve(eventSession.id);
  if (session.metadata?.order_type !== "reman_transmission") return false;
  if (["paid", "no_payment_required"].includes(session.payment_status)) return false;
  if (["paid_risk_review", "fitment_review", "supplier_ordered", "shipped", "delivered", "closed"]
    .includes(session.metadata?.order_state)) return false;
  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...session.metadata,
      order_state: "payment_failed",
      last_stripe_event: formValue(stripeEventId, 120),
    },
  });
  return true;
};

const createWebhookHandler = ({ stripeFactory, fetchImpl = fetch } = {}) => async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "POST required" };

  const key = process.env.STRIPE_RESTRICTED_KEY || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if ((!key && !stripeFactory) || !secret) {
    console.error("Stripe webhook environment is incomplete");
    return { statusCode: 503, body: "Webhook unavailable" };
  }

  const stripe = stripeFactory
    ? stripeFactory()
    : new Stripe(key, { apiVersion: "2026-07-29.dahlia", maxNetworkRetries: 2 });
  const signature = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"] || "";
  const rawBody = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  if (rawBody.length > 500_000) return { statusCode: 413, body: "Payload too large" };

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return { statusCode: 400, body: "Invalid signature" };
  }

  try {
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(stripeEvent.type)) {
      await processPaidCheckout(stripe, stripeEvent.data.object, fetchImpl, stripeEvent.id);
    } else if (stripeEvent.type === "checkout.session.async_payment_failed") {
      await processFailedCheckout(stripe, stripeEvent.data.object, stripeEvent.id);
    }
    return { statusCode: 200, body: "received" };
  } catch (error) {
    console.error("Stripe reman webhook processing failed:", error.message);
    return { statusCode: 500, body: "Webhook processing failed" };
  }
};

exports.handler = createWebhookHandler();
exports._internals = {
  createWebhookHandler,
  orderFormFields,
  postOrderNotification,
  processFailedCheckout,
  processPaidCheckout,
};
