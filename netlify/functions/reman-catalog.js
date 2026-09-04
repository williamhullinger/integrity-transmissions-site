const crypto = require("node:crypto");
const { _internals } = require("./ace-lookup.js");

const {
  VIN_PATTERN,
  normalizeVin,
  configuredPricing,
  createAceClient,
  loadCandidateDetails,
} = _internals;

const LOOKUP_WINDOW_MS = 10 * 60 * 1000;
const LOOKUP_LIMIT = 12;
const CACHE_TTL_MS = 3 * 60 * 1000;
const requestCounts = new Map();
const catalogCache = new Map();
const WARRANTY_DETAILS_URL = "/legal/reman-policy-bundle-2026-09-04#warranty-installation";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const jsonResponse = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { ...headers, ...extraHeaders },
  body: JSON.stringify(body),
});

const runtimeCatalog = (value) => ({
  ...value,
  promotionsAvailable: Boolean(
    String(process.env.OFFICE_PROMOTION_RESERVE_URL || "").trim()
    && String(process.env.OFFICE_INTERNAL_INGEST_SECRET || "").length >= 32,
  ),
});

const allowedOrigin = (origin) => {
  if (!origin) return true;
  const deployedOrigins = [
    "https://integritydrivetrain.com",
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
  ].filter(Boolean).map((value) => String(value).replace(/\/$/, ""));
  if (deployedOrigins.includes(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const bodyWithinLimit = (body, maximumBytes = 24_000) => Buffer.byteLength(String(body || ""), "utf8") <= maximumBytes;

const scrubText = (value) => String(value || "")
  .replace(/\bACE(?:\s+Transmission)?\b/gi, "the remanufacturer")
  .replace(/\bTAS\s*Workflow\b/gi, "the remanufacturer")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const sourceIp = (event) => {
  const headersIn = event.headers || {};
  const value = headersIn["x-nf-client-connection-ip"]
    || headersIn["client-ip"]
    || String(headersIn["x-forwarded-for"] || "").split(",")[0]
    || "unknown";
  return crypto.createHash("sha256").update(String(value).trim()).digest("hex").slice(0, 24);
};

const withinRateLimit = (key, now = Date.now()) => {
  if (requestCounts.size > 2_000) {
    for (const [entryKey, entry] of requestCounts) {
      if (now - entry.startedAt >= LOOKUP_WINDOW_MS) requestCounts.delete(entryKey);
    }
  }
  const current = requestCounts.get(key);
  if (!current || now - current.startedAt >= LOOKUP_WINDOW_MS) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= LOOKUP_LIMIT;
};

const leadTimeFrom = (stock) => {
  const text = [stock?.warning?.label, stock?.warning?.detail, stock?.error?.label, stock?.error?.detail]
    .filter(Boolean)
    .join(" ");
  const range = text.match(/\b(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*((?:business\s+)?days?)\b/i);
  if (range) return `${range[1]}–${range[2]} ${/business/i.test(range[3]) ? "business days" : "days"}`;
  const single = text.match(/\b(\d+)\s*((?:business\s+)?days?)\b/i);
  return single ? `${single[1]} ${single[2].toLowerCase()}` : null;
};

const availabilityFor = (stock, nonReturnable) => {
  const location = scrubText(stock?.location) || "the selected warehouse";
  const quantity = Math.max(0, Number(stock?.quantity) || 0);
  const externalQuantity = Math.max(0, Number(stock?.externalQuantity) || 0);
  const shownQuantity = quantity + externalQuantity;
  const errorText = scrubText([stock?.error?.label, stock?.error?.detail].filter(Boolean).join(": "));
  const allText = scrubText([
    stock?.warning?.label,
    stock?.warning?.detail,
    stock?.error?.label,
    stock?.error?.detail,
  ].filter(Boolean).join(" "));
  const unavailable = /\b(discontinued|obsolete|unavailable|not available|not offered|cannot be supplied|no longer (?:available|supplied))\b/i.test(allText);
  const leadTime = leadTimeFrom(stock);

  if (unavailable) {
    return {
      code: "unavailable",
      orderable: false,
      title: "This option is not currently available",
      detail: errorText || "This remanufactured transmission cannot be ordered at this time. Contact Integrity for another solution.",
      location,
      quantity: shownQuantity,
      leadTime: null,
    };
  }

  if (errorText) {
    return {
      code: "manual_review",
      orderable: false,
      title: "This option needs confirmation",
      detail: "Current availability cannot be confirmed online. Send the request and Integrity will verify the option before payment.",
      location,
      quantity: shownQuantity,
      leadTime: null,
    };
  }

  if (shownQuantity > 0) {
    return {
      code: "in_stock",
      orderable: !nonReturnable,
      title: `${shownQuantity} finished ${shownQuantity === 1 ? "unit" : "units"} shown at ${location}`,
      detail: "Availability is refreshed again before payment. Freight transit time is quoted separately.",
      location,
      quantity: shownQuantity,
      leadTime: null,
    };
  }

  if (leadTime) {
    return {
      code: "build_to_order",
      orderable: !nonReturnable,
      title: `0 finished units shown at ${location}`,
      detail: `Estimated build time: ${leadTime}. Delivery transit begins after the unit ships and is shown separately.`,
      location,
      quantity: 0,
      leadTime,
    };
  }

  return {
    code: "manual_review",
    orderable: false,
    title: `0 finished units shown at ${location}`,
    detail: "Current build availability requires confirmation. Send the request and Integrity will verify timing before payment.",
    location,
    quantity: 0,
    leadTime: null,
  };
};

const publicLineItems = (items) => (Array.isArray(items) ? items : [])
  .map((item) => ({
    description: scrubText(item?.description || item?.partNumber),
    quantity: Number(item?.quantity) || 0,
  }))
  .filter((item) => item.description && !/\b(policy|process|information|installation guide|flyer)\b/i.test(item.description))
  .slice(0, 16);

const selectionId = (vin, candidate, upgrade, packageData) => {
  const material = [
    vin,
    candidate.partUid,
    upgrade.upgradeLevelUid || upgrade.name,
    packageData.warrantyTypeUid || packageData.warranty,
  ].join("|");
  const secret = crypto.createHash("sha256")
    .update(`integrity-reman-catalog-v1|${process.env.REMAN_SIGNING_SECRET || process.env.ACE_LOOKUP_TOKEN || process.env.ACE_PASSWORD || ""}`)
    .digest();
  return crypto.createHmac("sha256", secret).update(material).digest("base64url").slice(0, 32);
};

const toPublicCandidate = (vin, candidate) => {
  if (candidate.pricingError) {
    return {
      application: scrubText(candidate.family || candidate.transmission || "Transmission match"),
      status: "manual_review",
      message: "We found the transmission, but online pricing is not available for this vehicle. Send the request or call (417) 815-3315 for help.",
      upgrades: [],
    };
  }

  const candidateProblem = scrubText([
    candidate.warning?.label,
    candidate.warning?.detail,
    candidate.error?.label,
    candidate.error?.detail,
  ].filter(Boolean).join(" "));
  if (candidate.discontinued || /\b(discontinued|obsolete|unavailable|not available|no longer (?:available|supplied))\b/i.test(candidateProblem)) {
    return {
      application: scrubText(candidate.family || candidate.transmission || "Transmission match"),
      status: "unavailable",
      message: "This remanufactured transmission is not currently available. Contact Integrity for another solution.",
      upgrades: [],
    };
  }

  const candidateError = scrubText([
    candidate.error?.label,
    candidate.error?.detail,
  ].filter(Boolean).join(" "));
  if (candidateError) {
    return {
      application: scrubText(candidate.family || candidate.transmission || "Transmission match"),
      status: "manual_review",
      message: "We found a possible match, but this option needs confirmation before it can be priced or ordered online. Send the request or call (417) 815-3315.",
      upgrades: [],
    };
  }

  const upgrades = (candidate.upgrades || []).map((upgrade) => {
    const availability = availabilityFor(upgrade.stock || candidate.stock, upgrade.nonReturnable || upgrade.stock?.nonReturnable);
    const packages = (upgrade.packages || [])
      .filter((packageData) => Number.isFinite(packageData.integrityRecommendedRetail)
        && packageData.integrityRecommendedRetail > 0
        && Number.isFinite(candidate.coreCharge)
        && candidate.coreCharge >= 0)
      .map((packageData) => ({
        selectionId: selectionId(vin, candidate, upgrade, packageData),
        warranty: scrubText(packageData.warranty),
        warrantyDetailsUrl: WARRANTY_DETAILS_URL,
        customerPrice: packageData.integrityRecommendedRetail,
        coreDeposit: candidate.coreCharge,
        subtotalBeforeFreightAndTax: Math.round((packageData.integrityRecommendedRetail + candidate.coreCharge) * 100) / 100,
        orderable: availability.orderable,
      }));

    return {
      name: scrubText(upgrade.name || "Base"),
      description: scrubText(upgrade.description),
      availability,
      includedItems: publicLineItems(upgrade.lineItems),
      packages,
      requiresAssistedOrder: Boolean(upgrade.nonReturnable || upgrade.stock?.nonReturnable),
    };
  });

  return {
    application: scrubText(candidate.family || candidate.transmission || candidate.description || "Transmission match"),
    description: scrubText(candidate.description || candidate.transmission),
    tag: scrubText(candidate.tagId),
    oemNumber: scrubText(candidate.oemNumber),
    coreDeposit: candidate.coreCharge,
    upgrades,
  };
};

const buildCatalog = async (vin) => {
  const username = process.env.ACE_USERNAME || "";
  const password = process.env.ACE_PASSWORD || "";
  if (!username || !password) throw new Error("Supplier connection is not configured");

  const pricing = configuredPricing();
  const client = createAceClient({ username, password });
  await client.login();
  const lookup = await client.lookupVin(vin);
  const detailed = [];

  for (const candidate of lookup.candidates.slice(0, 6)) {
    try {
      detailed.push(await loadCandidateDetails(client, candidate, pricing));
    } catch {
      detailed.push({ ...candidate, pricingError: true });
    }
  }

  const candidates = detailed.map((candidate) => toPublicCandidate(vin, candidate));
  const orderableSelections = candidates.flatMap((candidate) => candidate.upgrades || [])
    .flatMap((upgrade) => upgrade.packages || [])
    .filter((packageData) => packageData.orderable).length;

  return {
    checkedAt: new Date().toISOString(),
    refreshAfterSeconds: CACHE_TTL_MS / 1000,
    vehicle: {
      year: scrubText(lookup.vehicle?.year),
      make: scrubText(lookup.vehicle?.make),
      model: scrubText(lookup.vehicle?.model),
      liter: scrubText(lookup.vehicle?.liter),
      cylinder: scrubText(lookup.vehicle?.cylinder),
      driveType: scrubText(lookup.vehicle?.driveType),
    },
    candidates,
    orderableSelections,
    requiresFinalConfirmation: true,
    notice: "These prices are current for the VIN and package shown. We confirm the exact transmission match, availability, delivery price, tax and core-return eligibility again before payment.",
  };
};

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "POST required" });

  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return jsonResponse(403, { error: "Origin not allowed" });
  if (!bodyWithinLimit(event.body)) return jsonResponse(413, { error: "Request is too large" });

  if (!withinRateLimit(sourceIp(event))) {
    return jsonResponse(429, {
      error: "Too many lookup attempts",
      message: "Please wait a few minutes or call Integrity at (417) 815-3315.",
    }, { "Retry-After": "600" });
  }

  if ((process.env.ACE_PUBLIC_LOOKUP_ENABLED || "true").toLowerCase() !== "true") {
    return jsonResponse(503, { error: "Online lookup is temporarily unavailable" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON request" });
  }

  const vin = normalizeVin(payload.vin);
  if (!VIN_PATTERN.test(vin)) {
    return jsonResponse(400, { error: "Enter a valid 17-character VIN without I, O, or Q" });
  }

  const cached = catalogCache.get(vin);
  if (cached && cached.expiresAt > Date.now()) return jsonResponse(200, runtimeCatalog(cached.value));
  if (cached) catalogCache.delete(vin);
  if (catalogCache.size > 500) {
    for (const [cacheVin, entry] of catalogCache) {
      if (entry.expiresAt <= Date.now()) catalogCache.delete(cacheVin);
    }
  }

  try {
    const catalog = await buildCatalog(vin);
    catalogCache.set(vin, { expiresAt: Date.now() + CACHE_TTL_MS, value: catalog });
    return jsonResponse(200, runtimeCatalog(catalog));
  } catch (error) {
    console.error("Public reman catalog lookup failed:", error.message);
    return jsonResponse(502, {
      error: "Current options could not be retrieved",
      message: "Try again shortly, or send us the VIN and we will look it up for you.",
    });
  }
};

exports.handler = handler;
exports._internals = {
  availabilityFor,
  allowedOrigin,
  bodyWithinLimit,
  selectionId,
  sourceIp,
  publicLineItems,
  runtimeCatalog,
  scrubText,
  toPublicCandidate,
  withinRateLimit,
};
