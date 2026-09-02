import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler, _internals } = require("../../../netlify/functions/ace-lookup.js");
const { handler: publicHandler } = require("../../../netlify/functions/reman-catalog.js");
const { handler: shippingHandler } = require("../../../netlify/functions/reman-shipping.js");

const loginHtml = `
  <form id="loginForm" method="post">
    <input name="__RequestVerificationToken" type="hidden" value="login-token">
    <input name="UserName" type="text">
    <input name="Password" type="password">
  </form>
`;

const orderHtml = `
  <form id="orderPartsForm" method="post">
    <input type="hidden" name="__RequestVerificationToken" value="order-token">
    <input type="hidden" name="IsFilter" value="False">
    <input type="hidden" name="SearchedPartUID" value="">
  </form>
`;

const searchHtml = `
  <table>
    <tr><th></th><th>Tag ID</th><th>Part Number</th><th>Transmission</th><th>Family</th><th>Engine Code</th><th>Engine VIN</th><th>OEM Number</th></tr>
    <tr>
      <td><input id="selectPart" name="selectedPart" onchange="partChange('part-uid-1', 'T9956AA', false);" type="radio" value="part-uid-1"></td>
      <td>JL3P-TB</td><td>T9956AA</td><td>10R80 / Automatic 10 Speed</td><td>10R80</td><td>5</td><td>5</td><td>JL3Z-7000-F</td>
    </tr>
  </table>
`;

const partInfo = {
  Description: "10R80 remanufactured transmission",
  CoreCharge: 1500,
  StandardWarrantyLaborRate: 70,
  IsTaxExempt: false,
  ShippingTaxRate: 0,
  PickupTaxRate: 0,
  TransmissionUpgradeViewModelList: [
    {
      UpgradeLevelUID: "base-upgrade",
      UpgradeLevelName: "Base",
      IsOffered: true,
      IsNonReturnable: false,
      VendorName: "Internal",
      SuggestedPrice: 4189.38,
      MinimumSuggestedListPriceCalculationList: [{ CalculationType: "Percent", Amount: 35 }],
      MaximumSuggestedListPriceCalculationList: [],
      LineItemList: [
        { Part: { PartNumber: "XT-12-QULV", Description: "10R80 fluid" }, Quantity: 14, SalePricePerItem: 7.4 },
      ],
      DisplayPricingList: [
        {
          WarrantyTypeUID: "warranty-18",
          WarrantyMonths: 18,
          WarrantyThousandMiles: 18,
          PricingLevelName: "Distributor Partner",
          TransmissionPrice: 2986.6,
          LineItemsTotalPrice: 103.6,
          PromotionApplied: false,
        },
        {
          WarrantyTypeUID: "warranty-36",
          WarrantyMonths: 36,
          WarrantyThousandMiles: null,
          PricingLevelName: "Distributor Partner",
          TransmissionPrice: 3302.4,
          LineItemsTotalPrice: 103.6,
          PromotionApplied: false,
        },
      ],
    },
    {
      UpgradeLevelUID: "1000-upgrade",
      UpgradeLevelName: "1000",
      Description: "Heavy-duty calibration and component package",
      IsOffered: true,
      IsNonReturnable: false,
      VendorName: "Internal",
      SuggestedPrice: 4800,
      MinimumSuggestedListPriceCalculationList: [],
      LineItemList: [
        { Part: { PartNumber: "HD-KIT", Description: "Heavy-duty component package" }, Quantity: 1, SalePricePerItem: 100 },
      ],
      DisplayPricingList: [
        {
          WarrantyTypeUID: "warranty-18-hd",
          WarrantyMonths: 18,
          WarrantyThousandMiles: 18,
          PricingLevelName: "Distributor Partner",
          TransmissionPrice: 3500,
          LineItemsTotalPrice: 100,
          PromotionApplied: false,
        },
      ],
    },
  ],
};

const stockInfo = {
  LocationName: "Springfield Warehouse",
  UpgradeQuantity: "0",
  CoreQuantity: "3",
  externalQuantity: "0",
  VendorName: "Internal",
  IsNonReturnable: false,
  ShowWarningLabel: true,
  WarningLabel: "Programming required",
  WarningDetail: "Calibration and relearn must be documented. 7-10 Day lead time for units not in stock.",
};

