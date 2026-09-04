import { normalizePromotionCode } from "../domain/order-state.mjs";
import { getPool } from "./db.mjs";
import { publicError } from "./errors.mjs";
import { verifyInternalSignature } from "./internal-ingest.mjs";
import { PostgresOfficeRepository } from "./repository.mjs";
import { boundedText, positiveInteger } from "./validation.mjs";

const responseHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

const response = (statusCode, body) => ({ statusCode, headers: responseHeaders, body: JSON.stringify(body) });

const parsePromotionRequest = (raw, now = Date.now()) => {
  const body = JSON.parse(raw);
  const customerEmail = boundedText(body.customerEmail, "customerEmail", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new TypeError("Invalid customer email");
  let code;
  try {
    code = normalizePromotionCode(body.code);
  } catch (error) {
    throw new TypeError(error.message);
  }
  const listUnitPriceCents = positiveInteger(body.listUnitPriceCents, "listUnitPriceCents", { minimum: 1 });
  const freightChargedCents = positiveInteger(body.freightChargedCents, "freightChargedCents");
  const supplierUnitCostCents = positiveInteger(body.supplierUnitCostCents, "supplierUnitCostCents", { minimum: 1 });
  const supplierFreightCostCents = positiveInteger(body.supplierFreightCostCents, "supplierFreightCostCents");
  if (listUnitPriceCents - supplierUnitCostCents !== 50_000 || freightChargedCents !== supplierFreightCostCents) {
    throw new TypeError("Price snapshot did not pass the storefront margin policy");
  }
  const expiresAtSeconds = positiveInteger(body.expiresAt, "expiresAt", { minimum: 1 });
  const expiresAt = expiresAtSeconds * 1_000;
  if (expiresAt <= now + 60_000 || expiresAt > now + 24 * 60 * 60 * 1_000) {
    throw new TypeError("Promotion reservation expiry is invalid");
  }
  return Object.freeze({
    requestId: boundedText(body.requestId, "requestId", 128),
    checkoutAttemptKey: boundedText(body.checkoutAttemptKey, "checkoutAttemptKey", 128),
    code,
    customerEmail,
    listUnitPriceCents,
    freightChargedCents,
    supplierUnitCostCents,
    supplierFreightCostCents,
    reservedUntil: new Date(expiresAt).toISOString(),
  });
};

export const createInternalPromotionHandler = ({ env = process.env, repositoryFactory, logger = console } = {}) => async (event) => {
  if (event?.httpMethod !== "POST") return response(405, { error: "POST required" });
  const rawBuffer = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  if (rawBuffer.length > 24_000) return response(413, { error: "Payload too large" });
  const raw = rawBuffer.toString("utf8");
  const timestamp = event.headers?.["x-office-timestamp"] || event.headers?.["X-Office-Timestamp"] || "";
  const signature = event.headers?.["x-office-signature"] || event.headers?.["X-Office-Signature"] || "";
  if (!verifyInternalSignature({ raw, timestamp, signature, secret: String(env.OFFICE_INTERNAL_INGEST_SECRET || "") })) {
    return response(401, { error: "Invalid signature" });
  }

  let request;
  try {
    request = parsePromotionRequest(raw);
  } catch (error) {
    logger.warn("Integrity Office rejected an invalid promotion request", { error: error.message });
    return response(400, { error: "Promotion request was not accepted" });
  }

  try {
    const repository = repositoryFactory ? repositoryFactory() : new PostgresOfficeRepository(getPool(env));
    const reservation = await repository.reservePromotion(request);
    return response(200, {
      accepted: true,
      reservationId: reservation.id,
      code: reservation.code,
      discountCents: reservation.discountCents,
      reservedUntil: reservation.reservedUntil,
      duplicate: reservation.repeated,
    });
  } catch (error) {
    const safe = publicError(error);
    if (safe.statusCode >= 500) logger.error("Integrity Office could not reserve a promotion", { error: error.message });
    return response(safe.statusCode, {
      error: safe.statusCode >= 500
        ? "Promotion service unavailable"
        : "That promotion code cannot be applied to this order.",
    });
  }
};

export const _internals = { parsePromotionRequest };
