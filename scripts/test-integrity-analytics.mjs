import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { handler, publicAnalyticsConfig } = require("../netlify/functions/analytics-config.js");

assert.deepEqual(publicAnalyticsConfig({}), { ga4MeasurementId: "G-7395FMBNE9", clarityProjectId: null });
assert.deepEqual(publicAnalyticsConfig({
  GA4_MEASUREMENT_ID: "g-abc1234",
  MICROSOFT_CLARITY_PROJECT_ID: "abc123xyz",
}), { ga4MeasurementId: "G-ABC1234", clarityProjectId: "abc123xyz" });
assert.deepEqual(publicAnalyticsConfig({
  GA4_MEASUREMENT_ID: "not-a-measurement-id",
  MICROSOFT_CLARITY_PROJECT_ID: "<script>",
}), { ga4MeasurementId: null, clarityProjectId: null });

const getResponse = await handler({ httpMethod: "GET" });
assert.equal(getResponse.statusCode, 200);
assert.match(getResponse.headers["Cache-Control"], /max-age=300/);
assert.deepEqual(Object.keys(JSON.parse(getResponse.body)).sort(), ["clarityProjectId", "ga4MeasurementId"]);

const postResponse = await handler({ httpMethod: "POST" });
assert.equal(postResponse.statusCode, 405);

const script = await readFile(path.join(repositoryRoot, "projects/hullinger-transmission/script.js"), "utf8");
const styles = await readFile(path.join(repositoryRoot, "projects/hullinger-transmission/styles.css"), "utf8");
for (const prohibited of ["vin", "phone", "email", "address", "customer_name", "checkout_session"]) {
  const allowlist = script.match(/const allowedKeys = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";
  assert(!new RegExp(`['\"]${prohibited}['\"]`, "i").test(allowlist), `Analytics allowlist includes ${prohibited}`);
}
assert(script.includes("integrity_analytics_consent_v1"), "Consent version key is missing");
assert(script.includes("integrity_attribution_v1"), "Session attribution key is missing");
assert(script.includes("buying_guide_link_click"), "Buying-guide navigation tracking is missing");
assert(script.includes("/api/analytics-config"), "Analytics configuration endpoint is not used");
assert(script.includes("data-privacy-choices"), "Privacy choices control is not wired");
assert(script.includes("integrity_pending_lead_v1"), "Successful lead confirmation state is missing");
assert(script.includes('allowedItemKeys = new Set(["item_id", "item_name", "item_category", "item_variant", "price", "quantity"])'), "Commerce item analytics allowlist is missing");
assert(script.includes('"transaction_id", "shipping", "tax"'), "Purchase analytics fields are missing");
assert(
  /\["\/thank-you", "\/thank-you\.html"\][\s\S]*?sessionStorage\.removeItem\(leadConfirmationKey\)[\s\S]*?pushConversionEvent\("generate_lead"/.test(script),
  "Lead confirmation must be emitted only from the one-time thank-you path",
);
const submitHandler = script.match(/form\.addEventListener\("submit"[\s\S]*?\n    \}\);/)?.[0] || "";
assert(submitHandler.includes("quote_form_submit"), "Form-submit intent event is missing");
assert(!submitHandler.includes('pushConversionEvent("generate_lead"'), "A submission attempt must not count as a confirmed lead");
assert(submitHandler.includes("Date.now()"), "Pending lead state must include a freshness timestamp");
assert(script.includes('form[action="/thank-you"]'), "Lead analytics must be limited to customer inquiry forms");
assert(!script.includes('document.querySelectorAll("form").forEach((form) => {\n    let started'), "Non-lead forms must not emit lead-funnel analytics");
const vinDecoder = await readFile(path.join(repositoryRoot, "projects/hullinger-transmission/vin-decoder.js"), "utf8");
for (const eventName of ["view_item_list", "select_item", "view_item", "add_shipping_info", "begin_checkout", "generate_lead"]) {
  assert(vinDecoder.includes(`track("${eventName}"`), `VIN commerce flow is missing ${eventName}`);
}
const orderSuccess = await readFile(path.join(repositoryRoot, "projects/hullinger-transmission/reman-order-success.js"), "utf8");
assert(orderSuccess.includes('pushConversionEvent("purchase"'), "Stripe-confirmed purchase event is missing");
assert(orderSuccess.includes("data.analyticsTransactionId"), "Purchase tracking must use the server-derived transaction identifier");
assert(
  /\.footer-privacy-button\[hidden\]\s*\{[^}]*display:\s*none;/s.test(styles),
  "Hidden privacy controls must not be restored by footer button styling",
);

console.log("Analytics privacy and configuration tests passed.");