const stockInfo1000 = {
  LocationName: "Omaha Warehouse",
  UpgradeQuantity: "2",
  CoreQuantity: "1",
  externalQuantity: "0",
  VendorName: "Internal",
  IsNonReturnable: false,
  ShowWarningLabel: false,
};

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  status: init.status || 200,
  headers: { "Content-Type": "application/json; charset=utf-8", ...(init.headers || {}) },
});

const html = (body, init = {}) => new Response(body, {
  status: init.status || 200,
  headers: { "Content-Type": "text/html; charset=utf-8", ...(init.headers || {}) },
});

const calls = [];
const mockFetch = async (input, options = {}) => {
  const url = new URL(String(input));
  calls.push({ path: url.pathname, method: options.method || "GET", body: String(options.body || "") });

  if (url.pathname === "/ace/" && (options.method || "GET") === "GET") {
    return html(loginHtml, { headers: { "Set-Cookie": "verification=cookie-one; Path=/; HttpOnly" } });
  }

  if (url.pathname === "/ace/" && options.method === "POST") {
    assert.match(String(options.body), /UserName=test-user/);
    assert.match(String(options.body), /Password=test-password/);
    return html("<html><body>Welcome, Test User!</body></html>", {
      headers: { "Set-Cookie": "session=session-one; Path=/; HttpOnly" },
    });
  }

  if (url.pathname.endsWith("/GetVehicleInfo")) {
    return json({ year: "2018", make: "Ford", model: "F-150", liter: "5.0", cylinder: "8", driveType: "4WD" });
  }

  if (url.pathname === "/ace/OnlineOrdering/OrderParts" && (options.method || "GET") === "GET") return html(orderHtml);
  if (url.pathname === "/ace/OnlineOrdering/OrderParts" && options.method === "POST") {
    assert.match(String(options.body), /VIN=1FTFW1E50JFA00000/);
    assert.match(String(options.body), /year=2018/);
    return html(searchHtml);
  }

  if (url.pathname.endsWith("/GetPartInfo")) return json(partInfo);
  if (url.pathname.endsWith("/GetPartUpgradeQuantity")) {
    return json(url.searchParams.get("upgradeLevelName") === "1000" ? stockInfo1000 : stockInfo);
  }
  if (url.pathname.endsWith("/GetFreightRates")) {
    assert.match(String(options.body), /addressState=MO/);
    assert.match(String(options.body), /roundTrip=True/);
    return json({
      rates: [{ CarrierName: "Test Freight", ServiceDays: 2, FreightCharge: 225, AccessorialCharge: 25 }],
      localRates: [],
    });
  }
  throw new Error(`Unexpected test request: ${options.method || "GET"} ${url}`);
};

assert.equal(_internals.normalizeVin("1ftf w1e50jfa00000"), "1FTFW1E50JFA00000");
assert.equal(_internals.VIN_PATTERN.test("1FTFW1E50JFA00000"), true);
assert.equal(_internals.parseHiddenInputs(orderHtml).get("__RequestVerificationToken"), "order-token");

const parsedCandidates = _internals.parsePartCandidates(searchHtml);
assert.equal(parsedCandidates.length, 1);
assert.deepEqual(parsedCandidates[0], {
  partUid: "part-uid-1",
  tagId: "JL3P-TB",
  partNumber: "T9956AA",
  transmission: "10R80 / Automatic 10 Speed",
  family: "10R80",
  engineCode: "5",
  engineVin: "5",
  oemNumber: "JL3Z-7000-F",
});

assert.equal(_internals.applySuggestedCalculations(3090.2, [{ CalculationType: "Percent", Amount: 35 }]), 4171.77);
assert.equal(_internals.retailPrice(3090.2, 4189.38, { flatMargin: 500 }), 3590.2);

process.env.ACE_CONNECTOR_MODE = "staff";
process.env.ACE_USERNAME = "test-user";
process.env.ACE_PASSWORD = "test-password";
process.env.ACE_LOOKUP_TOKEN = "test-token-that-is-more-than-24-characters";
process.env.REMAN_MARKUP_FLAT = "500";
process.env.REMAN_QUOTE_EXPIRY_DAYS = "7";
process.env.ACE_PUBLIC_LOOKUP_ENABLED = "true";

const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch;

