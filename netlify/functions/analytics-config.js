const GA4_PATTERN = /^G-[A-Z0-9]{4,20}$/;
const CLARITY_PATTERN = /^[a-z0-9]{6,20}$/i;
// Google Measurement IDs are public identifiers. Keep the production stream
// available by default while allowing an environment override for staging.
const DEFAULT_GA4_MEASUREMENT_ID = "G-7395FMBNE9";

const publicAnalyticsConfig = (environment = process.env) => {
  const ga4MeasurementId = String(environment.GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID).trim().toUpperCase();
  const clarityProjectId = String(environment.MICROSOFT_CLARITY_PROJECT_ID || "").trim();

  return {
    ga4MeasurementId: GA4_PATTERN.test(ga4MeasurementId) ? ga4MeasurementId : null,
    clarityProjectId: CLARITY_PATTERN.test(clarityProjectId) ? clarityProjectId : null,
  };
};

const handler = async (event = {}) => {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "GET" },
      body: JSON.stringify({ error: "Method not allowed." }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
    body: JSON.stringify(publicAnalyticsConfig()),
  };
};

module.exports = { handler, publicAnalyticsConfig };
