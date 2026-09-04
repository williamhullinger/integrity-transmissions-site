import crypto from "node:crypto";
import { normalizePromotionCode } from "../domain/order-state.mjs";
import { getPool } from "./db.mjs";
import { PostgresOfficeRepository } from "./repository.mjs";
import { boundedText, optionalPositiveInteger, positiveInteger, uuid } from "./validation.mjs";

const headers = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});
const result = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const secureEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const verifyInternalSignature = ({ raw, timestamp, signature, secret, now = Date.now() }) => {
  if (secret.length < 32) return false;
  const instant = Number(timestamp);
  if (!Number.isSafeInteger(instant) || Math.abs(Math.floor(now / 1_000) - instant) > 300) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  return secureEqual(expected, signature);
};

const parseSnapshot = (raw) => {
  const body = JSON.parse(raw);
  const sessionId = boundedText(body.stripeSessionId, "stripeSessionId", 255);
  const customerId = boundedText(body.stripeCustomerId, "stripeCustomerId", 255);
  if (!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new TypeError("Invalid Stripe Checkout Session");
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) throw new TypeError("Invalid Stripe customer");
  const paymentIntentId = body.stripePaymentIntentId ? boundedText(body.stripePaymentIntentId, "stripePaymentIntentId", 255) : null;
  if (paymentIntentId && !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) throw new TypeError("Invalid Stripe PaymentIntent");
  const vin = boundedText(body.vin, "vin", 17).toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new TypeError("Invalid VIN");
  const currency = boundedText(body.currency || "usd", "currency", 3).toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) throw new TypeError("Invalid currency");
  if (currency !== "usd") throw new TypeError("Integrity Office accepts USD order snapshots only");
  const supplierUnitCostCents = positiveInteger(body.supplierUnitCostCents, "supplierUnitCostCents", { minimum: 1 });
  const customerUnitPriceCents = positiveInteger(body.customerUnitPriceCents, "customerUnitPriceCents", { minimum: 1 });
  const listUnitPriceCents = positiveInteger(body.listUnitPriceCents ?? customerUnitPriceCents, "listUnitPriceCents", { minimum: 1 });
  const promotionDiscountCents = positiveInteger(body.promotionDiscountCents ?? 0, "promotionDiscountCents");
  let promotionCode = null;
  if (body.promotionCode) promotionCode = normalizePromotionCode(body.promotionCode);
  const promotionReservationId = body.promotionReservationId ? uuid(body.promotionReservationId, "promotionReservationId") : null;
  const freightChargedCents = positiveInteger(body.freightChargedCents, "freightChargedCents", { minimum: 1 });
  const supplierFreightCostCents = positiveInteger(body.supplierFreightCostCents, "supplierFreightCostCents", { minimum: 1 });
  if (listUnitPriceCents !== customerUnitPriceCents + promotionDiscountCents) throw new TypeError("Invalid promotion price math");
  if ((promotionDiscountCents > 0) !== Boolean(promotionCode && promotionReservationId)) throw new TypeError("Incomplete promotion snapshot");
  if (listUnitPriceCents - supplierUnitCostCents !== 50_000 || freightChargedCents !== supplierFreightCostCents) {
    throw new TypeError("Invalid storefront margin snapshot");
  }
  const termsVersion = boundedText(body.termsVersion, "termsVersion", 40);
  const termsSha256 = boundedText(body.termsSha256, "termsSha256", 64);
  const acceptance = body.policyAcceptance;
  if (!acceptance || typeof acceptance !== "object" || Array.isArray(acceptance)) {
    throw new TypeError("Missing policy acceptance evidence");
  }
  const policyAcceptedAt = new Date(boundedText(acceptance.acceptedAt, "policyAcceptance.acceptedAt", 40));
  if (Number.isNaN(policyAcceptedAt.getTime())) throw new TypeError("Invalid policy acceptance time");
  const policyAcceptance = {
    version: boundedText(acceptance.version, "policyAcceptance.version", 40),
    sha256: boundedText(acceptance.sha256, "policyAcceptance.sha256", 64),
    url: boundedText(acceptance.url, "policyAcceptance.url", 255),
    acceptedAt: policyAcceptedAt.toISOString(),
    acceptanceMethod: boundedText(acceptance.acceptanceMethod, "policyAcceptance.acceptanceMethod", 40),
    purchaseTermsAccepted: acceptance.purchaseTermsAccepted === true,
    coreWarrantyAcknowledged: acceptance.coreWarrantyAcknowledged === true,
    electronicRecordsConsented: acceptance.electronicRecordsConsented === true,
  };
  if (policyAcceptance.version !== termsVersion
      || policyAcceptance.sha256 !== termsSha256
      || policyAcceptance.acceptanceMethod !== "clickwrap"
      || !policyAcceptance.purchaseTermsAccepted
      || !policyAcceptance.coreWarrantyAcknowledged
      || !policyAcceptance.electronicRecordsConsented
      || !/^https:\/\/integritydrivetrain[.]com\/legal\/reman-policy-bundle-\d{4}-\d{2}-\d{2}$/.test(policyAcceptance.url)) {
    throw new TypeError("Invalid policy acceptance evidence");
  }
  return {
    requestId: boundedText(body.requestId, "requestId", 128),
    stripeSessionId: sessionId,
    stripeSessionCreatedAt: new Date(positiveInteger(body.stripeSessionCreatedAt, "stripeSessionCreatedAt", { minimum: 1 }) * 1_000).toISOString(),
    stripeCustomerId: customerId,
    stripePaymentIntentId: paymentIntentId,
    checkoutAttemptKey: boundedText(body.checkoutAttemptKey, "checkoutAttemptKey", 128),
    expiresAt: new Date(positiveInteger(body.expiresAt, "expiresAt", { minimum: 1 }) * 1_000).toISOString(),
    vin,
    customer: {
      name: boundedText(body.customer?.name, "customer.name", 120),
      email: boundedText(body.customer?.email, "customer.email", 320).toLowerCase(),
      phone: boundedText(body.customer?.phone, "customer.phone", 40),
    },
    vehicle: {
      year: optionalPositiveInteger(body.vehicle?.year, "vehicle.year", { minimum: 1886, maximum: 2200 }),
      make: boundedText(body.vehicle?.make, "vehicle.make", 120, { required: false }),
      model: boundedText(body.vehicle?.model, "vehicle.model", 160, { required: false }),
      engine: boundedText(body.vehicle?.engine, "vehicle.engine", 100, { required: false }),
      driveType: boundedText(body.vehicle?.driveType, "vehicle.driveType", 40, { required: false }),
      mileage: optionalPositiveInteger(body.vehicle?.mileage, "vehicle.mileage", { minimum: 0, maximum: 10_000_000 }),
    },
    address: {
      line1: boundedText(body.address?.line1, "address.line1", 200),
      line2: boundedText(body.address?.line2, "address.line2", 200, { required: false }),
      city: boundedText(body.address?.city, "address.city", 120),
      region: boundedText(body.address?.region, "address.region", 2).toUpperCase(),
      postalCode: boundedText(body.address?.postalCode, "address.postalCode", 10),
      locationType: boundedText(body.address?.locationType, "address.locationType", 80),
    },
    selectionId: boundedText(body.selectionId, "selectionId", 128),
    application: boundedText(body.application, "application", 200),
    packageName: boundedText(body.packageName, "packageName", 120),
    warranty: boundedText(body.warranty, "warranty", 500),
    availability: {
      code: boundedText(body.availability?.code, "availability.code", 80),
      text: boundedText(body.availability?.text, "availability.text", 1_000),
    },
    supplierUnitCostCents,
    listUnitPriceCents,
    customerUnitPriceCents,
    promotionCode,
    promotionDiscountCents,
    promotionReservationId,
    coreDepositCents: positiveInteger(body.coreDepositCents, "coreDepositCents"),
    freightChargedCents,
    supplierFreightCostCents,
    currency,
    supplierSnapshot: body.supplierSnapshot && typeof body.supplierSnapshot === "object" ? body.supplierSnapshot : {},
    freightSnapshot: body.freightSnapshot && typeof body.freightSnapshot === "object" ? body.freightSnapshot : {},
    termsVersion,
    termsSha256,
    policyAcceptedAt: policyAcceptedAt.toISOString(),
    policyAcceptance,
  };
};