try {
  const unauthorized = await handler({
    httpMethod: "POST",
    headers: { origin: "https://integritydrivetrain.com", authorization: "Bearer wrong" },
    body: JSON.stringify({ vin: "1FTFW1E50JFA00000" }),
  });
  assert.equal(unauthorized.statusCode, 401);

  const response = await handler({
    httpMethod: "POST",
    headers: {
      origin: "https://integritydrivetrain.com",
      authorization: `Bearer ${process.env.ACE_LOOKUP_TOKEN}`,
    },
    body: JSON.stringify({ vin: "1FTFW1E50JFA00000" }),
  });
  assert.equal(response.statusCode, 200, response.body);

  const payload = JSON.parse(response.body);
  assert.equal(payload.vehicle.model, "F-150");
  assert.equal(payload.candidates.length, 1);
  assert.equal(payload.candidates[0].partNumber, "T9956AA");
  assert.equal(payload.candidates[0].coreCharge, 1500);
  assert.equal(payload.candidates[0].stock.location, "Springfield Warehouse");
  assert.equal(payload.candidates[0].upgrades[0].packages[0].wholesale, 3090.2);
  assert.equal(payload.candidates[0].upgrades[0].packages[0].integrityRecommendedRetail, 3590.2);
  assert.equal(payload.candidates[0].upgrades[0].packages[1].integrityRecommendedRetail, 3906);
  assert.equal(payload.candidates[0].upgrades[0].stock.upgradeName, "Base");
  assert.equal(payload.candidates[0].upgrades[1].stock.location, "Omaha Warehouse");
  assert.equal(payload.candidates[0].upgrades[1].stock.quantity, 2);
  assert.equal(payload.requiresManualApproval, true);
  assert.ok(calls.some((call) => call.path.endsWith("/GetPartInfo")));
  assert.ok(calls.some((call) => call.path.endsWith("/GetPartUpgradeQuantity")));

  const publicResponse = await publicHandler({
    httpMethod: "POST",
    headers: {
      origin: "https://integritydrivetrain.com",
      "x-nf-client-connection-ip": "203.0.113.10",
    },
    body: JSON.stringify({ vin: "1FTFW1E50JFA00000" }),
  });
  assert.equal(publicResponse.statusCode, 200, publicResponse.body);
  const publicPayload = JSON.parse(publicResponse.body);
  const serializedPublicPayload = JSON.stringify(publicPayload);
  assert.equal(publicPayload.vehicle.model, "F-150");
  assert.equal(publicPayload.candidates[0].upgrades[0].packages[0].customerPrice, 3590.2);
  assert.equal(publicPayload.candidates[0].upgrades[0].packages[0].coreDeposit, 1500);
  assert.equal(publicPayload.candidates[0].upgrades[0].availability.code, "build_to_order");
  assert.equal(publicPayload.candidates[0].upgrades[0].availability.leadTime, "7–10 days");
  assert.equal(publicPayload.candidates[0].upgrades[1].name, "1000");
  assert.equal(publicPayload.candidates[0].upgrades[1].availability.code, "in_stock");
  assert.equal(publicPayload.candidates[0].upgrades[1].availability.location, "Omaha Warehouse");
  assert.equal(publicPayload.candidates[0].upgrades[1].packages[0].customerPrice, 4100);
  assert.doesNotMatch(serializedPublicPayload, /wholesale|suggested retail|Distributor Partner|ACE authenticated/i);

  const shippingResponse = await shippingHandler({
    httpMethod: "POST",
    headers: { origin: "https://integritydrivetrain.com" },
    body: JSON.stringify({
      vin: "1FTFW1E50JFA00000",
      selectionId: publicPayload.candidates[0].upgrades[0].packages[0].selectionId,
      addressLine1: "123 Main Street",
      city: "Springfield",
      state: "MO",
      postalCode: "65807",
      roundTrip: true,
      liftgate: false,
      residentialDelivery: false,
    }),
  });
  assert.equal(shippingResponse.statusCode, 200, shippingResponse.body);
  const shippingPayload = JSON.parse(shippingResponse.body);
  assert.equal(shippingPayload.rates[0].carrier, "Test Freight");
  assert.equal(shippingPayload.rates[0].customerFreightTotal, 450);
  assert.equal(shippingPayload.rates[0].roundTrip, true);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("ACE integration test passed: staff authentication, public VIN catalog, per-upgrade stock, $500 pricing, redaction and round-trip freight.");
