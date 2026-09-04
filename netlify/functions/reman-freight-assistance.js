const crypto = require("node:crypto");
const { _internals: catalog } = require("./reman-catalog.js");

const responseHeaders = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
});

const response = (statusCode, body) => ({ statusCode, headers: responseHeaders, body: JSON.stringify(body) });
const clean = (value, maximum) => String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maximum);

const allowedOrigin = (origin) => {
  if (!origin) return true;
  const origins = ["https://integritydrivetrain.com", process.env.URL, process.env.DEPLOY_PRIME_URL]
    .filter(Boolean)
    .map((value) => String(value).replace(/\/$/, ""));
  return origins.includes(origin) || /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const normalizeRequest = (payload = {}) => {
  const request = {
    publicReference: clean(payload.publicReference, 128),
    vin: clean(payload.vin, 17).toUpperCase(),
    name: clean(payload.name, 120),
    email: clean(payload.email, 320).toLowerCase(),
    phone: clean(payload.phone, 40),
    destinationPostalCode: clean(payload.postalCode, 10),
    destinationRegion: clean(payload.region, 2).toUpperCase(),
    locationType: clean(payload.locationType, 80),
    requestedSelectionId: clean(payload.requestedSelectionId, 128) || null,
    requestedPackage: clean(payload.requestedPackage, 160) || null,
    failureCode: clean(payload.failureCode, 80),
    failureRequestId: clean(payload.failureRequestId, 128) || null,
  };
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(request.publicReference)) throw new TypeError("Invalid request reference");
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(request.vin)) throw new TypeError("Invalid VIN");
  if (!request.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) throw new TypeError("Invalid contact details");
  if (request.phone.replace(/\D/g, "").length < 10) throw new TypeError("Invalid phone");
  if (!/^[A-Z]{2}$/.test(request.destinationRegion) || !/^\d{5}(?:-\d{4})?$/.test(request.destinationPostalCode)) {
    throw new TypeError("Invalid destination");
  }
  if (!request.locationType || !request.failureCode) throw new TypeError("Missing request context");
  return Object.freeze(request);
};

const officeConfig = () => {
  const endpoint = String(process.env.OFFICE_FREIGHT_INGEST_URL || "").trim();
  const secret = String(process.env.OFFICE_INTERNAL_INGEST_SECRET || "");
  if (!endpoint && !secret) return null;
  if (!endpoint || secret.length < 32) throw new Error("Office freight ingestion is misconfigured");
  const url = new URL(endpoint);
  const allowedOfficeHosts = new Set(["office.integritydrivetrain.com", "office-staging.integritydrivetrain.com"]);
  if (url.protocol !== "https:" || !allowedOfficeHosts.has(url.hostname) || url.pathname !== "/.netlify/functions/internal-freight") {
    throw new Error("Office freight ingestion URL is not approved");
  }
  return { url, secret };
};

const forwardToOffice = async (request, { fetchImpl = fetch } = {}) => {
  const config = officeConfig();
  if (!config) return { configured: false, queued: false };
  const body = JSON.stringify(request);
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const signature = `sha256=${crypto.createHmac("sha256", config.secret).update(`${timestamp}.${body}`).digest("hex")}`;
  const upstream = await fetchImpl(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Office-Timestamp": timestamp,
      "X-Office-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(8_000),
    redirect: "error",
  });
  if (!upstream.ok) throw new Error(`Office freight ingestion returned HTTP ${upstream.status}`);
  return { configured: true, queued: true };
};

const createHandler = ({ fetchImpl = fetch } = {}) => async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: responseHeaders, body: "" };
  if (event.httpMethod !== "POST") return response(405, { error: "POST required" });
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return response(403, { error: "Origin not allowed" });
  if (!catalog.bodyWithinLimit(event.body, 24_000)) return response(413, { error: "Request is too large" });
  if (!catalog.withinRateLimit(`freight-assistance:${catalog.sourceIp(event)}`)) {
    return response(429, { error: "Too many callback requests. Please call or text (417) 815-3315." });
  }

  let request;
  try {
    request = normalizeRequest(JSON.parse(event.body || "{}"));
  } catch {
    return response(400, { error: "Enter the required callback and delivery information." });
  }

  try {
    const result = await forwardToOffice(request, { fetchImpl });
    return response(result.queued ? 201 : 202, { accepted: true, queued: result.queued, reference: request.publicReference });
  } catch (error) {
    console.error("Freight recovery could not reach Integrity Office", { error: error.message });
    return response(503, { error: "The Office queue is temporarily unavailable.", queued: false });
  }
};

exports.handler = createHandler();
exports._internals = { allowedOrigin, createHandler, forwardToOffice, normalizeRequest, officeConfig };
