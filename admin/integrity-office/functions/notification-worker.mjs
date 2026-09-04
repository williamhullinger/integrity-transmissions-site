import { getPool } from "../server/db.mjs";
import { runNotificationBatch } from "../server/notifications.mjs";

export const handler = async () => {
  try {
    const summary = await runNotificationBatch(getPool());
    return { statusCode: 200, body: JSON.stringify(summary) };
  } catch (error) {
    console.error("Integrity Office notification worker failed", { error: error.message });
    return { statusCode: 503, body: JSON.stringify({ error: "Notification worker unavailable" }) };
  }
};
