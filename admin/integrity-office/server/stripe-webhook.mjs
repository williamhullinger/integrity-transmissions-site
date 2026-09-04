import { createStripeClient } from "./stripe-client.mjs";
import { getPool } from "./db.mjs";
import { ingestStripeEvent } from "./stripe-events.mjs";

const webhookHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

const result = (statusCode, body) => ({ statusCode, headers: webhookHeaders, body: JSON.stringify(body) });

export const createStripeWebhookHandler = ({
  env = process.env,
  stripeFactory = createStripeClient,
  poolFactory = getPool,
  ingest = ingestStripeEvent,
  logger = console,
} = {}) => async (event) => {
  if (event?.httpMethod !== "POST") return result(405, { error: "POST required" });
  const raw = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  if (raw.length > 500_000) return result(413, { error: "Payload too large" });
  const signature = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"] || "";
  const secret = String(env.OFFICE_STRIPE_WEBHOOK_SECRET || "");
  if (!secret) return result(503, { error: "Webhook is not configured" });

  let stripeEvent;
  try {
    const stripe = stripeFactory(env);
    stripeEvent = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    logger.warn("Integrity Office rejected a Stripe webhook", { error: error.message });
    return result(400, { error: "Invalid signature" });
  }

  try {
    const inserted = await ingest(poolFactory(env), stripeEvent);
    return result(200, { received: true, duplicate: !inserted });
  } catch (error) {
    logger.error("Integrity Office could not durably store a Stripe webhook", { stripeEventId: stripeEvent.id, error: error.message });
    return result(503, { error: "Webhook storage unavailable" });
  }
};
