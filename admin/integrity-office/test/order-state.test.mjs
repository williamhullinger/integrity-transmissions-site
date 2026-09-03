import assert from "node:assert/strict";
import {
  CORE_TRANSITIONS,
  FULFILLMENT_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  assertTransition,
  summarizeOrderMoney,
} from "../domain/order-state.mjs";

assert.equal(assertTransition(PAYMENT_TRANSITIONS, "processing", "paid"), "paid");
assert.equal(assertTransition(FULFILLMENT_TRANSITIONS, "fitment_review", "ready_for_supplier"), "ready_for_supplier");
assert.equal(assertTransition(CORE_TRANSITIONS, "accepted", "refund_due"), "refund_due");

assert.throws(() => assertTransition(PAYMENT_TRANSITIONS, "checkout_open", "paid"), /not allowed/);
assert.throws(() => assertTransition(FULFILLMENT_TRANSITIONS, "fitment_review", "shipped"), /not allowed/);
assert.throws(() => assertTransition(CORE_TRANSITIONS, "awaiting_return", "refunded"), /not allowed/);

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

console.log("Integrity Office domain test passed: states and liability-aware accounting are enforced.");
