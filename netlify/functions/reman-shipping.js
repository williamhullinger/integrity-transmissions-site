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

const FREIGHT_SELECTION_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

const freightSigningSecret = () => crypto.createHash("sha256")
  .update(`integrity-reman-freight-v1|${process.env.ACE_LOOKUP_TOKEN || process.env.ACE_PASSWORD || ""}`)
  .digest();

const freightSelectionId = ({ vin, selectionId, address, roundTrip, liftgate, insideDelivery, residentialDelivery, rate }) => {
  const material = [
    vin,
    selectionId,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    roundTrip ? "round-trip" : "outbound-only",
    liftgate ? "liftgate" : "no-liftgate",
    insideDelivery ? "inside" : "outside",
    residentialDelivery ? "residential" : "commercial",
    rate.carrier,
    rate.transitDays || "",
    rate.customerFreightTotal.toFixed(2),
  ].join("|");
  return crypto.createHmac("sha256", freightSigningSecret()).update(material).digest("base64url").slice(0, 32);
};

const normalizeFreightRequest = (payload = {}) => {
  const deliveryLocation = addressValue(payload.deliveryLocation || payload["delivery-location"], 80);
  const coreReturnFreight = addressValue(payload.coreReturnFreight || payload["core-return-freight"], 80);
  const delivery = deliveryLocation.toLowerCase();

  let roundTrip;
  if (coreReturnFreight) {
    roundTrip = !/outbound(?: delivery)? only|quote outbound|freight account/i.test(coreReturnFreight);
  } else {
    roundTrip = payload.roundTrip !== false;
  }

  return {
    address: {
      addressLine1: addressValue(payload.addressLine1 || payload["shipping-street"]),
      addressLine2: addressValue(payload.addressLine2 || payload["shipping-street-2"]),
      city: addressValue(payload.city || payload["shipping-city"], 60),
      state: addressValue(payload.state || payload["shipping-state"], 2).toUpperCase(),
      postalCode: addressValue(payload.postalCode || payload["shipping-zip"], 5),
    },
    deliveryLocation,
    coreReturnFreight,
    roundTrip,
    liftgate: delivery.includes("without dock") || delivery.includes("liftgate") || delivery.includes("residential") || Boolean(payload.liftgate),
    insideDelivery: Boolean(payload.insideDelivery),
    residentialDelivery: delivery.includes("residential") || Boolean(payload.residentialDelivery),
  };
};

const validAddress = (address) => Boolean(
  address.addressLine1
  && address.city
  && /^[A-Z]{2}$/.test(address.state)
  && /^\d{5}$/.test(address.postalCode),
);

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
    // ACE's FreightCharge is the quoted one-way total. AccessorialCharge is the
    // included liftgate/residential component, not an additional amount.
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

const loadFreightQuote = async (payload) => {
  const vin = ace.normalizeVin(payload.vin);
  const selectionId = String(payload.selectionId || "").trim();
  const freightRequest = normalizeFreightRequest(payload);

  if (!ace.VIN_PATTERN.test(vin) || !FREIGHT_SELECTION_PATTERN.test(selectionId)) {
    const error = new Error("Run the VIN lookup and select a current package first");
    error.statusCode = 400;
    throw error;
  }
  if (!validAddress(freightRequest.address)) {
    const error = new Error("Enter a complete U.S. delivery address with a two-letter state and five-digit ZIP code");
    error.statusCode = 400;
    throw error;
  }

  const selected = await findSelection(vin, selectionId);
  if (!selected) {
    const error = new Error("That option changed. Run the VIN lookup again before calculating freight.");
    error.statusCode = 409;
    throw error;
  }

  const availability = catalog.availabilityFor(
    selected.upgrade.stock || selected.candidate.stock,
    selected.upgrade.nonReturnable || selected.upgrade.stock?.nonReturnable,
  );
  if (!availability.orderable) {
    const error = new Error(availability.code === "unavailable"
      ? "This option is no longer available. Contact Integrity for another solution."
      : "This option needs personal confirmation before it can be ordered online.");
    error.statusCode = 409;
    throw error;
  }

  const freight = await selected.client.getFreightRates({
    ...freightRequest.address,
    roundTrip: freightRequest.roundTrip,
    liftgate: freightRequest.liftgate,
    insideDelivery: freightRequest.insideDelivery,
    residentialDelivery: freightRequest.residentialDelivery,
    vendor: selected.upgrade.vendor || "",
  });
  const rates = normalizeRates(freight, freightRequest.roundTrip).map((rate) => ({
    ...rate,
    rateId: freightSelectionId({ vin, selectionId, ...freightRequest, rate }),
  }));

  if (!rates.length) {
    const error = new Error("Automatic freight pricing is not available for this address");
    error.statusCode = 409;
    error.customerMessage = "Send your selected package and we will confirm the delivery price before payment.";
    throw error;
  }

  return { vin, selectionId, selected, availability, freightRequest, rates };
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

  try {
    const quote = await loadFreightQuote(payload);

    return jsonResponse(200, {
      checkedAt: new Date().toISOString(),
      rates: quote.rates,
      roundTrip: quote.freightRequest.roundTrip,
      notice: quote.freightRequest.roundTrip
        ? "The displayed freight total includes outbound delivery and one core-return shipment. Build lead time, when shown, is separate from carrier transit time."
        : "The displayed freight total is outbound only. Core-return freight will be confirmed separately.",
    });
  } catch (error) {
    console.error("Public reman freight lookup failed:", error.message);
    return jsonResponse(error.statusCode || 502, {
      error: error.statusCode ? error.message : "Freight rates could not be retrieved",
      message: error.customerMessage || "Send your selected package and we will confirm the delivery price before payment.",
    });
  }
};

exports.handler = handler;
exports._internals = {
  addressValue,
  findSelection,
  freightSelectionId,
  loadFreightQuote,
  normalizeFreightRequest,
  normalizeRates,
  sameOpaqueId,
  validAddress,
};