export const createInternalIngestHandler = ({ env = process.env, repositoryFactory, logger = console } = {}) => async (event) => {
  if (event?.httpMethod !== "POST") return result(405, { error: "POST required" });
  const rawBuffer = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  if (rawBuffer.length > 64_000) return result(413, { error: "Payload too large" });
  const raw = rawBuffer.toString("utf8");
  const timestamp = event.headers?.["x-office-timestamp"] || event.headers?.["X-Office-Timestamp"] || "";
  const signature = event.headers?.["x-office-signature"] || event.headers?.["X-Office-Signature"] || "";
  if (!verifyInternalSignature({ raw, timestamp, signature, secret: String(env.OFFICE_INTERNAL_INGEST_SECRET || "") })) {
    return result(401, { error: "Invalid signature" });
  }
  let snapshot;
  try {
    snapshot = parseSnapshot(raw);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.customer.email)) throw new TypeError("Invalid customer email");
    if (snapshot.customer.phone.replace(/\D/g, "").length < 10) throw new TypeError("Invalid customer phone");
    if (!/^[A-Z]{2}$/.test(snapshot.address.region) || !/^\d{5}(?:-\d{4})?$/.test(snapshot.address.postalCode)) throw new TypeError("Invalid delivery address");
    if (!/^[a-f0-9]{64}$/.test(snapshot.termsSha256)) throw new TypeError("Invalid terms fingerprint");
  } catch (error) {
    logger.warn("Integrity Office rejected an invalid checkout snapshot", { error: error.message });
    return result(400, { error: "Checkout snapshot was not accepted" });
  }
  try {
    const repository = repositoryFactory ? repositoryFactory() : new PostgresOfficeRepository(getPool(env));
    const order = await repository.ingestCheckout(snapshot);
    return result(order.repeated ? 200 : 201, { accepted: true, orderNumber: order.orderNumber, duplicate: order.repeated });
  } catch (error) {
    logger.error("Integrity Office could not store a storefront checkout snapshot", { error: error.message });
    return result(503, { error: "Checkout snapshot storage unavailable" });
  }
};

export const _internals = { parseSnapshot, secureEqual, verifySignature: verifyInternalSignature };
