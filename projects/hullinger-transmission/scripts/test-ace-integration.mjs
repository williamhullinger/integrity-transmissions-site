import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler, _internals } = require("../../../netlify/functions/ace-lookup.js");

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
  WarningDetail: "Calibration and relearn must be documented.",
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
  if (url.pathname.endsWith("/GetPartUpgradeQuantity")) return json(stockInfo);
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
assert.equal(_internals.retailPrice(3090.2, 4189.38, { markupPercent: 35, minimumMargin: 1000, roundTo: 25 }), 4200);

process.env.ACE_CONNECTOR_MODE = "staff";
process.env.ACE_USERNAME = "test-user";
process.env.ACE_PASSWORD = "test-password";
process.env.ACE_LOOKUP_TOKEN = "test-token-that-is-more-than-24-characters";
process.env.REMAN_MARKUP_PERCENT = "35";
process.env.REMAN_MIN_MARGIN = "1000";
process.env.REMAN_PRICE_ROUND_TO = "25";
process.env.REMAN_QUOTE_EXPIRY_DAYS = "7";

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
  assert.equal(payload.candidates[0].upgrades[0].packages[0].integrityRecommendedRetail, 4200);
  assert.equal(payload.candidates[0].upgrades[0].packages[1].integrityRecommendedRetail, 4600);
  assert.equal(payload.requiresManualApproval, true);
  assert.ok(calls.some((call) => call.path.endsWith("/GetPartInfo")));
  assert.ok(calls.some((call) => call.path.endsWith("/GetPartUpgradeQuantity")));
} finally {
  globalThis.fetch = originalFetch;
}

console.log("ACE integration test passed: authentication guard, VIN lookup, fitment parsing, pricing normalization and markup floor.");
