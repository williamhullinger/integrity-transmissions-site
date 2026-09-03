const Stripe = require("stripe");

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const jsonResponse = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const allowedOrigin = (origin) => {
  if (!origin || origin === "https://integritydrivetrain.com") return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const maskedEmail = (email) => {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(6, local.length - 2)))}@${domain}`;
};

const createStatusHandler = ({ stripeFactory } = {}) => async (event) => {
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "GET required" });
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return jsonResponse(403, { error: "Origin not allowed" });

  const sessionId = String(event.queryStringParameters?.session_id || "").trim();
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]{16,}$/.test(sessionId)) {
    return jsonResponse(400, { error: "The order reference is missing or invalid." });
  }

  try {
    if (!process.env.STRIPE_RESTRICTED_KEY && !stripeFactory) return jsonResponse(503, { error: "Order status is temporarily unavailable." });
    const stripe = stripeFactory
      ? stripeFactory()
      : new Stripe(process.env.STRIPE_RESTRICTED_KEY || "", { apiVersion: "2026-07-29.dahlia", maxNetworkRetries: 2 });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["invoice"] });
    if (session.metadata?.order_type !== "reman_transmission") return jsonResponse(404, { error: "Order not found." });

    const invoice = session.invoice && typeof session.invoice === "object" ? session.invoice : null;
    return jsonResponse(200, {
      orderReference: session.id,
      paymentStatus: session.payment_status,
      checkoutStatus: session.status,
      amountTotal: session.amount_total,
      amountTax: session.total_details?.amount_tax || 0,
      currency: session.currency || "usd",
      email: maskedEmail(session.customer_details?.email),
      application: session.metadata?.application || "Remanufactured transmission",
      upgrade: session.metadata?.upgrade || "",
      warranty: session.metadata?.warranty || "",
      invoiceUrl: invoice?.hosted_invoice_url || null,
    });
  } catch (error) {
    const notFound = error?.code === "resource_missing";
    if (!notFound) console.error("Reman order status lookup failed:", error.message);
    return jsonResponse(notFound ? 404 : 502, { error: notFound ? "Order not found." : "Order status is temporarily unavailable." });
  }
};

exports.handler = createStatusHandler();
exports._internals = { createStatusHandler, maskedEmail };
