import crypto from "node:crypto";
import { withTransaction } from "./db.mjs";

const cents = (value, name) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(`${name} must be a non-negative integer`);
  return parsed;
};

const paymentStateForRefunds = (captured, refunded) => refunded >= captured ? "refunded" : "partially_refunded";

export const ingestStripeEvent = (pool, event) => withTransaction(pool, async (client) => {
  const result = await client.query(`
    INSERT INTO webhook_events (stripe_event_id, event_type, api_version, payload)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (stripe_event_id) DO NOTHING
  `, [event.id, event.type, event.api_version || null, event]);
  return result.rowCount === 1;
});

export const claimStripeEvents = (pool, workerId, limit = 20) => withTransaction(pool, async (client) => {
  const { rows } = await client.query(`
    WITH candidates AS (
      SELECT stripe_event_id
      FROM webhook_events
      WHERE processing_status IN ('received', 'retry')
        AND next_attempt_at <= now()
        AND (locked_until IS NULL OR locked_until < now())
      ORDER BY received_at
      FOR UPDATE SKIP LOCKED
      LIMIT $2
    )
    UPDATE webhook_events we
    SET processing_status = 'processing', attempts = attempts + 1,
        locked_by = $1, locked_until = now() + interval '2 minutes'
    FROM candidates
    WHERE we.stripe_event_id = candidates.stripe_event_id
    RETURNING we.*
  `, [workerId, limit]);
  return rows;
});

const linkedOrderForSession = async (client, sessionId) => {
  const { rows } = await client.query(`
    SELECT o.id, o.version, o.payment_status::text AS payment_status,
           o.core_status::text AS core_status,
           qv.customer_unit_price_cents, qv.freight_charged_cents,
           qv.core_deposit_cents,
           COALESCE((SELECT sum(pr.amount_cents) FROM promotion_redemptions pr
             WHERE pr.order_id = o.id AND pr.status = 'applied'), 0) AS discount_cents
    FROM checkout_sessions cs
    JOIN orders o ON o.id = cs.order_id
    JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE cs.stripe_checkout_session_id = $1
    FOR UPDATE OF o
  `, [sessionId]);
  if (!rows[0]) throw new Error(`Stripe Checkout Session ${sessionId} is not linked to an Office order`);
  return rows[0];
};

const appendStatus = (client, { orderId, workflow, from, to, eventId, reason }) => client.query(`
  INSERT INTO status_history (order_id, workflow, from_state, to_state, source_event_id, reason)
  VALUES ($1, $2, $3, $4, $5, $6)
`, [orderId, workflow, from, to, eventId, reason]);

const ensurePaidJournal = async (client, event, session, order) => {
  const total = cents(session.amount_total, "amount_total");
  const unit = cents(order.customer_unit_price_cents, "customer_unit_price_cents");
  const freight = cents(order.freight_charged_cents, "freight_charged_cents");
  const core = cents(order.core_deposit_cents, "core_deposit_cents");
  const discount = cents(order.discount_cents, "discount_cents");
  const tax = total + discount - unit - freight - core;
  if (!Number.isSafeInteger(tax) || tax < 0) throw new Error("Stripe total does not reconcile to the immutable order snapshot");
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Paid Checkout Session is missing its PaymentIntent");
  await client.query("UPDATE checkout_sessions SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $2) WHERE stripe_checkout_session_id = $1", [session.id, paymentIntentId]);

  await client.query(`
    INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
    VALUES ($1, $2, 'payment', $3, $4, 'succeeded', to_timestamp($5))
    ON CONFLICT (stripe_object_id) DO NOTHING
  `, [order.id, paymentIntentId, total, session.currency || "usd", event.created]);

  const entry = await client.query(`
    INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
    VALUES ($1, 'stripe_payment_intent', $2, 'Stripe payment captured', $3, to_timestamp($4))
    ON CONFLICT (source_type, source_id) DO NOTHING
    RETURNING id
  `, [order.id, paymentIntentId, session.currency || "usd", event.created]);
  if (!entry.rowCount) return;
  const lines = [
    ["1000", total, 0],
    ...(discount ? [["6200", discount, 0]] : []),
    ["4000", 0, unit],
    ...(freight ? [["4010", 0, freight]] : []),
    ...(core ? [["2010", 0, core]] : []),
    ...(tax ? [["2000", 0, tax]] : []),
  ];
  for (const [account, debit, credit] of lines) {
    await client.query(`
      INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents)
      VALUES ($1, $2, $3, $4)
    `, [entry.rows[0].id, account, debit, credit]);
  }
};

const processPaidSession = async (client, row) => {
  const session = row.payload.data.object;
  if (!session || !["paid", "no_payment_required"].includes(session.payment_status)) return;
  const order = await linkedOrderForSession(client, session.id);
  await ensurePaidJournal(client, row.payload, session, order);
  if (["paid", "partially_refunded", "refunded", "disputed"].includes(order.payment_status)) return;
  let from = order.payment_status;
  if (from === "checkout_open") {
    await appendStatus(client, { orderId: order.id, workflow: "payment", from, to: "processing", eventId: row.stripe_event_id, reason: "Stripe completed checkout" });
    from = "processing";
  }
  await client.query("UPDATE orders SET payment_status = 'paid', paid_at = COALESCE(paid_at, to_timestamp($2)), version = version + 1 WHERE id = $1", [order.id, row.payload.created]);
  await appendStatus(client, { orderId: order.id, workflow: "payment", from, to: "paid", eventId: row.stripe_event_id, reason: "Stripe payment confirmed" });
  await client.query(`
    INSERT INTO notification_outbox (topic, deduplication_key, payload)
    VALUES ('order.payment.confirmed', $1, $2)
    ON CONFLICT (deduplication_key) DO NOTHING
  `, [`payment:${order.id}:${session.payment_intent}`, { orderId: order.id, stripeSessionId: session.id }]);
};

