import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { _internals } from "../server/notifications.mjs";

test("requires an HTTPS notification target and a strong signing secret", () => {
  assert.throws(() => _internals.notificationConfig({}), /not configured/);
  assert.throws(() => _internals.notificationConfig({
    OFFICE_NOTIFICATION_WEBHOOK_URL: "http://alerts.example.com",
    OFFICE_NOTIFICATION_WEBHOOK_SECRET: "x".repeat(64),
  }), /securely/);
  const config = _internals.notificationConfig({
    OFFICE_NOTIFICATION_WEBHOOK_URL: "https://alerts.example.com/integrity",
    OFFICE_NOTIFICATION_WEBHOOK_SECRET: "x".repeat(64),
  });
  assert.equal(config.url, "https://alerts.example.com/integrity");
});

test("signs the exact notification body before delivery", async () => {
  const secret = "n".repeat(64);
  let delivered;
  await _internals.signedDelivery({
    id: "d41314de-fb3d-48ed-a915-2022725c62a3",
    topic: "order.payment.confirmed",
    payload: { orderId: "order-123" },
    created_at: "2026-09-04T12:00:00.000Z",
  }, {
    url: "https://alerts.example.com/integrity",
    secret,
    fetchImpl: async (url, options) => { delivered = { url, options }; return { ok: true, status: 204 }; },
  });
  assert.equal(delivered.url, "https://alerts.example.com/integrity");
  const timestamp = delivered.options.headers["X-Office-Notification-Timestamp"];
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${delivered.options.body}`).digest("hex")}`;
  assert.equal(delivered.options.headers["X-Office-Notification-Signature"], expected);
  assert.equal(JSON.parse(delivered.options.body).topic, "order.payment.confirmed");
  assert.equal(delivered.options.redirect, "error");
});

test("requires the current unexpired lease before finalizing notification work", async () => {
  let statement;
  await assert.rejects(() => _internals.markDelivered({ query: async (sql) => {
    statement = String(sql);
    return { rowCount: 0 };
  } }, { id: "d41314de-fb3d-48ed-a915-2022725c62a3" }, "worker-stale"), /lease was lost/);
  assert.match(statement, /locked_by = \$2 AND locked_until >= now\(\)/);

  await assert.rejects(() => _internals.releaseForRetry({ query: async (sql) => {
    statement = String(sql);
    return { rowCount: 0 };
  } }, { id: "d41314de-fb3d-48ed-a915-2022725c62a3", attempts: 2 }, "worker-stale", new Error("retry")), /lease was lost/);
  assert.match(statement, /locked_by = \$2 AND locked_until >= now\(\)/);
});

test("treats non-success notification responses as retryable failures", async () => {
  await assert.rejects(() => _internals.signedDelivery({
    id: "d41314de-fb3d-48ed-a915-2022725c62a3",
    topic: "finance.refund_requires_classification",
    payload: {},
    created_at: "2026-09-04T12:00:00.000Z",
  }, {
    url: "https://alerts.example.com/integrity",
    secret: "n".repeat(64),
    fetchImpl: async () => ({ ok: false, status: 503 }),
  }), /HTTP 503/);
});
