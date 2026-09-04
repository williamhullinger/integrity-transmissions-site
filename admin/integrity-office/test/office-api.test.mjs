import assert from "node:assert/strict";
import test from "node:test";
import { createOfficeApi } from "../server/office-api.mjs";

const identity = { subject: "auth0|staff" };
const principal = (roles) => ({ id: "c59c09f8-ef0f-4a84-9346-50a10f04a77c", subject: identity.subject, email: "staff@example.com", name: "Staff", roles });

const event = (path, { method = "GET", body, headers = {}, queryStringParameters } = {}) => ({
  httpMethod: method,
  path: `/api${path}`,
  headers,
  body: body === undefined ? undefined : JSON.stringify(body),
  queryStringParameters,
});

const repositoryFor = (roles) => ({
  getStaffPrincipal: async () => principal(roles),
  dashboard: async () => ({ activeOrders: 2 }),
  listOrders: async (options) => ({ items: [], page: options.page, pageSize: options.pageSize, total: 0 }),
  getOrder: async () => ({ id: "order" }),
  listPromotions: async () => [],
  listFreightExceptions: async () => ({ items: [], page: 1, pageSize: 25, total: 0 }),
  financeReport: async ({ startAt, endAt }) => ({ startAt, endAt, accounts: [] }),
  recentAudit: async () => ({ items: [], total: 0 }),
  executeIdempotent: async ({ action }) => ({ repeated: false, ...await action({}) }),
  createPromotion: async (_client, input) => ({ id: "b3a69431-8ac2-4c67-b89a-a7dd28fdbd7f", ...input }),
});

test("serves only non-secret Auth0 browser configuration before sign-in", async () => {
  const handler = createOfficeApi({ env: { OFFICE_AUTH0_DOMAIN: "tenant.auth0.com", OFFICE_AUTH0_CLIENT_ID: "client", OFFICE_AUTH0_AUDIENCE: "office-api" } });
  const response = await handler(event("/config"));
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(body.data.auth, { domain: "tenant.auth0.com", clientId: "client", audience: "office-api" });
  assert.doesNotMatch(response.body, /secret|DATABASE_URL|STRIPE_RESTRICTED_KEY/);
});

test("enforces database-backed roles on every protected route", async () => {
  const viewer = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["viewer"]) });
  assert.equal((await viewer(event("/dashboard"))).statusCode, 200);
  assert.equal((await viewer(event("/promotions"))).statusCode, 403);
  assert.equal((await viewer(event("/freight-exceptions"))).statusCode, 403);
  assert.equal((await viewer(event("/audit"))).statusCode, 403);

  const finance = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["finance"]) });
  assert.equal((await finance(event("/promotions"))).statusCode, 200);
  assert.equal((await finance(event("/reports/finance"))).statusCode, 200);
  assert.equal((await finance(event("/freight-exceptions"))).statusCode, 403);
});

test("requires idempotency and creates unapproved margin-protected promotions", async () => {
  const handler = createOfficeApi({ authenticate: async () => identity, repository: repositoryFor(["administrator"]) });
  const payload = { code: "FALL-500", amountOffCents: 5000, startsAt: "2026-09-04T00:00:00Z", minimumMarginCents: 50000, reason: "September campaign" };
  const missingKey = await handler(event("/promotions", { method: "POST", body: payload, headers: { origin: "https://office.integritydrivetrain.com", "content-type": "application/json" } }));
  assert.equal(missingKey.statusCode, 400);
  const created = await handler(event("/promotions", { method: "POST", body: payload, headers: { origin: "https://office.integritydrivetrain.com", "content-type": "application/json", "idempotency-key": "promotion:1234567890abcdef" } }));
  assert.equal(created.statusCode, 201, created.body);
  assert.equal(JSON.parse(created.body).data.code, "FALL-500");
  assert.equal(JSON.parse(created.body).data.minimumMarginCents, 50000);
});
