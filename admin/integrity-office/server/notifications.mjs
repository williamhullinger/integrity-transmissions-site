import crypto from "node:crypto";
import { withTransaction } from "./db.mjs";

const notificationConfig = (env = process.env) => {
  const rawUrl = String(env.OFFICE_NOTIFICATION_WEBHOOK_URL || "").trim();
  const secret = String(env.OFFICE_NOTIFICATION_WEBHOOK_SECRET || "").trim();
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Office notification delivery is not configured");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || secret.length < 32) {
    throw new Error("Office notification delivery is not configured securely");
  }
  return { url: url.toString(), secret };
};

export const claimNotifications = (pool, workerId, limit = 3) => withTransaction(pool, async (client) => {
  const { rows } = await client.query(`
    WITH candidates AS (
      SELECT id
      FROM notification_outbox
      WHERE delivered_at IS NULL AND attempts < 10 AND available_at <= now()
        AND (locked_until IS NULL OR locked_until < now())
      ORDER BY available_at, created_at
      FOR UPDATE SKIP LOCKED
      LIMIT $2
    )
    UPDATE notification_outbox no
    SET attempts = attempts + 1, locked_by = $1, locked_until = now() + interval '2 minutes'
    FROM candidates
    WHERE no.id = candidates.id
    RETURNING no.*
  `, [workerId, limit]);
  return rows;
});

const signedDelivery = async (item, { url, secret, fetchImpl = fetch }) => {
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const body = JSON.stringify({
    id: item.id,
    topic: item.topic,
    payload: item.payload,
    createdAt: item.created_at,
  });
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
  const result = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Integrity-Office-Notifications/1.0",
      "X-Office-Notification-Timestamp": timestamp,
      "X-Office-Notification-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(7_000),
    redirect: "error",
  });
  if (!result.ok) throw new Error(`Notification receiver returned HTTP ${result.status}`);
};

const markDelivered = async (pool, item, workerId) => {
  const result = await pool.query(`
    UPDATE notification_outbox
    SET delivered_at = now(), locked_by = NULL, locked_until = NULL, last_error = NULL
    WHERE id = $1 AND locked_by = $2 AND locked_until >= now()
  `, [item.id, workerId]);
  if (result.rowCount !== 1) throw new Error("Notification delivery lease was lost before completion");
};

const releaseForRetry = async (pool, item, workerId, error) => {
  const dead = item.attempts >= 10;
  const delayMinutes = dead ? 525_600 : Math.min(360, 2 ** Math.min(item.attempts, 8));
  const result = await pool.query(`
    UPDATE notification_outbox
    SET available_at = now() + ($3 * interval '1 minute'), locked_by = NULL,
        locked_until = NULL, last_error = $4
    WHERE id = $1 AND locked_by = $2 AND locked_until >= now()
  `, [item.id, workerId, delayMinutes, String(error?.message || error).slice(0, 2_000)]);
  if (result.rowCount !== 1) throw new Error("Notification delivery lease was lost before retry scheduling");
};

export const runNotificationBatch = async (pool, {
  env = process.env,
  workerId = crypto.randomUUID(),
  limit = 3,
  fetchImpl = fetch,
  logger = console,
} = {}) => {
  const config = notificationConfig(env);
  const claimed = await claimNotifications(pool, workerId, limit);
  const summary = { claimed: claimed.length, delivered: 0, retried: 0, deadLettered: 0 };
  for (const item of claimed) {
    try {
      await signedDelivery(item, { ...config, fetchImpl });
      await markDelivered(pool, item, workerId);
      summary.delivered += 1;
    } catch (error) {
      await releaseForRetry(pool, item, workerId, error);
      if (item.attempts >= 10) summary.deadLettered += 1;
      else summary.retried += 1;
      logger.error("Integrity Office notification delivery failed", { notificationId: item.id, topic: item.topic, attempt: item.attempts, error: error.message });
    }
  }
  return summary;
};

export const _internals = { markDelivered, notificationConfig, releaseForRetry, signedDelivery };
