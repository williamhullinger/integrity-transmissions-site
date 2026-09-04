const safeCents = (value) => {
  const parsed = Number(value || 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new RangeError("Stripe returned an invalid amount");
  return parsed;
};

export const reconcileStripe = async ({ stripe, repository, startAt, endAt }) => {
  const start = Math.floor(new Date(startAt).getTime() / 1_000);
  const end = Math.floor(new Date(endAt).getTime() / 1_000);
  const stripePayments = new Map();
  for await (const session of stripe.checkout.sessions.list({
    created: { gte: start, lt: end },
    limit: 100,
  })) {
    if (session.metadata?.order_type !== "reman_transmission") continue;
    if (!["paid", "no_payment_required"].includes(session.payment_status)) continue;
    stripePayments.set(session.id, safeCents(session.amount_total));
  }

  const officePayments = await repository.localStripePayments({ startAt, endAt });
  const localBySession = new Map(officePayments.map((payment) => [payment.stripeSessionId, payment]));
  const unmatchedStripe = [...stripePayments.keys()].filter((id) => !localBySession.has(id));
  const unmatchedOffice = officePayments.filter((payment) => !stripePayments.has(payment.stripeSessionId)).map((payment) => payment.stripeSessionId);
  const amountMismatches = officePayments
    .filter((payment) => stripePayments.has(payment.stripeSessionId) && stripePayments.get(payment.stripeSessionId) !== payment.amountCents)
    .map((payment) => ({ stripeSessionId: payment.stripeSessionId, stripeCents: stripePayments.get(payment.stripeSessionId), officeCents: payment.amountCents }));

  return {
    startAt,
    endAt,
    stripe: { count: stripePayments.size, totalCents: [...stripePayments.values()].reduce((sum, amount) => sum + amount, 0) },
    office: { count: officePayments.length, totalCents: officePayments.reduce((sum, payment) => sum + payment.amountCents, 0) },
    unmatchedStripe,
    unmatchedOffice,
    amountMismatches,
    balanced: unmatchedStripe.length === 0 && unmatchedOffice.length === 0 && amountMismatches.length === 0,
  };
};

export const _internals = { safeCents };