const processFailedSession = async (client, row) => {
  const session = row.payload.data.object;
  const order = await linkedOrderForSession(client, session.id);
  if (["paid", "partially_refunded", "refunded", "disputed", "failed", "expired"].includes(order.payment_status)) return;
  const target = row.event_type === "checkout.session.expired" ? "expired" : "failed";
  let from = order.payment_status;
  if (from === "checkout_open" && target === "failed") {
    await appendStatus(client, { orderId: order.id, workflow: "payment", from, to: "processing", eventId: row.stripe_event_id, reason: "Stripe began asynchronous payment processing" });
    from = "processing";
  }
  await client.query(`UPDATE orders SET payment_status = $2, version = version + 1 WHERE id = $1`, [order.id, target]);
  await appendStatus(client, { orderId: order.id, workflow: "payment", from, to: target, eventId: row.stripe_event_id, reason: target === "expired" ? "Stripe Checkout Session expired" : "Stripe asynchronous payment failed" });
};

const processRefund = async (client, row) => {
  const refund = row.payload.data.object;
  if (!refund || refund.status !== "succeeded") return;
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Stripe refund is missing its PaymentIntent");
  const linked = await client.query(`
    SELECT o.id, o.payment_status::text AS payment_status,
           COALESCE((SELECT sum(amount_cents) FROM payment_transactions WHERE order_id = o.id AND transaction_type = 'payment' AND status = 'succeeded'), 0) AS captured_cents
    FROM checkout_sessions cs JOIN orders o ON o.id = cs.order_id
    WHERE cs.stripe_payment_intent_id = $1
    FOR UPDATE OF o
  `, [paymentIntentId]);
  if (!linked.rows[0]) throw new Error(`Stripe PaymentIntent ${paymentIntentId} is not linked to an Office order`);
  const order = linked.rows[0];
  const amount = cents(refund.amount, "refund.amount");
  await client.query(`
    INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
    VALUES ($1, $2, 'refund', $3, $4, 'succeeded', to_timestamp($5))
    ON CONFLICT (stripe_object_id) DO NOTHING
  `, [order.id, refund.id, amount, refund.currency || "usd", row.payload.created]);
  const totals = await client.query("SELECT COALESCE(sum(amount_cents), 0) AS refunded_cents FROM payment_transactions WHERE order_id = $1 AND transaction_type = 'refund' AND status = 'succeeded'", [order.id]);
  const target = paymentStateForRefunds(cents(order.captured_cents, "captured_cents"), cents(totals.rows[0].refunded_cents, "refunded_cents"));
  if (order.payment_status !== target) {
    await client.query("UPDATE orders SET payment_status = $2, version = version + 1 WHERE id = $1", [order.id, target]);
    await appendStatus(client, { orderId: order.id, workflow: "payment", from: order.payment_status, to: target, eventId: row.stripe_event_id, reason: "Stripe refund confirmed; accounting classification pending" });
  }
  await client.query(`
    INSERT INTO notification_outbox (topic, deduplication_key, payload)
    VALUES ('finance.refund_requires_classification', $1, $2)
    ON CONFLICT (deduplication_key) DO NOTHING
  `, [`refund-classification:${refund.id}`, { orderId: order.id, refundId: refund.id, amountCents: amount }]);
};

const applyEvent = async (client, row) => {
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(row.event_type)) return processPaidSession(client, row);
  if (["checkout.session.async_payment_failed", "checkout.session.expired"].includes(row.event_type)) return processFailedSession(client, row);
  if (["refund.created", "refund.updated"].includes(row.event_type)) return processRefund(client, row);
};

const finishEvent = (client, eventId) => client.query(`
  UPDATE webhook_events
  SET processing_status = 'processed', processed_at = now(), locked_by = NULL, locked_until = NULL, last_error = NULL
  WHERE stripe_event_id = $1
`, [eventId]);

const retryEvent = (pool, row, error) => {
  const dead = row.attempts >= 10;
  const delayMinutes = Math.min(360, 2 ** Math.min(row.attempts, 8));
  return pool.query(`
    UPDATE webhook_events
    SET processing_status = $2, next_attempt_at = now() + ($3 * interval '1 minute'),
        locked_by = NULL, locked_until = NULL, last_error = $4
    WHERE stripe_event_id = $1
  `, [row.stripe_event_id, dead ? "dead_letter" : "retry", delayMinutes, String(error?.message || error).slice(0, 2_000)]);
};

export const processClaimedEvent = (pool, row) => withTransaction(pool, async (client) => {
  await applyEvent(client, row);
  await finishEvent(client, row.stripe_event_id);
});

export const runStripeEventBatch = async (pool, { workerId = crypto.randomUUID(), limit = 20, logger = console } = {}) => {
  const claimed = await claimStripeEvents(pool, workerId, limit);
  const summary = { claimed: claimed.length, processed: 0, retried: 0, deadLettered: 0 };
  for (const row of claimed) {
    try {
      await processClaimedEvent(pool, row);
      summary.processed += 1;
    } catch (error) {
      await retryEvent(pool, row, error);
      if (row.attempts >= 10) summary.deadLettered += 1;
      else summary.retried += 1;
      logger.error("Integrity Office Stripe event failed", { stripeEventId: row.stripe_event_id, attempt: row.attempts, error: error.message });
    }
  }
  return summary;
};

export const _internals = { applyEvent, cents, linkedOrderForSession, paymentStateForRefunds, retryEvent };
