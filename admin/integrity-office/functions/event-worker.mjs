import { getPool } from "../server/db.mjs";
import { runStripeEventBatch } from "../server/stripe-events.mjs";

export const handler = async () => {
  try {
    const summary = await runStripeEventBatch(getPool());
    return { statusCode: 200, body: JSON.stringify(summary) };
  } catch (error) {
    console.error("Integrity Office event worker failed", { error: error.message });
    return { statusCode: 503, body: JSON.stringify({ error: "Event worker unavailable" }) };
  }
};
