import assert from "node:assert/strict";
import {
  CORE_TRANSITIONS,
  FULFILLMENT_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  assertTransition,
  assertOperationalTransition,
  assertBalancedJournal,
  calculatePromotionDiscount,
  normalizePromotionCode,
  summarizeOrderMoney,
} from "../domain/order-state.mjs";

assert.equal(assertTransition(PAYMENT_TRANSITIONS, "processing", "paid"), "paid");
assert.equal(assertTransition(FULFILLMENT_TRANSITIONS, "fitment_review", "ready_for_supplier"), "ready_for_supplier");
assert.equal(assertTransition(CORE_TRANSITIONS, "accepted", "refund_due"), "refund_due");

assert.throws(() => assertTransition(PAYMENT_TRANSITIONS, "checkout_open", "paid"), /not allowed/);
assert.throws(() => assertTransition(FULFILLMENT_TRANSITIONS, "fitment_review", "shipped"), /not allowed/);
assert.throws(() => assertTransition(CORE_TRANSITIONS, "awaiting_return", "refunded"), /not allowed/);
assert.equal(assertOperationalTransition({ workflow: "fulfillment", from: "fitment_review", to: "ready_for_supplier", paymentStatus: "paid", coreStatus: "awaiting_return" }), "ready_for_supplier");
assert.throws(() => assertOperationalTransition({ workflow: "fulfillment", from: "fitment_review", to: "ready_for_supplier", paymentStatus: "checkout_open", coreStatus: "awaiting_return" }), /payment is confirmed/);
assert.throws(() => assertOperationalTransition({ workflow: "fulfillment", from: "delivered", to: "closed", paymentStatus: "paid", coreStatus: "awaiting_return" }), /core obligation/);
assert.equal(assertOperationalTransition({ workflow: "fulfillment", from: "canceled", to: "closed", paymentStatus: "refunded", coreStatus: "not_required" }), "closed");
assert.throws(() => assertOperationalTransition({ workflow: "fulfillment", from: "canceled", to: "closed", paymentStatus: "paid", coreStatus: "not_required" }), /fully refunded/);
assert.throws(() => assertTransition(FULFILLMENT_TRANSITIONS, "supplier_ordered", "canceled"), /not allowed/);

const money = summarizeOrderMoney({
  transmissionCents: 350_000,
  freightChargedCents: 21_750,
  salesTaxCents: 29_000,
  coreDepositCents: 100_000,
  supplierUnitCostCents: 300_000,
  supplierFreightCostCents: 21_750,
});

assert.equal(money.customerTotalCents, 500_750);
assert.equal(money.merchandiseRevenueCents, 371_750);
assert.equal(money.salesTaxLiabilityCents, 29_000);
assert.equal(money.coreLiabilityCents, 100_000);
assert.equal(money.grossProfitBeforeFeesCents, 50_000);
assert.throws(() => summarizeOrderMoney({
  transmissionCents: 1,
  freightChargedCents: 0,
  discountCents: 2,
  salesTaxCents: 0,
  coreDepositCents: 0,
  supplierUnitCostCents: 0,
  supplierFreightCostCents: 0,
}), /Discount cannot exceed/);

assert.equal(normalizePromotionCode(" fall-500 "), "FALL-500");
const promotion = calculatePromotionDiscount({
  code: "fall-500",
  active: true,
  approved: true,
  startsAt: "2026-09-01T00:00:00Z",
  endsAt: "2026-10-01T00:00:00Z",
  now: "2026-09-03T00:00:00Z",
  amountOffCents: 10_000,
  merchandiseCents: 350_000,
  supplierCostCents: 290_000,
  minimumMarginCents: 50_000,
});
assert.deepEqual(promotion, { code: "FALL-500", discountCents: 10_000, remainingMarginCents: 50_000 });

const fractionalPromotion = calculatePromotionDiscount({
  code: "BASIS-POINTS",
  active: true,
  approved: true,
  startsAt: "2026-01-01T00:00:00Z",
  now: new Date("2026-09-04T00:00:00Z"),
  percentOff: 1.13,
  merchandiseCents: 105_000,
  supplierCostCents: 50_000,
  minimumMarginCents: 0,
});
assert.equal(fractionalPromotion.discountCents, 1_187, "basis-point promotion rounding must match PostgreSQL exactly");
assert.throws(() => calculatePromotionDiscount({
  code: "TOO-PRECISE",
  active: true,
  approved: true,
  startsAt: "2026-01-01T00:00:00Z",
  now: new Date("2026-09-04T00:00:00Z"),
  percentOff: 1.125,
  merchandiseCents: 105_000,
  supplierCostCents: 50_000,
  minimumMarginCents: 0,
}), /two decimal places/);
assert.throws(() => calculatePromotionDiscount({
  code: "too-much",
  active: true,
  approved: true,
  startsAt: "2026-09-01T00:00:00Z",
  now: "2026-09-03T00:00:00Z",
  amountOffCents: 10_001,
  merchandiseCents: 350_000,
  supplierCostCents: 290_000,
  minimumMarginCents: 50_000,
}), /minimum margin/);
assert.throws(() => calculatePromotionDiscount({
  code: "used-up",
  active: true,
  approved: true,
  startsAt: "2026-09-01T00:00:00Z",
  now: "2026-09-03T00:00:00Z",
  amountOffCents: 1_000,
  merchandiseCents: 350_000,
  supplierCostCents: 290_000,
  minimumMarginCents: 50_000,
  redemptionCount: 10,
  maxRedemptions: 10,
}), /limit/);

assert.deepEqual(assertBalancedJournal([
  { debitCents: 500_750, creditCents: 0 },
  { debitCents: 0, creditCents: 371_750 },
  { debitCents: 0, creditCents: 29_000 },
  { debitCents: 0, creditCents: 100_000 },
]), { debits: 500_750, credits: 500_750 });
assert.throws(() => assertBalancedJournal([
  { debitCents: 100, creditCents: 0 },
  { debitCents: 0, creditCents: 99 },
]), /not balanced/);

console.log("Integrity Office domain test passed: states, promotions, margins, and balanced accounting are enforced.");
