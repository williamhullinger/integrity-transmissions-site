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
  supplier_ordered: ["building", "shipped"],
  building: ["shipped"],
  shipped: ["delivered"],
  delivered: ["closed"],
  canceled: ["closed"],
  closed: [],
});

export function assertOperationalTransition({ workflow, from, to, paymentStatus, coreStatus }) {
  if (workflow === "fulfillment") {
    assertTransition(FULFILLMENT_TRANSITIONS, from, to);
    if (from === "canceled" && to === "closed" && !["failed", "expired", "refunded"].includes(paymentStatus)) {
      throw new Error("A canceled order cannot close until payment is failed, expired, or fully refunded");
    }
    if (from !== "canceled" && to !== "canceled" && !["paid", "partially_refunded"].includes(paymentStatus)) {
      throw new Error("Fulfillment cannot advance until Stripe payment is confirmed");
    }
    if (to === "closed" && !["not_required", "refunded", "forfeited"].includes(coreStatus)) {
      throw new Error("Fulfillment cannot close while the core obligation is unresolved");
    }
    return to;
  }
  if (workflow === "core") {
    assertTransition(CORE_TRANSITIONS, from, to);
    if (!["paid", "partially_refunded", "refunded"].includes(paymentStatus)) {
      throw new Error("Core processing cannot advance until Stripe payment is confirmed");
    }
    return to;
  }
  throw new Error(`Unsupported operational workflow: ${workflow}`);
}

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

export function normalizePromotionCode(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(normalized)) {
    throw new TypeError("Promotion code must contain 3 to 32 letters, numbers, underscores, or hyphens");
  }
  return normalized;
}

export function calculatePromotionDiscount({
  code,
  active,
  approved,
  startsAt,
  endsAt = null,
  now = new Date(),
  amountOffCents = null,
  percentOff = null,
  merchandiseCents,
  supplierCostCents,
  minimumMarginCents,
  redemptionCount = 0,
  maxRedemptions = null,
  customerRedemptionCount = 0,
  maxRedemptionsPerCustomer = 1,
}) {
  const normalizedCode = normalizePromotionCode(code);
  for (const [name, value] of Object.entries({
    merchandiseCents,
    supplierCostCents,
    minimumMarginCents,
    redemptionCount,
    customerRedemptionCount,
    maxRedemptionsPerCustomer,
  })) assertCents(name, value);
  if (maxRedemptions !== null) assertCents("maxRedemptions", maxRedemptions);
  if (!active || !approved) throw new Error("Promotion is not approved and active");

  const instant = new Date(now).getTime();
  const start = new Date(startsAt).getTime();
  const end = endsAt === null ? null : new Date(endsAt).getTime();
  if (![instant, start, ...(end === null ? [] : [end])].every(Number.isFinite)) throw new TypeError("Promotion dates are invalid");
  if (instant < start || (end !== null && instant >= end)) throw new Error("Promotion is outside its active date range");
  if (maxRedemptions !== null && redemptionCount >= maxRedemptions) throw new Error("Promotion redemption limit has been reached");
  if (customerRedemptionCount >= maxRedemptionsPerCustomer) throw new Error("Customer promotion redemption limit has been reached");

  const hasAmount = amountOffCents !== null;
  const hasPercent = percentOff !== null;
  if (hasAmount === hasPercent) throw new TypeError("Promotion must define exactly one discount mode");
  let discountCents;
  if (hasAmount) {
    assertCents("amountOffCents", amountOffCents);
    discountCents = amountOffCents;
  } else {
    if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) throw new TypeError("percentOff must be greater than 0 and no more than 100");
    discountCents = Math.round(merchandiseCents * percentOff / 100);
  }

  discountCents = Math.min(discountCents, merchandiseCents);
  const remainingMarginCents = merchandiseCents - discountCents - supplierCostCents;
  if (remainingMarginCents < minimumMarginCents) throw new RangeError("Promotion would reduce the order below its minimum margin");

  return Object.freeze({ code: normalizedCode, discountCents, remainingMarginCents });
}

export function assertBalancedJournal(lines) {
  if (!Array.isArray(lines) || lines.length < 2) throw new TypeError("A journal entry requires at least two lines");
  const totals = lines.reduce((sum, line) => {
    assertCents("debitCents", line.debitCents || 0);
    assertCents("creditCents", line.creditCents || 0);
    if ((line.debitCents > 0) === (line.creditCents > 0)) throw new TypeError("Each journal line must contain exactly one positive side");
    sum.debits += line.debitCents || 0;
    sum.credits += line.creditCents || 0;
    return sum;
  }, { debits: 0, credits: 0 });
  if (totals.debits !== totals.credits) throw new RangeError("Journal entry is not balanced");
  return Object.freeze(totals);
}
