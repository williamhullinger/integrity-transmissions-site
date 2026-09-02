const crypto = require("node:crypto");
const { _internals: ace } = require("./ace-lookup.js");
const { _internals: catalog } = require("./reman-catalog.js");

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const jsonResponse = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const allowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === "https://integritydrivetrain.com") return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const sameOpaqueId = (left, right) => {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
};

const addressValue = (value, max = 100) => String(value || "").replace(/[<>]/g, "").trim().slice(0, max);

const normalizeRates = (raw, roundTrip) => {
  const rows = [
    ...(Array.isArray(raw?.rates) ? raw.rates : []),
    ...(Array.isArray(raw?.localRates) ? raw.localRates : []),
  ];
  const unique = new Map();

  for (const row of rows) {
    const carrier = catalog.scrubText(row?.CarrierName) || "Freight carrier";
    const oneWay = Math.round((Number(row?.FreightCharge) || 0) * 100) / 100;
    if (oneWay <= 0) continue;
    const transitDays = Math.max(0, Number.parseInt(row?.ServiceDays, 10) || 0);
    const accessorial = Math.round((Number(row?.AccessorialCharge) || 0) * 100) / 100;
    const total = Math.round(oneWay * (roundTrip ? 2 : 1) * 100) / 100;
    const key = `${carrier}|${transitDays}|${total}`;
    if (unique.has(key)) continue;
    unique.set(key, {
      carrier,
      transitDays: transitDays || null,
      oneWay,
      accessorial,
      roundTrip,
      customerFreightTotal: total,
    });
  }

  return [...unique.values()]
    .sort((a, b) => a.customerFreightTotal - b.customerFreightTotal || (a.transitDays || 999) - (b.transitDays || 999))
    .slice(0, 8);
};

const findSelection = async (vin, opaqueId) => {
  const client = ace.createAceClient({
    username: process.env.ACE_USERNAME || "",
    password: process.env.ACE_PASSWORD || "",
  });
  await client.login();
  const lookup = await client.lookupVin(vin);
  const pricing = ace.configuredPricing();

  for (const candidate of lookup.candidates.slice(0, 6)) {
    const detail = await ace.loadCandidateDetails(client, candidate, pricing).catch(() => null);
    if (!detail) continue;
    for (const upgrade of detail.upgrades || []) {
      for (const packageData of upgrade.packages || []) {
        const expected = catalog.selectionId(vin, detail, upgrade, packageData);
        if (sameOpaqueId(expected, opaqueId)) return { client, candidate: detail, upgrade, packageData };
      }
    }
  }

  return null;
};

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "POST required" });

  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return jsonResponse(403, { error: "Origin not allowed" });
  if (!catalog.withinRateLimit(`shipping:${catalog.sourceIp(event)}`)) {
    return jsonResponse(429, { error: "Too many freight requests. Please wait a few minutes and try again." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON request" });
  }

  const vin = ace.normalizeVin(payload.vin);
  const selectionId = String(payload.selectionId || "").trim();
  const address = {
    addressLine1: addressValue(payload.addressLine1),
    addressLine2: addressValue(payload.addressLine2),
    city: addressValue(payload.city, 60),
    state: addressValue(payload.state, 2).toUpperCase(),
    postalCode: addressValue(payload.postalCode, 5),
  };

  if (!ace.VIN_PATTERN.test(vin) || !/^[A-Za-z0-9_-]{20,64}$/.test(selectionId)) {
    return jsonResponse(400, { error: "Run the VIN lookup and select a current package first" });
  }
  if (!address.addressLine1 || !address.city || !/^[A-Z]{2}$/.test(address.state) || !/^\d{5}$/.test(address.postalCode)) {
    return jsonResponse(400, { error: "Enter a complete U.S. delivery address with a two-letter state and five-digit ZIP code" });
  }

  try {
    const selected = await findSelection(vin, selectionId);
    if (!selected) return jsonResponse(409, { error: "That option changed. Run the VIN lookup again before calculating freight." });

    const availability = catalog.availabilityFor(
      selected.upgrade.stock || selected.candidate.stock,
      selected.upgrade.nonReturnable || selected.upgrade.stock?.nonReturnable,
    );
    if (availability.code === "unavailable") {
      return jsonResponse(409, { error: "This option is no longer available. Contact Integrity for another solution." });
    }

    const roundTrip = payload.roundTrip !== false;
    const freight = await selected.client.getFreightRates({
      ...address,
      roundTrip,
      liftgate: Boolean(payload.liftgate),
      insideDelivery: Boolean(payload.insideDelivery),
      residentialDelivery: Boolean(payload.residentialDelivery),
      vendor: selected.upgrade.vendor || "",
    });
    const rates = normalizeRates(freight, roundTrip);

    if (!rates.length) {
      return jsonResponse(409, {
        error: "Automatic freight pricing is not available for this address",
        message: "Send your selected package and we will confirm the delivery price before payment.",
      });
    }

    return jsonResponse(200, {
      checkedAt: new Date().toISOString(),
      rates,
      roundTrip,
      notice: roundTrip
        ? "The displayed freight total includes outbound delivery and one core-return shipment. Build lead time, when shown, is separate from carrier transit time."
        : "The displayed freight total is outbound only. Core-return freight will be confirmed separately.",
    });
  } catch (error) {
    console.error("Public reman freight lookup failed:", error.message);
    return jsonResponse(502, {
      error: "Freight rates could not be retrieved",
      message: "Send your selected package and we will confirm the delivery price before payment.",
    });
  }
};

exports.handler = handler;
exports._internals = { normalizeRates, sameOpaqueId };
