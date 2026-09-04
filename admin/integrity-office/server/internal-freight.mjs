import { getPool } from "./db.mjs";
import { verifyInternalSignature } from "./internal-ingest.mjs";
import { PostgresOfficeRepository } from "./repository.mjs";
import { boundedText } from "./validation.mjs";

const responseHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

const response = (statusCode, body) => ({ statusCode, headers: responseHeaders, body: JSON.stringify(body) });

const parseFreightRequest = (raw) => {
  const body = JSON.parse(raw);
  const vin = boundedText(body.vin, "vin", 17, { required: false })?.toUpperCase() || null;
  const email = boundedText(body.email, "email", 320).toLowerCase();
  const phone = boundedText(body.phone, "phone", 40);
  const region = boundedText(body.destinationRegion, "destinationRegion", 2).toUpperCase();
  const postalCode = boundedText(body.destinationPostalCode, "destinationPostalCode", 10);
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new TypeError("Invalid VIN");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new TypeError("Invalid email");
  if (phone.replace(/\D/g, "").length < 10) throw new TypeError("Invalid phone");
  if (!/^[A-Z]{2}$/.test(region) || !/^\d{5}(?:-\d{4})?$/.test(postalCode)) throw new TypeError("Invalid destination");
  return Object.freeze({
    publicReference: boundedText(body.publicReference, "publicReference", 128),
    vin,
    name: boundedText(body.name, "name", 120),
    email,
    phone,
    destinationPostalCode: postalCode,
    destinationRegion: region,
    locationType: boundedText(body.locationType, "locationType", 80),
    requestedSelectionId: boundedText(body.requestedSelectionId, "requestedSelectionId", 128, { required: false }),
    requestedPackage: boundedText(body.requestedPackage, "requestedPackage", 160, { required: false }),
    failureCode: boundedText(body.failureCode, "failureCode", 80),
    failureRequestId: boundedText(body.failureRequestId, "failureRequestId", 128, { required: false }),
  });
};

export const createInternalFreightHandler = ({ env = process.env, repositoryFactory, logger = console } = {}) => async (event) => {
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
    request = parseFreightRequest(raw);
  } catch (error) {
    logger.warn("Integrity Office rejected an invalid freight request", { error: error.message });
    return response(400, { error: "Freight request was not accepted" });
  }

  try {
    const repository = repositoryFactory ? repositoryFactory() : new PostgresOfficeRepository(getPool(env));
    const stored = await repository.ingestFreightRequest(request);
    return response(stored.repeated ? 200 : 201, {
      accepted: true,
      reference: stored.reference,
      duplicate: stored.repeated,
    });
  } catch (error) {
    logger.error("Integrity Office could not store a freight request", { error: error.message });
    return response(503, { error: "Freight request storage unavailable" });
  }
};

export const _internals = { parseFreightRequest };
