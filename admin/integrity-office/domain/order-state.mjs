const freezeTransitions = (source) => Object.freeze(Object.fromEntries(
  Object.entries(source).map(([state, targets]) => [state, Object.freeze(new Set(targets))]),
));

export const PAYMENT_TRANSITIONS = freezeTransitions({
  checkout_open: ["processing", "expired"],
  processing: ["paid", "failed", "expired"],
  paid: ["partially_refunded", "refunded", "disputed"],
  failed: [],
  expired: [],
  partially_refunded: ["partially_refunded", "refunded", "disputed"],
  refunded: ["disputed"],
  disputed: ["paid", "partially_refunded", "refunded"],
});

export const FULFILLMENT_TRANSITIONS = freezeTransitions({
  fitment_review: ["ready_for_supplier", "canceled"],
  ready_for_supplier: ["supplier_ordered", "canceled"],
  supplier_ordered: ["building", "shipped", "canceled"],
  building: ["shipped", "canceled"],
  shipped: ["delivered"],
  delivered: ["closed"],
  canceled: ["closed"],
  closed: [],
});

export const CORE_TRANSITIONS = freezeTransitions({
  not_required: [],
  awaiting_return: ["pickup_scheduled", "in_transit", "received", "forfeited"],
  pickup_scheduled: ["awaiting_return", "in_transit", "received", "forfeited"],
  in_transit: ["received", "forfeited"],
  received: ["accepted", "rejected"],
  accepted: ["refund_due"],
  rejected: ["awaiting_return", "forfeited"],
  refund_due: ["refunded"],
  refunded: [],
  forfeited: [],
});

export function assertTransition(machine, from, to) {
  if (!Object.hasOwn(machine, from)) throw new Error(`Unknown current state: ${from}`);
  if (!Object.hasOwn(machine, to)) throw new Error(`Unknown target state: ${to}`);
  if (!machine[from].has(to)) throw new Error(`Transition not allowed: ${from} -> ${to}`);
  return to;
}

const assertCents = (name, value) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer number of cents`);
};

export function summarizeOrderMoney({
  transmissionCents,
  freightChargedCents,
  discountCents = 0,
  salesTaxCents,
  coreDepositCents,
  supplierUnitCostCents,
  supplierFreightCostCents,
  refundedCents = 0,
}) {
  const values = {
    transmissionCents,
    freightChargedCents,
    discountCents,
    salesTaxCents,
    coreDepositCents,
    supplierUnitCostCents,
    supplierFreightCostCents,
    refundedCents,
  };
  for (const [name, value] of Object.entries(values)) assertCents(name, value);

  const merchandiseRevenueCents = transmissionCents + freightChargedCents - discountCents;
  if (merchandiseRevenueCents < 0) throw new RangeError("Discount cannot exceed taxable merchandise and freight");

  return Object.freeze({
    customerTotalCents: merchandiseRevenueCents + salesTaxCents + coreDepositCents,
    merchandiseRevenueCents,
    salesTaxLiabilityCents: salesTaxCents,
    coreLiabilityCents: coreDepositCents,
    costOfGoodsCents: supplierUnitCostCents + supplierFreightCostCents,
    grossProfitBeforeFeesCents: merchandiseRevenueCents - supplierUnitCostCents - supplierFreightCostCents,
    refundedCents,
  });
}
