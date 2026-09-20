import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { handler, publicAnalyticsConfig } = require("../netlify/functions/analytics-config.js");

assert.deepEqual(publicAnalyticsConfig({}), { ga4MeasurementId: null, clarityProjectId: null });
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
for (const prohibited of ["vin", "phone", "email", "address", "customer_name", "checkout_session"]) {
  const allowlist = script.match(/const allowedKeys = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";
  assert(!new RegExp(`['\"]${prohibited}['\"]`, "i").test(allowlist), `Analytics allowlist includes ${prohibited}`);
}
assert(script.includes("integrity_analytics_consent_v1"), "Consent version key is missing");
assert(script.includes("/api/analytics-config"), "Analytics configuration endpoint is not used");
assert(script.includes("data-privacy-choices"), "Privacy choices control is not wired");

console.log("Analytics privacy and configuration tests passed.");
