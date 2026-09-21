import { normalizePromotionCode } from "../domain/order-state.mjs";
import { badRequest } from "./errors.mjs";

const STAFF_ROLES = Object.freeze(["viewer", "operations", "finance", "administrator"]);
const REFUND_CATEGORIES = Object.freeze(["transmission", "freight", "sales_tax", "core_deposit", "other"]);
const PRODUCT_KINDS = Object.freeze(["transmission", "engine", "transfer_case", "differential", "accessory", "service"]);
const LEAD_STATES = Object.freeze(["new", "assigned", "contacted", "qualified", "quoted", "won", "lost", "closed"]);
const TASK_STATES = Object.freeze(["open", "in_progress", "blocked", "completed", "canceled"]);
const TASK_PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);
const TASK_ENTITIES = Object.freeze(["lead", "quote", "order", "customer", "purchase_order", "shipment", "core_return", "warranty_claim", "dispute", "system"]);
const CATALOG_STATUSES = Object.freeze(["draft", "active", "paused", "retired"]);
const PRODUCT_CONDITIONS = Object.freeze(["remanufactured", "new", "used"]);
const PURCHASE_ORDER_STATES = Object.freeze(["draft", "approved", "submitted", "acknowledged", "backordered", "partially_shipped", "shipped", "received", "canceled", "closed"]);
const SHIPMENT_DIRECTIONS = Object.freeze(["outbound", "replacement", "core_return", "customer_return"]);
const SHIPMENT_STATES = Object.freeze(["planned", "booked", "in_transit", "delivered", "exception", "canceled"]);
const WARRANTY_STATES = Object.freeze(["intake", "evidence_needed", "submitted", "authorized", "denied", "repairing", "replacement_shipping", "reimbursing", "resolved", "closed"]);

export const uuid = (value, field = "id") => {
  const result = String(value || "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(result)) {
    throw badRequest(`${field} must be a valid identifier.`);
  }
  return result;
};

export const boundedText = (value, field, maximum, { required = true } = {}) => {
  const result = String(value ?? "").replace(/\s+/g, " ").trim();
  if (required && !result) throw badRequest(`${field} is required.`);
  if (result.length > maximum) throw badRequest(`${field} is too long.`);
  return result || null;
};

