import assert from "node:assert/strict";
import test from "node:test";
import {
  fitmentReviewInput,
  refundClassificationInput,
  staffAccessInput,
  staffInput,
} from "../server/validation.mjs";

test("normalizes staff identities and rejects invalid or empty grants", () => {
  const input = staffInput({
    auth0Subject: "auth0|employee-1",
    email: " Employee@Example.COM ",
    displayName: "Employee One",
    roles: ["viewer", "viewer", "operations"],
    reason: "Operations assignment",
  });
  assert.equal(input.email, "employee@example.com");
  assert.deepEqual(input.roles, ["viewer", "operations"]);
  assert.throws(() => staffInput({ auth0Subject: "x", email: "invalid", displayName: "X", roles: ["viewer"], reason: "Test" }), /valid email/);
  assert.throws(() => staffAccessInput({ roles: [], active: false, reason: "Disable" }), /at least one valid/);
  assert.throws(() => staffAccessInput({ roles: ["owner"], reason: "Escalate" }), /valid staff role/);
});

test("requires explicit fitment decisions and supplier evidence", () => {
  const review = fitmentReviewInput({ version: 2, decision: "approved", supplierPartUid: "ACE-10R80", reason: "VIN verified" });
  assert.equal(review.decision, "approved");
  assert.throws(() => fitmentReviewInput({ version: 2, decision: "maybe", supplierPartUid: "ACE-10R80", reason: "VIN checked" }), /approved or rejected/);
  assert.throws(() => fitmentReviewInput({ version: 2, decision: "approved", reason: "VIN checked" }), /supplierPartUid is required/);
});

test("accepts exact refund allocation categories and rejects ambiguity", () => {
  const input = refundClassificationInput({
    allocations: [
      { category: "transmission", amountCents: 50000 },
      { category: "sales_tax", amountCents: 4125 },
    ],
    reason: "Stripe refund breakdown verified",
  });
  assert.equal(input.allocations.length, 2);
  assert.throws(() => refundClassificationInput({ allocations: [
    { category: "other", amountCents: 100 },
    { category: "other", amountCents: 200 },
  ], reason: "Duplicate" }), /only once/);
  assert.throws(() => refundClassificationInput({ allocations: [{ category: "fees", amountCents: 100 }], reason: "Invalid" }), /not valid/);
  assert.throws(() => refundClassificationInput({ allocations: [], reason: "Empty" }), /between one and five/);
});
