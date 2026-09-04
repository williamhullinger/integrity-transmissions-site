import crypto from "node:crypto";
import { withTransaction } from "./db.mjs";

const cents = (value, name) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(`${name} must be a non-negative integer`);
  return parsed;
};

const currency = (value, name) => {
  const normalized = String(value || "").toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) throw new TypeError(`${name} must be a three-letter currency code`);
  return normalized;
};

const paymentStateForRefunds = (captured, refunded) => {
  if (!refunded) return "paid";
  return refunded >= captured ? "refunded" : "partially_refunded";
};
const disputeEvents = new Set([
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.funds_reinstated",
]);

export const ingestStripeEvent = (pool, event) => withTransaction(pool, async (client) => {
  const result = await client.query(`
    INSERT INTO webhook_events (stripe_event_id, event_type, api_version, payload)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (stripe_event_id) DO NOTHING
  `, [event.id, event.type, event.api_version || null, event]);
  return result.rowCount === 1;
});

export const claimStripeEvents = (pool, workerId, limit = 1) => withTransaction(pool, async (client) => {
  const { rows } = await client.query(`
    WITH candidates AS (
      SELECT stripe_event_id
      FROM webhook_events
      WHERE (
          (processing_status IN ('received', 'retry') AND next_attempt_at <= now())
          OR (processing_status = 'processing' AND locked_until < now())
        )
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
           o.fulfillment_status::text AS fulfillment_status,
           o.core_status::text AS core_status,
           qv.customer_unit_price_cents, qv.freight_charged_cents,
           qv.list_unit_price_cents, qv.core_deposit_cents,
           qv.promotion_discount_cents AS discount_cents, qv.currency
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
  const unit = cents(order.list_unit_price_cents, "list_unit_price_cents");
  const freight = cents(order.freight_charged_cents, "freight_charged_cents");
  const core = cents(order.core_deposit_cents, "core_deposit_cents");
  const discount = cents(order.discount_cents, "discount_cents");
  const tax = total + discount - unit - freight - core;
  if (!Number.isSafeInteger(tax) || tax < 0) throw new Error("Stripe total does not reconcile to the immutable order snapshot");
  const reportedTax = cents(session.total_details?.amount_tax, "Checkout Session tax");
  if (session.automatic_tax?.status !== "complete" || reportedTax !== tax) {
    throw new Error("Stripe tax does not reconcile to the immutable order snapshot");
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Paid Checkout Session is missing its PaymentIntent");
  const eventCurrency = currency(session.currency, "Checkout Session currency");
  if (eventCurrency !== currency(order.currency, "order currency")) throw new Error("Stripe Checkout Session currency does not match the immutable order snapshot");
  const linked = await client.query(`
    UPDATE checkout_sessions
    SET stripe_payment_intent_id = $2
    WHERE stripe_checkout_session_id = $1
      AND (stripe_payment_intent_id IS NULL OR stripe_payment_intent_id = $2)
    RETURNING id
  `, [session.id, paymentIntentId]);
  if (!linked.rowCount) throw new Error("Stripe Checkout Session PaymentIntent does not match its existing Office link");

  await client.query(`
    INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
    VALUES ($1, $2, 'payment', $3, $4, 'succeeded', to_timestamp($5))
    ON CONFLICT (stripe_object_id) DO NOTHING
  `, [order.id, paymentIntentId, total, eventCurrency, event.created]);

  const entry = await client.query(`
    INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
    VALUES ($1, 'stripe_payment_intent', $2, 'Stripe payment captured', $3, to_timestamp($4))
    ON CONFLICT (source_type, source_id) DO NOTHING
    RETURNING id
  `, [order.id, paymentIntentId, eventCurrency, event.created]);
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
  await client.query(`
    UPDATE promotion_redemptions
    SET status = 'applied', applied_at = to_timestamp($2)
    WHERE order_id = $1 AND status = 'reserved'
  `, [order.id, row.payload.created]);
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
  await client.query(`
    UPDATE orders
    SET payment_status = $2, fulfillment_status = 'canceled', core_status = 'not_required',
        canceled_at = COALESCE(canceled_at, to_timestamp($3)), version = version + 1
    WHERE id = $1
  `, [order.id, target, row.payload.created]);
  await client.query(`
    UPDATE promotion_redemptions
    SET status = 'released', released_at = to_timestamp($2)
    WHERE order_id = $1 AND status = 'reserved'
  `, [order.id, row.payload.created]);
  await appendStatus(client, { orderId: order.id, workflow: "payment", from, to: target, eventId: row.stripe_event_id, reason: target === "expired" ? "Stripe Checkout Session expired" : "Stripe asynchronous payment failed" });
  if (order.fulfillment_status !== "canceled") {
    await appendStatus(client, { orderId: order.id, workflow: "fulfillment", from: order.fulfillment_status, to: "canceled", eventId: row.stripe_event_id, reason: "Unpaid checkout closed" });
  }
  if (order.core_status !== "not_required") {
    await appendStatus(client, { orderId: order.id, workflow: "core", from: order.core_status, to: "not_required", eventId: row.stripe_event_id, reason: "Unpaid checkout has no core obligation" });
  }
  await client.query(`
    INSERT INTO notification_outbox (topic, deduplication_key, payload)
    VALUES ('order.checkout.closed_unpaid', $1, $2)
    ON CONFLICT (deduplication_key) DO NOTHING
  `, [`checkout-unpaid:${order.id}`, { orderId: order.id, paymentStatus: target }]);
};

const processRefund = async (client, row) => {
  const refund = row.payload.data.object;
  if (!refund || refund.status !== "succeeded") return;
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Stripe refund is missing its PaymentIntent");
  const linked = await client.query(`
    SELECT o.id, o.payment_status::text AS payment_status, qv.currency,
           COALESCE((SELECT sum(amount_cents) FROM payment_transactions WHERE order_id = o.id AND transaction_type = 'payment' AND status = 'succeeded'), 0) AS captured_cents
    FROM checkout_sessions cs
    JOIN orders o ON o.id = cs.order_id
    JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE cs.stripe_payment_intent_id = $1
    FOR UPDATE OF o
  `, [paymentIntentId]);
  if (!linked.rows[0]) throw new Error(`Stripe PaymentIntent ${paymentIntentId} is not linked to an Office order`);
  const order = linked.rows[0];
  const amount = cents(refund.amount, "refund.amount");
  const refundCurrency = currency(refund.currency, "refund currency");
  if (refundCurrency !== currency(order.currency, "order currency")) throw new Error("Stripe refund currency does not match the immutable order snapshot");
  const captured = cents(order.captured_cents, "captured_cents");
  if (!captured) throw new Error("Stripe refund is waiting for its captured payment event");
  await client.query(`
    INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
    VALUES ($1, $2, 'refund', $3, $4, 'succeeded', to_timestamp($5))
    ON CONFLICT (stripe_object_id) DO NOTHING
  `, [order.id, refund.id, amount, refundCurrency, row.payload.created]);
  const totals = await client.query("SELECT COALESCE(sum(amount_cents), 0) AS refunded_cents FROM payment_transactions WHERE order_id = $1 AND transaction_type = 'refund' AND status = 'succeeded'", [order.id]);
  const refunded = cents(totals.rows[0].refunded_cents, "refunded_cents");
  if (refunded > captured) throw new Error("Stripe refunds exceed the captured payment total");
  const target = paymentStateForRefunds(captured, refunded);
  if (order.payment_status !== "disputed" && order.payment_status !== target) {
    await client.query("UPDATE orders SET payment_status = $2, version = version + 1 WHERE id = $1", [order.id, target]);
    await appendStatus(client, { orderId: order.id, workflow: "payment", from: order.payment_status, to: target, eventId: row.stripe_event_id, reason: "Stripe refund confirmed; accounting classification pending" });
  }
  if (target === "refunded") {
    await client.query(`
      UPDATE promotion_redemptions
      SET status = 'reversed', released_at = to_timestamp($2)
      WHERE order_id = $1 AND status = 'applied'
    `, [order.id, row.payload.created]);
  }
  await client.query(`
    INSERT INTO notification_outbox (topic, deduplication_key, payload)
    VALUES ('finance.refund_requires_classification', $1, $2)
    ON CONFLICT (deduplication_key) DO NOTHING
  `, [`refund-classification:${refund.id}`, { orderId: order.id, refundId: refund.id, amountCents: amount }]);
};

const prepareEvent = async (row, stripe) => {
  if (disputeEvents.has(row.event_type)) {
    const eventDispute = row.payload.data.object;
    if (!eventDispute?.id) throw new Error("Stripe dispute event is missing its Dispute object");
    if (!stripe?.disputes?.retrieve) {
      throw new Error("Stripe dispute access is required to apply the current dispute state");
    }
    const dispute = await stripe.disputes.retrieve(eventDispute.id, { expand: ["charge"] });
    if (!dispute?.id || dispute.id !== eventDispute.id) {
      throw new Error("Stripe returned an unexpected Dispute while refreshing current state");
    }
    let charge = typeof dispute.charge === "object" ? dispute.charge : null;
    if (!charge) {
      if (!dispute.charge || !stripe?.charges?.retrieve) {
        throw new Error("Stripe charge access is required to link the dispute to its PaymentIntent");
      }
      charge = await stripe.charges.retrieve(dispute.charge);
    }
    if (!charge?.id) throw new Error("Stripe dispute is missing its authoritative Charge");
    const balanceTransactions = await Promise.all((dispute.balance_transactions || []).map(async (item) => {
      if (typeof item === "object" && item.id && item.source && item.type && Number.isSafeInteger(Number(item.net)) && item.currency) return item;
      const transactionId = typeof item === "string" ? item : item?.id;
      if (!transactionId) throw new Error("Stripe dispute contains an invalid balance transaction");
      if (!stripe?.balanceTransactions?.retrieve) {
        throw new Error("Stripe balance-transaction access is required to record dispute movements");
      }
      return stripe.balanceTransactions.retrieve(transactionId);
    }));
    return { dispute, charge, balanceTransactions };
  }
  if (!["charge.succeeded", "charge.updated"].includes(row.event_type)) return {};
  let charge = row.payload.data.object;
  if (!charge?.paid) return {};
  if (!charge.balance_transaction) {
    if (!charge.id || !stripe?.charges?.retrieve) throw new Error("Stripe charge access is required to refresh processing-fee data");
    charge = await stripe.charges.retrieve(charge.id, { expand: ["balance_transaction"] });
    if (!charge?.balance_transaction) throw new Error("Successful Stripe charge is waiting for its balance transaction");
  }
  if (typeof charge.balance_transaction === "object") return { charge, balanceTransaction: charge.balance_transaction };
  if (!stripe?.balanceTransactions?.retrieve) throw new Error("Stripe balance-transaction access is required to record processing fees");
  return { charge, balanceTransaction: await stripe.balanceTransactions.retrieve(charge.balance_transaction) };
};

const processCharge = async (client, row, context) => {
  const charge = context.charge || row.payload.data.object;
  const balanceTransaction = context.balanceTransaction;
  if (!charge?.paid || !balanceTransaction) return;
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Successful Stripe charge is missing its PaymentIntent");
  const linked = await client.query(`
    SELECT o.id, qv.currency
    FROM checkout_sessions cs
    JOIN orders o ON o.id = cs.order_id
    JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE cs.stripe_payment_intent_id = $1
    FOR UPDATE OF o
  `, [paymentIntentId]);
  if (!linked.rows[0]) throw new Error(`Stripe PaymentIntent ${paymentIntentId} is not linked to an Office order`);
  const chargeCurrency = currency(charge.currency, "charge currency");
  const balanceCurrency = currency(balanceTransaction.currency, "balance transaction currency");
  const orderCurrency = currency(linked.rows[0].currency, "order currency");
  if (chargeCurrency !== orderCurrency || balanceCurrency !== orderCurrency) {
    throw new Error("Stripe charge or balance transaction currency does not match the immutable order snapshot");
  }
  const fee = cents(balanceTransaction.fee, "balance_transaction.fee");
  if (!fee) return;
  await client.query(`
    INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
    VALUES ($1,$2,'fee',$3,$4,'succeeded',to_timestamp($5))
    ON CONFLICT (stripe_object_id) DO NOTHING
  `, [linked.rows[0].id, balanceTransaction.id, fee, orderCurrency, balanceTransaction.created || row.payload.created]);
  const entry = await client.query(`
    INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
    VALUES ($1,'stripe_balance_transaction',$2,'Stripe processing fee',$3,to_timestamp($4))
    ON CONFLICT (source_type, source_id) DO NOTHING
    RETURNING id
  `, [linked.rows[0].id, balanceTransaction.id, orderCurrency, balanceTransaction.created || row.payload.created]);
  if (!entry.rowCount) return;
  await client.query("INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents) VALUES ($1,'6100',$2,0)", [entry.rows[0].id, fee]);
  await client.query("INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents) VALUES ($1,'1000',0,$2)", [entry.rows[0].id, fee]);
};

const processDispute = async (client, row, context) => {
  const dispute = context.dispute || row.payload.data.object;
  const charge = context.charge || (typeof dispute.charge === "object" ? dispute.charge : null);
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) throw new Error("Stripe dispute is missing its Charge link");
  if (!charge?.id || charge.id !== chargeId) throw new Error("Stripe dispute Charge does not match its authoritative Charge");
  const disputePaymentIntentId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id;
  const chargePaymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (disputePaymentIntentId && chargePaymentIntentId && disputePaymentIntentId !== chargePaymentIntentId) {
    throw new Error("Stripe dispute PaymentIntent does not match its Charge");
  }
  const paymentIntentId = disputePaymentIntentId || chargePaymentIntentId;
  if (!paymentIntentId) throw new Error("Stripe dispute is missing its PaymentIntent link");
  const status = String(dispute.status || "");
  const allowedStatuses = new Set(["warning_needs_response", "warning_under_review", "warning_closed", "needs_response", "under_review", "won", "lost", "prevented"]);
  if (!allowedStatuses.has(status)) throw new Error(`Stripe dispute has an unsupported status: ${status || "missing"}`);
  const linked = await client.query(`
    SELECT o.id, o.payment_status::text AS payment_status, qv.currency,
           COALESCE((SELECT sum(amount_cents) FROM payment_transactions WHERE order_id = o.id AND transaction_type = 'payment' AND status = 'succeeded'), 0) AS captured_cents,
           COALESCE((SELECT sum(amount_cents) FROM payment_transactions WHERE order_id = o.id AND transaction_type = 'refund' AND status = 'succeeded'), 0) AS refunded_cents
    FROM checkout_sessions cs
    JOIN orders o ON o.id = cs.order_id
    JOIN quote_versions qv ON qv.quote_id = o.quote_id AND qv.version = o.quote_version
    WHERE cs.stripe_payment_intent_id = $1
    FOR UPDATE OF o
  `, [paymentIntentId]);
  if (!linked.rows[0]) throw new Error(`Stripe PaymentIntent ${paymentIntentId} is not linked to an Office order`);
  const order = linked.rows[0];
  const amount = cents(dispute.amount, "dispute.amount");
  if (!amount) throw new Error("Stripe dispute amount must be positive");
  const disputeCurrency = currency(dispute.currency, "dispute currency");
  if (disputeCurrency !== currency(order.currency, "order currency")) throw new Error("Stripe dispute currency does not match the immutable order snapshot");
  const resolved = ["won", "lost", "warning_closed", "prevented"].includes(status);
  const openedAt = new Date(cents(dispute.created || row.payload.created, "dispute.created") * 1_000).toISOString();
  const closedAt = resolved ? new Date(cents(row.payload.created, "event.created") * 1_000).toISOString() : null;
  const dueBy = dispute.evidence_details?.due_by;
  const evidenceDueAt = dueBy ? new Date(cents(dueBy, "dispute.evidence_due_by") * 1_000).toISOString() : null;
  await client.query(`
    INSERT INTO payment_disputes (
      stripe_dispute_id, order_id, stripe_charge_id, amount_cents, currency,
      status, reason, evidence_due_at, opened_at, closed_at, last_event_id,
      last_event_created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,to_timestamp($12))
    ON CONFLICT (stripe_dispute_id) DO UPDATE SET
      status = EXCLUDED.status, reason = EXCLUDED.reason,
      evidence_due_at = EXCLUDED.evidence_due_at,
      closed_at = EXCLUDED.closed_at, last_event_id = EXCLUDED.last_event_id,
      last_event_created_at = EXCLUDED.last_event_created_at
    WHERE (payment_disputes.last_event_created_at, payment_disputes.last_event_id)
      < (EXCLUDED.last_event_created_at, EXCLUDED.last_event_id)
  `, [dispute.id, order.id, chargeId, amount, disputeCurrency, status,
    dispute.reason || null, evidenceDueAt, openedAt, closedAt, row.stripe_event_id,
    cents(row.payload.created, "event.created")]);

  const captured = cents(order.captured_cents, "captured_cents");
  const refunded = cents(order.refunded_cents, "refunded_cents");
  if (!captured) throw new Error("Stripe dispute is waiting for its captured payment event");
  const merchantResolved = ["won", "warning_closed", "prevented"].includes(status);
  const target = merchantResolved ? paymentStateForRefunds(captured, refunded) : "disputed";
  if (order.payment_status !== target) {
    const permitted = target === "disputed"
      ? ["paid", "partially_refunded", "refunded"].includes(order.payment_status)
      : order.payment_status === "disputed";
    if (!permitted) throw new Error(`Stripe dispute cannot move payment state from ${order.payment_status} to ${target}`);
    await client.query("UPDATE orders SET payment_status = $2, version = version + 1 WHERE id = $1", [order.id, target]);
    await appendStatus(client, { orderId: order.id, workflow: "payment", from: order.payment_status, to: target, eventId: row.stripe_event_id, reason: `Stripe dispute status: ${status}` });
  }

  for (const balanceTransaction of context.balanceTransactions || []) {
    const sourceId = typeof balanceTransaction.source === "string"
      ? balanceTransaction.source
      : balanceTransaction.source?.id;
    if (sourceId !== dispute.id || balanceTransaction.type !== "adjustment") {
      throw new Error("Stripe balance transaction is not an adjustment for this dispute");
    }
    const balanceCurrency = currency(balanceTransaction.currency, "dispute balance transaction currency");
    if (balanceCurrency !== disputeCurrency) throw new Error("Stripe dispute balance transaction currency does not match the order");
    const net = Number(balanceTransaction.net);
    if (!Number.isSafeInteger(net)) throw new Error("Stripe dispute balance transaction net is invalid");
    if (!net) continue;
    const transactionAmount = Math.abs(net);
    await client.query(`
      INSERT INTO payment_transactions (order_id, stripe_object_id, transaction_type, amount_cents, currency, status, occurred_at)
      VALUES ($1,$2,$3,$4,$5,'succeeded',to_timestamp($6))
      ON CONFLICT (stripe_object_id) DO NOTHING
    `, [order.id, balanceTransaction.id, net < 0 ? "dispute" : "dispute_reversal",
      transactionAmount, balanceCurrency, balanceTransaction.created || row.payload.created]);
    const entry = await client.query(`
      INSERT INTO journal_entries (order_id, source_type, source_id, description, currency, occurred_at)
      VALUES ($1,'stripe_dispute_balance_transaction',$2,$3,$4,to_timestamp($5))
      ON CONFLICT (source_type, source_id) DO NOTHING
      RETURNING id
    `, [order.id, balanceTransaction.id, net < 0 ? "Stripe dispute funds withdrawn" : "Stripe dispute funds reinstated",
      balanceCurrency, balanceTransaction.created || row.payload.created]);
    if (!entry.rowCount) continue;
    const lines = net < 0
      ? [["6300", transactionAmount, 0], ["1000", 0, transactionAmount]]
      : [["1000", transactionAmount, 0], ["6300", 0, transactionAmount]];
    for (const [account, debit, credit] of lines) {
      await client.query("INSERT INTO journal_lines (journal_entry_id, account_code, debit_cents, credit_cents) VALUES ($1,$2,$3,$4)", [entry.rows[0].id, account, debit, credit]);
    }
  }
  await client.query(`
    INSERT INTO notification_outbox (topic, deduplication_key, payload)
    VALUES ('finance.payment_dispute.changed', $1, $2)
    ON CONFLICT (deduplication_key) DO NOTHING
  `, [`dispute:${row.stripe_event_id}`, { orderId: order.id, disputeId: dispute.id, status, amountCents: amount }]);
};

const applyEvent = async (client, row, context = {}) => {
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(row.event_type)) return processPaidSession(client, row);
  if (["checkout.session.async_payment_failed", "checkout.session.expired"].includes(row.event_type)) return processFailedSession(client, row);
  if (["refund.created", "refund.updated"].includes(row.event_type)) return processRefund(client, row);
  if (["charge.succeeded", "charge.updated"].includes(row.event_type)) return processCharge(client, row, context);
  if (disputeEvents.has(row.event_type)) return processDispute(client, row, context);
};

const finishEvent = async (client, eventId, workerId) => {
  const result = await client.query(`
    UPDATE webhook_events
    SET processing_status = 'processed', processed_at = now(), locked_by = NULL, locked_until = NULL, last_error = NULL
    WHERE stripe_event_id = $1 AND locked_by = $2 AND locked_until >= now()
  `, [eventId, workerId]);
  if (result.rowCount !== 1) throw new Error("Stripe event processing lease was lost before completion");
};

const retryEvent = (pool, row, error) => {
  const dead = row.attempts >= 10;
  const delayMinutes = Math.min(360, 2 ** Math.min(row.attempts, 8));
  return pool.query(`
    UPDATE webhook_events
    SET processing_status = $2, next_attempt_at = now() + ($3 * interval '1 minute'),
        locked_by = NULL, locked_until = NULL, last_error = $4
    WHERE stripe_event_id = $1 AND locked_by = $5
  `, [row.stripe_event_id, dead ? "dead_letter" : "retry", delayMinutes, String(error?.message || error).slice(0, 2_000), row.locked_by]);
};

export const processClaimedEvent = async (pool, row, { stripe } = {}) => {
  const context = await prepareEvent(row, stripe);
  return withTransaction(pool, async (client) => {
    await applyEvent(client, row, context);
    await finishEvent(client, row.stripe_event_id, row.locked_by);
  });
};

export const runStripeEventBatch = async (pool, { workerId = crypto.randomUUID(), limit = 1, logger = console, stripe } = {}) => {
  const claimed = await claimStripeEvents(pool, workerId, limit);
  const summary = { claimed: claimed.length, processed: 0, retried: 0, deadLettered: 0 };
  for (const row of claimed) {
    try {
      await processClaimedEvent(pool, row, { stripe });
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

export const _internals = {
  applyEvent,
  cents,
  currency,
  disputeEvents,
  ensurePaidJournal,
  linkedOrderForSession,
  paymentStateForRefunds,
  prepareEvent,
  processCharge,
  processDispute,
  retryEvent,
};
