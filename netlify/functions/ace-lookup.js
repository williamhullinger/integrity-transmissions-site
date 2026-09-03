const crypto = require("node:crypto");

const ACE_ORIGIN = "https://tasworkflow.com";
const ACE_LOGIN_PATH = "/ace/";
const ACE_ORDER_PATH = "/ace/OnlineOrdering/OrderParts";
const ZERO_UID = "00000000-0000-0000-0000-000000000000";
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: responseHeaders,
  body: JSON.stringify(body),
});

const normalizeVin = (value) => String(value || "")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .slice(0, 17);

const numberValue = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const strictNumberValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim();
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const money = (value) => Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;

const timingSafeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const decodeHtml = (value) => String(value || "")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&#x27;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const stripTags = (value) => decodeHtml(String(value || "")
  .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " "))
  .replace(/\s+/g, " ")
  .trim();

const getAttribute = (tag, name) => {
  const match = String(tag || "").match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
};

const parseHiddenInputs = (html) => {
  const values = new Map();

  for (const match of String(html || "").matchAll(/<input\b[^>]*>/gi)) {
    const tag = match[0];
    const type = getAttribute(tag, "type").toLowerCase();
    const name = getAttribute(tag, "name");

    if (type === "hidden" && name) values.set(name, getAttribute(tag, "value"));
  }

  return values;
};

