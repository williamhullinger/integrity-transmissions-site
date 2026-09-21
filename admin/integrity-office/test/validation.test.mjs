import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogProductInput,
  fitmentReviewInput,
  fulfillmentShipmentInput,
  purchaseOrderInput,
  refundClassificationInput,
  staffAccessInput,
  staffInput,
  supplierInput,
  warrantyClaimInput,
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

test("validates supplier and catalog activation evidence", () => {
  const supplier = supplierInput({ code: " source-1 ", displayName: "Private Supplier", reason: "Approved sourcing record" });
  assert.equal(supplier.code, "SOURCE-1");
  const draft = catalogProductInput({
    integritySku: " itd-6l80-base ", supplierId: "68dcb2ea-a9a7-4ad0-a8cb-e477cd421299",
    supplierSku: "supplier-6l80", kind: "transmission", title: "6L80 remanufactured unit",
    applicationData: { family: "6L80" }, packageContents: [], warrantyData: {}, shippingData: {}, imageProvenance: [],
    status: "draft", reason: "Catalog intake",
  });
  assert.equal(draft.integritySku, "ITD-6L80-BASE");
  assert.throws(() => catalogProductInput({ ...draft, status: "active", lastVerifiedAt: null }), /lastVerifiedAt/);
  assert.throws(() => catalogProductInput({ ...draft, gtin: "not-a-gtin" }), /8 to 14 digits/);
});

test("validates purchase, shipment and warranty line-level evidence", () => {
  const orderId = "a1c342f6-0dd5-4e1a-a839-560bf0e11a21";
  const itemId = "68dcb2ea-a9a7-4ad0-a8cb-e477cd421299";
  const po = purchaseOrderInput({
    orderId, supplierId: "d28c5ae6-6d2e-4d98-947f-34ac176ad06d", purchaseOrderNumber: "PO-100",
    lines: [{ orderItemId: itemId, supplierSku: "SUP-1", description: "Unit", quantity: 1, unitCostCents: 300000 }],
    reason: "Verified supplier commitment",
  });
  assert.equal(po.lines.length, 1);
  assert.throws(() => purchaseOrderInput({ ...po, lines: [...po.lines, ...po.lines] }), /only once/);
  assert.throws(() => fulfillmentShipmentInput({ orderId, direction: "outbound", items: [], reason: "No lines" }), /between one and 100/);
  const claim = warrantyClaimInput({ orderId, orderItemId: itemId, complaint: "Delayed engagement", mileageAtInstall: 100000, mileageAtClaim: 100100, reason: "Customer intake" });
  assert.equal(claim.state, "intake");
  assert.throws(() => warrantyClaimInput({ orderId, complaint: "Complaint", mileageAtInstall: 200000, mileageAtClaim: 100000, reason: "Invalid mileage" }), /cannot be lower/);
});