export const positiveInteger = (value, field, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw badRequest(`${field} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
};

export const optionalPositiveInteger = (value, field, options) => (
  value === null || value === undefined || value === "" ? null : positiveInteger(value, field, options)
);

export const instant = (value, field) => {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw badRequest(`${field} must be a valid date and time.`);
  return parsed.toISOString();
};

const dateOnly = (value, field) => {
  const result = boundedText(value, field, 10);
  const parsed = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw badRequest(`${field} must be a valid date.`);
  return result;
};

export const emailAddress = (value, field = "email") => {
  const result = boundedText(value, field, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw badRequest(`${field} must be a valid email address.`);
  return result;
};

const optionalEmailAddress = (value, field = "email") => (
  value === null || value === undefined || String(value).trim() === "" ? null : emailAddress(value, field)
);

const listedValue = (value, field, allowed) => {
  const result = boundedText(value, field, 40);
  if (!allowed.includes(result)) throw badRequest(`${field} is not valid.`);
  return result;
};

const plainObject = (value, field, { required = false } = {}) => {
  if (value === null || value === undefined) {
    if (required) throw badRequest(`${field} is required.`);
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) throw badRequest(`${field} must be an object.`);
  return value;
};

const objectArray = (value, field) => {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "object" || !entry || Array.isArray(entry))) {
    throw badRequest(`${field} must be an array of objects.`);
  }
  return value;
};

const roleList = (value) => {
  if (!Array.isArray(value)) throw badRequest("roles must be an array.");
  const roles = [...new Set(value.map((role) => String(role).trim().toLowerCase()))];
  if (!roles.length || roles.some((role) => !STAFF_ROLES.includes(role))) {
    throw badRequest("roles must contain at least one valid staff role.");
  }
  return Object.freeze(roles);
};

export const pageOptions = (values = {}) => ({
  page: positiveInteger(values.page || 1, "page", { minimum: 1, maximum: 10_000 }),
  pageSize: positiveInteger(values.pageSize || 25, "pageSize", { minimum: 1, maximum: 100 }),
});

export const promotionInput = (body) => {
  let code;
  try {
    code = normalizePromotionCode(body.code);
  } catch (error) {
    throw badRequest(error.message);
  }
  const amountOffCents = optionalPositiveInteger(body.amountOffCents, "amountOffCents", { minimum: 1, maximum: 10_000_000 });
  const percentOff = body.percentOff === null || body.percentOff === undefined || body.percentOff === ""
    ? null
    : Number(body.percentOff);
  if ((amountOffCents === null) === (percentOff === null)) throw badRequest("Choose exactly one promotion discount type.");
  if (percentOff !== null && (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100)) {
    throw badRequest("percentOff must be greater than 0 and no more than 100.");
  }
  if (percentOff !== null && Math.abs(percentOff - Math.round(percentOff * 100) / 100) > 1e-9) {
    throw badRequest("percentOff may contain no more than two decimal places.");
  }
  const startsAt = instant(body.startsAt, "startsAt");
  const endsAt = body.endsAt ? instant(body.endsAt, "endsAt") : null;
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) throw badRequest("endsAt must be later than startsAt.");
  return Object.freeze({
    code,
    amountOffCents,
    percentOff,
    startsAt,
    endsAt,
    maxRedemptions: optionalPositiveInteger(body.maxRedemptions, "maxRedemptions", { minimum: 1, maximum: 1_000_000 }),
    maxRedemptionsPerCustomer: optionalPositiveInteger(body.maxRedemptionsPerCustomer ?? 1, "maxRedemptionsPerCustomer", { minimum: 1, maximum: 100 }),
    minimumMarginCents: optionalPositiveInteger(body.minimumMarginCents ?? 35_000, "minimumMarginCents", { minimum: 0, maximum: 100_000_000 }),
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const freightStatusInput = (body) => {
  const status = boundedText(body.status, "status", 32);
  if (!["open", "contacted", "quoted", "converted", "closed"].includes(status)) throw badRequest("status is not valid.");
  const terminal = ["converted", "closed"].includes(status);
  const resolutionNote = boundedText(body.resolutionNote, "resolutionNote", 2_000, { required: terminal });
  return Object.freeze({
    status,
    assignedTo: Object.hasOwn(body, "assignedTo") ? (body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null) : undefined,
    nextFollowUpAt: body.nextFollowUpAt ? instant(body.nextFollowUpAt, "nextFollowUpAt") : null,
    resolutionNote,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const fitmentReviewInput = (body) => {
  const decision = boundedText(body.decision, "decision", 16);
  if (!["approved", "rejected"].includes(decision)) throw badRequest("decision must be approved or rejected.");
  return Object.freeze({
    version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
    decision,
    supplierPartUid: boundedText(body.supplierPartUid, "supplierPartUid", 160),
    reason: boundedText(body.reason, "reason", 1_000),
  });
};

export const supplierOrderInput = (body) => Object.freeze({
  version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
  supplierName: boundedText(body.supplierName, "supplierName", 160),
  supplierOrderReference: boundedText(body.supplierOrderReference, "supplierOrderReference", 160),
  estimatedShipAt: body.estimatedShipAt ? instant(body.estimatedShipAt, "estimatedShipAt") : null,
  reason: boundedText(body.reason, "reason", 1_000),
});

export const shipmentInput = (body) => Object.freeze({
  version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
  carrier: boundedText(body.carrier, "carrier", 120),
  trackingNumber: boundedText(body.trackingNumber, "trackingNumber", 200),
  reason: boundedText(body.reason, "reason", 1_000),
});

export const staffInput = (body) => Object.freeze({
  auth0Subject: boundedText(body.auth0Subject, "auth0Subject", 255),
  email: emailAddress(body.email),
  displayName: boundedText(body.displayName, "displayName", 160),
  roles: roleList(body.roles),
  reason: boundedText(body.reason, "reason", 500),
});

export const staffAccessInput = (body) => Object.freeze({
  roles: roleList(body.roles),
  active: body.active !== false,
  reason: boundedText(body.reason, "reason", 500),
});

export const refundClassificationInput = (body) => {
  if (!Array.isArray(body.allocations) || !body.allocations.length || body.allocations.length > REFUND_CATEGORIES.length) {
    throw badRequest("allocations must contain between one and five entries.");
  }
  const seen = new Set();
  const allocations = body.allocations.map((entry, index) => {
    const category = boundedText(entry?.category, `allocations[${index}].category`, 32);
    if (!REFUND_CATEGORIES.includes(category)) throw badRequest(`allocations[${index}].category is not valid.`);
    if (seen.has(category)) throw badRequest("Each refund category may appear only once.");
    seen.add(category);
    return Object.freeze({
      category,
      amountCents: positiveInteger(entry?.amountCents, `allocations[${index}].amountCents`, { minimum: 1 }),
    });
  });
  return Object.freeze({ allocations: Object.freeze(allocations), reason: boundedText(body.reason, "reason", 500) });
};

export const leadInput = (body) => {
  const contactEmail = optionalEmailAddress(body.contactEmail, "contactEmail");
  const contactPhone = boundedText(body.contactPhone, "contactPhone", 40, { required: false });
  if (!contactEmail && !contactPhone) throw badRequest("A contact email or phone number is required.");
  const vehicleSummary = body.vehicleSummary && typeof body.vehicleSummary === "object" && !Array.isArray(body.vehicleSummary)
    ? body.vehicleSummary
    : {};
  return Object.freeze({
    contactName: boundedText(body.contactName, "contactName", 160),
    contactEmail,
    contactPhone,
    organizationName: boundedText(body.organizationName, "organizationName", 160, { required: false }),
    productInterest: body.productInterest ? listedValue(body.productInterest, "productInterest", PRODUCT_KINDS) : null,
    vehicleSummary,
    source: boundedText(body.source, "source", 120),
    priority: listedValue(body.priority || "normal", "priority", TASK_PRIORITIES),
    estimatedValueCents: optionalPositiveInteger(body.estimatedValueCents, "estimatedValueCents", { minimum: 0, maximum: 1_000_000_000 }),
    assignedTo: body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null,
    nextFollowUpAt: body.nextFollowUpAt ? instant(body.nextFollowUpAt, "nextFollowUpAt") : null,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const leadUpdateInput = (body) => {
  const state = listedValue(body.state, "state", LEAD_STATES);
  return Object.freeze({
    version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
    state,
    priority: listedValue(body.priority || "normal", "priority", TASK_PRIORITIES),
    assignedTo: Object.hasOwn(body, "assignedTo") ? (body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null) : undefined,
    nextFollowUpAt: body.nextFollowUpAt ? instant(body.nextFollowUpAt, "nextFollowUpAt") : null,
    lostReason: boundedText(body.lostReason, "lostReason", 500, { required: state === "lost" }),
    wonOrderId: state === "won" ? uuid(body.wonOrderId, "wonOrderId") : null,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const taskInput = (body) => Object.freeze({
  taskType: boundedText(body.taskType, "taskType", 80),
  title: boundedText(body.title, "title", 240),
  entityType: listedValue(body.entityType, "entityType", TASK_ENTITIES),
  entityId: body.entityId ? uuid(body.entityId, "entityId") : null,
  priority: listedValue(body.priority || "normal", "priority", TASK_PRIORITIES),
  assignedTo: body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null,
  customerId: body.customerId ? uuid(body.customerId, "customerId") : null,
  orderId: body.orderId ? uuid(body.orderId, "orderId") : null,
  requiredCapability: listedValue(body.requiredCapability || "operations", "requiredCapability", ["operations", "finance", "administrator"]),
  deduplicationKey: boundedText(body.deduplicationKey, "deduplicationKey", 240, { required: false }),
  dueAt: body.dueAt ? instant(body.dueAt, "dueAt") : null,
  reason: boundedText(body.reason, "reason", 500),
});

export const taskUpdateInput = (body) => {
  const state = listedValue(body.state, "state", TASK_STATES);
  return Object.freeze({
    version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
    state,
    priority: listedValue(body.priority || "normal", "priority", TASK_PRIORITIES),
    assignedTo: Object.hasOwn(body, "assignedTo") ? (body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null) : undefined,
    dueAt: body.dueAt ? instant(body.dueAt, "dueAt") : null,
    blockedReason: boundedText(body.blockedReason, "blockedReason", 500, { required: state === "blocked" }),
    completionEvidence: boundedText(body.completionEvidence, "completionEvidence", 1_000, { required: state === "completed" }),
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const supplierInput = (body, { update = false } = {}) => Object.freeze({
  ...(update ? { version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }) } : {
    code: boundedText(body.code, "code", 40).toUpperCase(),
  }),
  displayName: boundedText(body.displayName, "displayName", 160),
  orderingMethod: boundedText(body.orderingMethod, "orderingMethod", 500, { required: false }),
  warrantyTermsReference: boundedText(body.warrantyTermsReference, "warrantyTermsReference", 1_000, { required: false }),
  coreTermsReference: boundedText(body.coreTermsReference, "coreTermsReference", 1_000, { required: false }),
  active: body.active !== false,
  reason: boundedText(body.reason, "reason", 500),
});

export const catalogProductInput = (body, { update = false } = {}) => {
  const status = listedValue(body.status || "draft", "status", CATALOG_STATUSES);
  const lastVerifiedAt = body.lastVerifiedAt ? instant(body.lastVerifiedAt, "lastVerifiedAt") : null;
  if (status === "active" && !lastVerifiedAt) throw badRequest("lastVerifiedAt is required before a catalog product can be active.");
  const gtin = boundedText(body.gtin, "gtin", 14, { required: false });
  if (gtin && !/^[0-9]{8,14}$/.test(gtin)) throw badRequest("gtin must contain 8 to 14 digits.");
  return Object.freeze({
    ...(update ? { version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }) } : {
      integritySku: boundedText(body.integritySku, "integritySku", 80).toUpperCase(),
      supplierId: uuid(body.supplierId, "supplierId"),
    }),
    supplierSku: boundedText(body.supplierSku, "supplierSku", 160),
    kind: listedValue(body.kind, "kind", PRODUCT_KINDS),
    title: boundedText(body.title, "title", 240),
    manufacturerBrand: boundedText(body.manufacturerBrand, "manufacturerBrand", 160, { required: false }),
    manufacturerPartNumber: boundedText(body.manufacturerPartNumber, "manufacturerPartNumber", 160, { required: false }),
    gtin,
    condition: listedValue(body.condition || "remanufactured", "condition", PRODUCT_CONDITIONS),
    applicationData: plainObject(body.applicationData, "applicationData"),
    packageContents: objectArray(body.packageContents, "packageContents"),
    warrantyData: plainObject(body.warrantyData, "warrantyData"),
    shippingData: plainObject(body.shippingData, "shippingData"),
    imageProvenance: objectArray(body.imageProvenance, "imageProvenance"),
    status,
    lastVerifiedAt,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const catalogPriceInput = (body) => {
  const verifiedAt = instant(body.verifiedAt, "verifiedAt");
  const validThrough = body.validThrough ? instant(body.validThrough, "validThrough") : null;
  if (validThrough && new Date(validThrough) <= new Date(verifiedAt)) throw badRequest("validThrough must be later than verifiedAt.");
  return Object.freeze({
    supplierUnitCostCents: positiveInteger(body.supplierUnitCostCents, "supplierUnitCostCents", { minimum: 0, maximum: 1_000_000_000 }),
    supplierCoreDepositCents: positiveInteger(body.supplierCoreDepositCents || 0, "supplierCoreDepositCents", { minimum: 0, maximum: 1_000_000_000 }),
    suggestedRetailCents: optionalPositiveInteger(body.suggestedRetailCents, "suggestedRetailCents", { minimum: 0, maximum: 1_000_000_000 }),
    availabilityCode: boundedText(body.availabilityCode, "availabilityCode", 80),
    availabilityText: boundedText(body.availabilityText, "availabilityText", 500),
    sourceReference: boundedText(body.sourceReference, "sourceReference", 500),
    verifiedAt,
    validThrough,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const purchaseOrderInput = (body) => {
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 100) throw badRequest("lines must contain between one and 100 entries.");
  const lines = body.lines.map((line, index) => Object.freeze({
    orderItemId: uuid(line?.orderItemId, `lines[${index}].orderItemId`),
    supplierSku: boundedText(line?.supplierSku, `lines[${index}].supplierSku`, 160),
    description: boundedText(line?.description, `lines[${index}].description`, 500),
    quantity: positiveInteger(line?.quantity, `lines[${index}].quantity`, { minimum: 1, maximum: 100 }),
    unitCostCents: positiveInteger(line?.unitCostCents, `lines[${index}].unitCostCents`, { minimum: 0, maximum: 1_000_000_000 }),
    coreChargeCents: positiveInteger(line?.coreChargeCents || 0, `lines[${index}].coreChargeCents`, { minimum: 0, maximum: 1_000_000_000 }),
  }));
  if (new Set(lines.map((line) => line.orderItemId)).size !== lines.length) throw badRequest("Each order item may appear only once on a purchase order.");
  return Object.freeze({
    orderId: uuid(body.orderId, "orderId"),
    supplierId: uuid(body.supplierId, "supplierId"),
    purchaseOrderNumber: boundedText(body.purchaseOrderNumber, "purchaseOrderNumber", 80),
    supplierOrderReference: boundedText(body.supplierOrderReference, "supplierOrderReference", 160, { required: false }),
    freightCents: positiveInteger(body.freightCents || 0, "freightCents", { minimum: 0, maximum: 1_000_000_000 }),
    taxCents: positiveInteger(body.taxCents || 0, "taxCents", { minimum: 0, maximum: 1_000_000_000 }),
    estimatedShipAt: body.estimatedShipAt ? instant(body.estimatedShipAt, "estimatedShipAt") : null,
    lines: Object.freeze(lines),
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const purchaseOrderUpdateInput = (body) => {
  const state = listedValue(body.state, "state", PURCHASE_ORDER_STATES);
  return Object.freeze({
    version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }),
    state,
    supplierOrderReference: boundedText(body.supplierOrderReference, "supplierOrderReference", 160, { required: false }),
    estimatedShipAt: body.estimatedShipAt ? instant(body.estimatedShipAt, "estimatedShipAt") : null,
    cancellationReason: boundedText(body.cancellationReason, "cancellationReason", 500, { required: state === "canceled" }),
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const fulfillmentShipmentInput = (body, { update = false } = {}) => {
  const status = listedValue(body.status || "planned", "status", SHIPMENT_STATES);
  const carrier = boundedText(body.carrier, "carrier", 120, { required: status !== "planned" });
  if (!update && (!Array.isArray(body.items) || !body.items.length || body.items.length > 100)) {
    throw badRequest("items must contain between one and 100 entries.");
  }
  return Object.freeze({
    ...(update ? { version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }) } : {
      orderId: uuid(body.orderId, "orderId"),
      purchaseOrderId: body.purchaseOrderId ? uuid(body.purchaseOrderId, "purchaseOrderId") : null,
      warrantyClaimId: body.warrantyClaimId ? uuid(body.warrantyClaimId, "warrantyClaimId") : null,
      direction: listedValue(body.direction, "direction", SHIPMENT_DIRECTIONS),
      items: Object.freeze((Array.isArray(body.items) ? body.items : []).map((item, index) => Object.freeze({
        orderItemId: uuid(item?.orderItemId, `items[${index}].orderItemId`),
        purchaseOrderLineId: item?.purchaseOrderLineId ? uuid(item.purchaseOrderLineId, `items[${index}].purchaseOrderLineId`) : null,
        quantity: positiveInteger(item?.quantity, `items[${index}].quantity`, { minimum: 1, maximum: 100 }),
        unitSerialNumber: boundedText(item?.unitSerialNumber, `items[${index}].unitSerialNumber`, 160, { required: false }),
      }))),
    }),
    carrier,
    serviceLevel: boundedText(body.serviceLevel, "serviceLevel", 120, { required: false }),
    trackingNumber: boundedText(body.trackingNumber, "trackingNumber", 200, { required: false }),
    bolOrProNumber: boundedText(body.bolOrProNumber, "bolOrProNumber", 200, { required: false }),
    status,
    shippedAt: body.shippedAt ? instant(body.shippedAt, "shippedAt") : null,
    deliveredAt: body.deliveredAt ? instant(body.deliveredAt, "deliveredAt") : null,
    exceptionReason: boundedText(body.exceptionReason, "exceptionReason", 1_000, { required: status === "exception" }),
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const warrantyClaimInput = (body, { update = false } = {}) => {
  const state = listedValue(body.state || "intake", "state", WARRANTY_STATES);
  const mileageAtInstall = optionalPositiveInteger(body.mileageAtInstall, "mileageAtInstall", { minimum: 0, maximum: 10_000_000 });
  const mileageAtClaim = optionalPositiveInteger(body.mileageAtClaim, "mileageAtClaim", { minimum: 0, maximum: 10_000_000 });
  if (mileageAtInstall !== null && mileageAtClaim !== null && mileageAtClaim < mileageAtInstall) throw badRequest("mileageAtClaim cannot be lower than mileageAtInstall.");
  return Object.freeze({
    ...(update ? { version: positiveInteger(body.version, "version", { minimum: 1, maximum: 1_000_000 }) } : {
      orderId: uuid(body.orderId, "orderId"),
      orderItemId: body.orderItemId ? uuid(body.orderItemId, "orderItemId") : null,
      supplierId: body.supplierId ? uuid(body.supplierId, "supplierId") : null,
      complaint: boundedText(body.complaint, "complaint", 5_000),
    }),
    state,
    supplierClaimReference: boundedText(body.supplierClaimReference, "supplierClaimReference", 160, { required: false }),
    installedAt: body.installedAt ? dateOnly(body.installedAt, "installedAt") : null,
    mileageAtInstall,
    mileageAtClaim,
    installerName: boundedText(body.installerName, "installerName", 240, { required: false }),
    evidenceDeadline: body.evidenceDeadline ? instant(body.evidenceDeadline, "evidenceDeadline") : null,
    decisionReason: boundedText(body.decisionReason, "decisionReason", 2_000, { required: ["authorized", "denied", "resolved", "closed"].includes(state) }),
    approvedPartsCents: optionalPositiveInteger(body.approvedPartsCents, "approvedPartsCents", { minimum: 0, maximum: 1_000_000_000 }),
    approvedLaborCents: optionalPositiveInteger(body.approvedLaborCents, "approvedLaborCents", { minimum: 0, maximum: 1_000_000_000 }),
    approvedFreightCents: optionalPositiveInteger(body.approvedFreightCents, "approvedFreightCents", { minimum: 0, maximum: 1_000_000_000 }),
    authorizedReplacementQuantity: optionalPositiveInteger(body.authorizedReplacementQuantity, "authorizedReplacementQuantity", { minimum: 0, maximum: 100 }),
    assignedTo: Object.hasOwn(body, "assignedTo") ? (body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null) : undefined,
    reason: boundedText(body.reason, "reason", 500),
  });
};

export const _internals = { CATALOG_STATUSES, LEAD_STATES, PRODUCT_KINDS, PURCHASE_ORDER_STATES, REFUND_CATEGORIES, SHIPMENT_STATES, STAFF_ROLES, TASK_ENTITIES, TASK_PRIORITIES, TASK_STATES, WARRANTY_STATES, roleList };