const parsePartCandidates = (html) => {
  const candidates = [];
  const seen = new Set();

  for (const rowMatch of String(html || "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1];
    const radioTag = rowHtml.match(/<input\b[^>]*\bname\s*=\s*["']selectedPart["'][^>]*>/i)?.[0];
    if (!radioTag) continue;

    const partUid = getAttribute(radioTag, "value");
    const onchange = getAttribute(radioTag, "onchange");
    const functionArgs = onchange.match(/partChange\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/i);
    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => stripTags(match[1]));
    const partNumber = functionArgs?.[2] || cells[2] || "";
    const key = `${partUid}|${partNumber}`;

    if (!partUid || seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      partUid,
      tagId: cells[1] || "",
      partNumber,
      transmission: cells[3] || "",
      family: cells[4] || "",
      engineCode: cells[5] || "",
      engineVin: cells[6] || "",
      oemNumber: cells[7] || "",
    });
  }

  return candidates;
};

const splitSetCookie = (headerValue) => {
  if (!headerValue) return [];
  return String(headerValue).split(/,(?=\s*[^;,\s]+=)/g);
};

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  absorb(response) {
    const headers = response?.headers;
    if (!headers) return;

    const setCookies = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookie(headers.get("set-cookie"));

    for (const setCookie of setCookies) {
      const pair = String(setCookie).split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      this.cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

const formBody = (entries) => {
  const params = new URLSearchParams();
  for (const [name, value] of entries) params.set(name, value == null ? "" : String(value));
  return params;
};

const createAceClient = ({ username, password, fetchImpl = fetch }) => {
  const jar = new CookieJar();

  const request = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const cookie = jar.header();
    if (cookie) headers.set("Cookie", cookie);
    if (!headers.has("Accept")) headers.set("Accept", "text/html,application/json;q=0.9,*/*;q=0.8");
    if (!headers.has("Referer")) headers.set("Referer", `${ACE_ORIGIN}${ACE_ORDER_PATH}`);

    const requestSignal = options.signal || AbortSignal.timeout(12_000);
    let response = await fetchImpl(`${ACE_ORIGIN}${path}`, {
      ...options,
      headers,
      redirect: "manual",
      signal: requestSignal,
    });
    jar.absorb(response);

    let redirectCount = 0;
    while ([301, 302, 303, 307, 308].includes(response.status) && redirectCount < 4) {
      const location = response.headers.get("location");
      if (!location) break;
      const redirectUrl = new URL(location, ACE_ORIGIN);
      if (redirectUrl.origin !== ACE_ORIGIN) {
        throw new Error("ACE returned an unexpected cross-origin redirect");
      }
      const redirectHeaders = new Headers({
        Accept: headers.get("Accept"),
        Referer: `${ACE_ORIGIN}${path}`,
      });
      const redirectCookie = jar.header();
      if (redirectCookie) redirectHeaders.set("Cookie", redirectCookie);

      response = await fetchImpl(redirectUrl, {
        method: response.status === 307 || response.status === 308 ? options.method || "GET" : "GET",
        headers: redirectHeaders,
        redirect: "manual",
        signal: requestSignal,
      });
      jar.absorb(response);
      redirectCount += 1;
    }

    return response;
  };

  const postForm = (path, entries, extraHeaders = {}, requestOptions = {}) => request(path, {
    ...requestOptions,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      ...extraHeaders,
      ...(requestOptions.headers || {}),
    },
    body: formBody(entries),
  });

  const json = async (response, label) => {
    const text = await response.text();

    if (/id=["']loginForm["']|name=["']UserName["']/i.test(text)) {
      throw new Error("ACE session authentication expired");
    }

    if (!response.ok) {
      throw new Error(`${label} returned HTTP ${response.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${label} returned invalid JSON`);
    }
  };

  return {
    async login() {
      const loginPage = await request(ACE_LOGIN_PATH, {
        method: "GET",
        headers: { Referer: ACE_ORIGIN },
      });
      const loginHtml = await loginPage.text();
      const hidden = parseHiddenInputs(loginHtml);
      const verificationToken = hidden.get("__RequestVerificationToken");

      if (!verificationToken) throw new Error("ACE login token was not available");

      const loginResponse = await postForm(ACE_LOGIN_PATH, [
        ["__RequestVerificationToken", verificationToken],
        ["SaveNewPassword", "False"],
        ["ResetPassword", "False"],
        ["IANATimeZone", "America/Chicago"],
        ["UserName", username],
        ["Password", password],
      ], { Referer: `${ACE_ORIGIN}${ACE_LOGIN_PATH}` });
      const loginResult = await loginResponse.text();

      if (/id=["']loginForm["']|Invalid username or password|LOGIN FAILED/i.test(loginResult)) {
        throw new Error("ACE rejected the configured account credentials");
      }

      return true;
    },

    async lookupVin(vin) {
      const vehicleResponse = await postForm("/ace/OnlineOrdering/GetVehicleInfo", [["vin", vin]], {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      });
      const vehicle = await json(vehicleResponse, "ACE VIN lookup");

      if (!vehicle || vehicle.status === "Not found." || vehicle.status === "Invalid VIN.") {
        return { vehicle, candidates: [], reason: vehicle?.status || "Vehicle not found" };
      }

      const orderPage = await request(ACE_ORDER_PATH, { method: "GET" });
      const orderHtml = await orderPage.text();
      const hidden = parseHiddenInputs(orderHtml);
      const verificationToken = hidden.get("__RequestVerificationToken");

      if (!verificationToken) throw new Error("ACE order lookup token was not available");

      const searchFields = new Map(hidden);
      const overrides = {
        __RequestVerificationToken: verificationToken,
        SearchType: "VIN",
        searchVINString: vin,
        VIN: vin,
        RMA: "",
        IsFilter: "True",
        OrderStockUnit: "False",
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        liter: vehicle.liter,
        cylinder: vehicle.cylinder,
        driveType: vehicle.driveType,
      };
      for (const [name, value] of Object.entries(overrides)) searchFields.set(name, value ?? "");

      const searchResponse = await postForm(ACE_ORDER_PATH, [...searchFields], {
        Referer: `${ACE_ORIGIN}${ACE_ORDER_PATH}`,
      });
      const searchHtml = await searchResponse.text();

      if (/id=["']loginForm["']|name=["']UserName["']/i.test(searchHtml)) {
        throw new Error("ACE session expired during the fitment lookup");
      }

      const candidates = parsePartCandidates(searchHtml);
      return { vehicle, candidates };
    },

    async getPartInfo(partUid) {
      const query = new URLSearchParams({
        partID: partUid,
        wholesalerUID: "",
        quotedPriceUID: ZERO_UID,
        idRequestUID: "",
        warrantyClaimUID: "",
        year: "",
        make: "",
        model: "",
        liter: "",
        cylinder: "",
        driveType: "",
      });
      const response = await request(`/ace/OnlineOrdering/GetPartInfo?${query}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      return json(response, "ACE part pricing");
    },

    async getStock(partUid, upgradeLevelName = "Base") {
      const query = new URLSearchParams({
        partID: partUid,
        upgradeLevelName,
        customerUID: "",
      });
      const response = await request(`/ace/OnlineOrdering/GetPartUpgradeQuantity?${query}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      return json(response, "ACE stock lookup");
    },

    async getBaseStock(partUid) {
      return this.getStock(partUid, "Base");
    },

    async getFreightRates({
      addressLine1,
      addressLine2 = "",
      city,
      state,
      postalCode,
      roundTrip = true,
      liftgate = false,
      insideDelivery = false,
      residentialDelivery = false,
      vendor = "",
      requestTimeoutMs = 6_500,
    }) {
      const response = await postForm("/ace/OnlineOrdering/GetFreightRates", [
        ["addressLine1", addressLine1],
        ["addressLine2", addressLine2],
        ["addressCity", city],
        ["addressState", state],
        ["addressPostalCode", postalCode],
        ["roundTrip", roundTrip ? "True" : "False"],
        ["liftgate", liftgate ? "True" : "False"],
        ["insideDel", insideDelivery ? "True" : "False"],
        ["residentialDelivery", residentialDelivery ? "True" : "False"],
        ["wholesalerUID", ""],
        ["vendor", vendor],
      ], {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }, {
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      return json(response, "ACE freight rates");
    },
  };
};

const applySuggestedCalculations = (basePrice, calculations) => {
  let price = numberValue(basePrice);

  for (const calculation of Array.isArray(calculations) ? calculations : []) {
    if (String(calculation?.CalculationType).toLowerCase() === "percent") {
      price += price * (numberValue(calculation?.Amount) / 100);
    } else {
      price += numberValue(calculation?.Amount);
    }
  }

  return money(price);
};

const retailPrice = (wholesale, _aceSuggested, pricing) => money(wholesale + pricing.flatMargin);

const warrantyLabel = (price) => {
  const months = price?.WarrantyMonths;
  const thousandMiles = price?.WarrantyThousandMiles;

  if (String(months) === "0" && String(thousandMiles) === "0") return "No warranty";
  const monthText = months == null ? "Unlimited months" : `${months} months`;
  const mileageText = thousandMiles == null ? "Unlimited miles" : `${thousandMiles}K miles`;
  return `${monthText}, ${mileageText}`;
};

const normalizeStock = (stock, upgradeName = "Base") => stock && typeof stock === "object" ? {
  upgradeName,
  location: stock.LocationName || null,
  quantity: Number.parseInt(stock.UpgradeQuantity, 10) || 0,
  coreQuantity: Number.parseInt(stock.CoreQuantity, 10) || 0,
  externalQuantity: Number.parseInt(stock.externalQuantity, 10) || 0,
  vendor: stock.VendorName || null,
  nonReturnable: Boolean(stock.IsNonReturnable),
  warning: stock.ShowWarningLabel ? {
    label: stock.WarningLabel || "",
    detail: stripTags(stock.WarningDetail || ""),
  } : null,
  error: stock.ErrorLabel ? {
    label: stock.ErrorLabel || "",
    detail: stripTags(stock.ErrorDetail || ""),
  } : null,
} : null;

const normalizePartInfo = (candidate, raw, stockResults, pricing) => {
  const normalizedStocks = (Array.isArray(stockResults) ? stockResults : [{ name: "Base", stock: stockResults }])
    .map((entry) => normalizeStock(entry?.stock, entry?.name || "Base"))
    .filter(Boolean);
  const upgrades = [];

  for (const upgrade of Array.isArray(raw?.TransmissionUpgradeViewModelList) ? raw.TransmissionUpgradeViewModelList : []) {
    if (upgrade?.IsOffered === false) continue;

    const priceRows = Array.isArray(upgrade?.DisplayPricingList) && upgrade.DisplayPricingList.length
      ? upgrade.DisplayPricingList
      : Array.isArray(upgrade?.PricingList) ? upgrade.PricingList : [];

    const packages = priceRows.map((price) => {
      const transmissionSource = price?.PromotionApplied
        ? price?.TransmissionPriceAfterDiscount
        : price?.TransmissionPrice;
      const lineItemsSource = price?.PromotionApplied
        ? price?.LineItemsTotalPriceAfterDiscount
        : price?.LineItemsTotalPrice;
      const transmissionPrice = strictNumberValue(transmissionSource);
      const lineItemsPrice = lineItemsSource == null || lineItemsSource === ""
        ? 0
        : strictNumberValue(lineItemsSource);

      if (transmissionPrice == null || transmissionPrice <= 0 || lineItemsPrice == null || lineItemsPrice < 0) {
        return null;
      }

      const wholesale = money(transmissionPrice + lineItemsPrice);
      if (wholesale <= 0) return null;
      const calculatedSuggested = applySuggestedCalculations(
        wholesale,
        upgrade?.MinimumSuggestedListPriceCalculationList,
      );
      const directSuggested = numberValue(upgrade?.SuggestedPrice);
      const aceSuggested = money(Math.max(calculatedSuggested, directSuggested));

      return {
        warrantyTypeUid: price?.WarrantyTypeUID || null,
        warranty: warrantyLabel(price),
        pricingLevel: price?.PricingLevelName || "",
        wholesale,
        aceSuggestedRetail: aceSuggested || null,
        integrityRecommendedRetail: money(retailPrice(wholesale, aceSuggested, pricing)),
        promotionApplied: Boolean(price?.PromotionApplied),
      };
    }).filter(Boolean);

    const upgradeName = upgrade?.UpgradeLevelName || upgrade?.Name || (upgrades.length === 0 ? "Base" : `Upgrade ${upgrades.length + 1}`);
    const upgradeStock = normalizedStocks.find((item) => item.upgradeName.toLowerCase() === upgradeName.toLowerCase()) || null;

    upgrades.push({
      upgradeLevelUid: upgrade?.UpgradeLevelUID || null,
      name: upgradeName,
      description: stripTags(upgrade?.Description || upgrade?.UpgradeDescription || upgrade?.Notes || ""),
      vendor: upgrade?.VendorName || null,
      nonReturnable: Boolean(upgrade?.IsNonReturnable),
      stock: upgradeStock,
      lineItems: (Array.isArray(upgrade?.LineItemList) ? upgrade.LineItemList : []).map((item) => ({
        partNumber: item?.Part?.PartNumber || "",
        description: item?.Part?.Description || "",
        quantity: numberValue(item?.Quantity),
        wholesaleEach: money(item?.SalePricePerItem),
      })),
      packages,
    });
  }

  const coreChargeValue = strictNumberValue(raw?.CoreCharge);

  return {
    ...candidate,
    description: raw?.Description || candidate.transmission,
    discontinued: Boolean(raw?.IsDiscontinued || raw?.IsPartDiscontinued || raw?.Discontinued),
    warning: raw?.ShowWarningLabel ? {
      label: raw?.WarningLabel || "",
      detail: stripTags(raw?.WarningDetail || ""),
    } : null,
    error: raw?.ErrorLabel ? {
      label: raw?.ErrorLabel || "",
      detail: stripTags(raw?.ErrorDetail || ""),
    } : null,
    coreCharge: coreChargeValue != null && coreChargeValue >= 0 ? money(coreChargeValue) : null,
    pricingError: coreChargeValue == null || coreChargeValue < 0
      ? "Core deposit could not be confirmed"
      : undefined,
    standardWarrantyLaborRate: money(raw?.StandardWarrantyLaborRate),
    tax: {
      exempt: Boolean(raw?.IsTaxExempt),
      shippingRate: numberValue(raw?.ShippingTaxRate),
      pickupRate: numberValue(raw?.PickupTaxRate),
    },
    stock: normalizedStocks.find((item) => item.upgradeName.toLowerCase() === "base") || normalizedStocks[0] || null,
    stocks: normalizedStocks,
    upgrades,
  };
};

const configuredNumber = (name, fallback, min, max, { integer = false } = {}) => {
  const configured = process.env[name];
  if (configured == null || configured === "") return fallback;
  const parsed = strictNumberValue(configured);
  if (parsed == null || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new Error(`${name} is not configured with a valid ${integer ? "whole number" : "number"}`);
  }
  return parsed;
};

const configuredPricing = () => {
  const flatMargin = configuredNumber("REMAN_MARKUP_FLAT", 500, 500, 500);
  const quoteExpirationDays = configuredNumber("REMAN_QUOTE_EXPIRY_DAYS", 7, 1, 30, { integer: true });
  return { flatMargin, quoteExpirationDays };
};

const loadCandidateDetails = async (client, candidate, pricing) => {
  const partInfo = await client.getPartInfo(candidate.partUid);
  const upgradeNames = (Array.isArray(partInfo?.TransmissionUpgradeViewModelList)
    ? partInfo.TransmissionUpgradeViewModelList
    : [])
    .filter((upgrade) => upgrade?.IsOffered !== false)
    .map((upgrade) => upgrade?.UpgradeLevelName || upgrade?.Name || "Base");
  const uniqueNames = [...new Set(upgradeNames.length ? upgradeNames : ["Base"])];
  const stockResults = await Promise.all(uniqueNames.map(async (name) => ({
    name,
    stock: await client.getStock(candidate.partUid, name).catch(() => null),
  })));

  return normalizePartInfo(candidate, partInfo, stockResults, pricing);
};

const allowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === "https://integritydrivetrain.com") return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin);
};

const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: responseHeaders, body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "POST required" });

  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!allowedOrigin(origin)) return jsonResponse(403, { error: "Origin not allowed" });

  const authorization = event.headers?.authorization || event.headers?.Authorization || "";
  const suppliedToken = authorization.replace(/^Bearer\s+/i, "").trim();
  const adminToken = process.env.ACE_LOOKUP_TOKEN || "";

  if (!adminToken || adminToken.length < 24 || !timingSafeEqual(suppliedToken, adminToken)) {
    return jsonResponse(401, { error: "Staff authorization required" });
  }

  if ((process.env.ACE_CONNECTOR_MODE || "disabled").toLowerCase() !== "staff") {
    return jsonResponse(503, { error: "ACE staff connector is disabled" });
  }

  const username = process.env.ACE_USERNAME || "";
  const password = process.env.ACE_PASSWORD || "";
  if (!username || !password) return jsonResponse(503, { error: "ACE account credentials are not configured" });

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

  try {
    const pricing = configuredPricing();
    const client = createAceClient({ username, password });
    await client.login();
    const lookup = await client.lookupVin(vin);

    const candidates = [];
    for (const candidate of lookup.candidates.slice(0, 8)) {
      try {
        candidates.push(await loadCandidateDetails(client, candidate, pricing));
      } catch (error) {
        candidates.push({ ...candidate, pricingError: error.message });
      }
    }

    return jsonResponse(200, {
      source: "ACE authenticated staff portal",
      checkedAt: new Date().toISOString(),
      vehicle: {
        year: lookup.vehicle?.year || "",
        make: lookup.vehicle?.make || "",
        model: lookup.vehicle?.model || "",
        liter: lookup.vehicle?.liter || "",
        cylinder: lookup.vehicle?.cylinder || "",
        driveType: lookup.vehicle?.driveType || "",
      },
      candidates,
      quoteDefaults: pricing,
      requiresManualApproval: true,
      notice: "Exact tag, production split, fitment, freight, tax, core eligibility, warranty, programming and availability must be verified before customer payment or supplier ordering.",
    });
  } catch (error) {
    console.error("ACE staff lookup failed:", error.message);
    return jsonResponse(502, {
      error: "ACE lookup could not be completed",
      detail: error.message,
    });
  }
};

exports.handler = handler;
exports._internals = {
  VIN_PATTERN,
  normalizeVin,
  strictNumberValue,
  parseHiddenInputs,
  parsePartCandidates,
  applySuggestedCalculations,
  retailPrice,
  normalizeStock,
  normalizePartInfo,
  configuredPricing,
  loadCandidateDetails,
  createAceClient,
};
