import { normalizePromotionCode } from "../domain/order-state.mjs";
import { badRequest } from "./errors.mjs";

const STAFF_ROLES = Object.freeze(["viewer", "operations", "finance", "administrator"]);
const REFUND_CATEGORIES = Object.freeze(["transmission", "freight", "sales_tax", "core_deposit", "other"]);
const PRODUCT_KINDS = Object.freeze(["transmission", "engine", "transfer_case", "differential", "accessory", "service"]);
const LEAD_STATES = Object.freeze(["new", "assigned", "contacted", "qualified", "quoted", "won", "lost", "closed"]);
const TASK_STATES = Object.freeze(["open", "in_progress", "blocked", "completed", "canceled"]);
const TASK_PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);
const TASK_ENTITIES = Object.freeze(["lead", "quote", "order", "customer", "purchase_order", "shipment", "core_return", "warranty_claim", "dispute", "system"]);

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

export const _internals = { LEAD_STATES, PRODUCT_KINDS, REFUND_CATEGORIES, STAFF_ROLES, TASK_ENTITIES, TASK_PRIORITIES, TASK_STATES, roleList };
