import { normalizePromotionCode } from "../domain/order-state.mjs";
import { badRequest } from "./errors.mjs";

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
    assignedTo: body.assignedTo ? uuid(body.assignedTo, "assignedTo") : null,
    nextFollowUpAt: body.nextFollowUpAt ? instant(body.nextFollowUpAt, "nextFollowUpAt") : null,
    resolutionNote,
    reason: boundedText(body.reason, "reason", 500),
  });
};
