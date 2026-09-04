import crypto from "node:crypto";
import { badRequest, forbidden, publicError } from "./errors.mjs";

const jsonHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
});

export const requestId = (event) => {
  const supplied = event?.headers?.["x-nf-request-id"] || event?.headers?.["X-Nf-Request-Id"];
  return /^[A-Za-z0-9_-]{8,128}$/.test(String(supplied || "")) ? supplied : crypto.randomUUID();
};

export const response = (statusCode, body, id, extraHeaders = {}) => ({
  statusCode,
  headers: { ...jsonHeaders, "X-Request-Id": id, ...extraHeaders },
  body: JSON.stringify(body),
});

export const errorResponse = (error, id, logger = console) => {
  const safe = publicError(error);
  if (safe.statusCode >= 500) logger.error("Integrity Office request failed", { requestId: id, error: error?.message });
  return response(safe.statusCode, {
    error: { code: safe.code, message: safe.message, ...(safe.details ? { details: safe.details } : {}) },
    requestId: id,
  }, id);
};

export const assertOfficeOrigin = (event, env = process.env) => {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  if (!origin) return;
  const allowed = String(env.OFFICE_ORIGIN || "https://office.integritydrivetrain.com").replace(/\/$/, "");
  if (origin !== allowed && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin)) {
    throw forbidden("This request origin is not allowed.");
  }
};

export const parseJson = (event, { maximumBytes = 64_000 } = {}) => {
  const raw = Buffer.from(event?.body || "", event?.isBase64Encoded ? "base64" : "utf8");
  if (raw.length > maximumBytes) throw badRequest("The request is too large.");
  const contentType = String(event?.headers?.["content-type"] || event?.headers?.["Content-Type"] || "");
  if (!/^application\/json(?:;|$)/i.test(contentType)) throw badRequest("Content-Type must be application/json.");
  try {
    const parsed = JSON.parse(raw.toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("object required");
    return parsed;
  } catch {
    throw badRequest("The request body must be valid JSON.");
  }
};

export const idempotencyKey = (event) => {
  const value = String(event?.headers?.["idempotency-key"] || event?.headers?.["Idempotency-Key"] || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/.test(value)) {
    throw badRequest("A valid Idempotency-Key header is required.");
  }
  return value;
};

export const routePath = (event) => {
  const raw = String(event?.path || "/");
  return raw
    .replace(/^\/\.netlify\/functions\/office-api/, "")
    .replace(/^\/api/, "")
    .replace(/\/{2,}/g, "/") || "/";
};

export const query = (event) => Object.freeze(event?.queryStringParameters || {});

export const stableJsonHash = (value) => {
  const sort = (entry) => {
    if (Array.isArray(entry)) return entry.map(sort);
    if (entry && typeof entry === "object") return Object.fromEntries(Object.keys(entry).sort().map((key) => [key, sort(entry[key])]));
    return entry;
  };
  return crypto.createHash("sha256").update(JSON.stringify(sort(value))).digest("hex");
};

export const _internals = { jsonHeaders };
