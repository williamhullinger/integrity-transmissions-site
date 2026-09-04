import assert from "node:assert/strict";
import test from "node:test";
import { createAuthenticator, _internals } from "../server/auth.mjs";

const env = (suffix) => ({
  OFFICE_AUTH0_ISSUER: `https://integrity-${suffix}.us.auth0.com/`,
  OFFICE_AUTH0_AUDIENCE: "https://office.integritydrivetrain.com/api",
  OFFICE_AUTH0_MFA_CLAIM: "https://office.integritydrivetrain.com/mfa",
  OFFICE_REQUIRE_MFA: "true",
});

test.beforeEach(() => _internals.jwksByIssuer.clear());

test("validates issuer, audience, algorithm and MFA before returning identity", async () => {
  let options;
  const authenticate = createAuthenticator({
    env: env("valid"),
    jwksFactory: () => ({ key: true }),
    verify: async (token, _jwks, received) => {
      assert.equal(token, "header.payload.signature");
      options = received;
      return { payload: { sub: "auth0|staff-1", email: "staff@example.com", name: "Staff", amr: ["mfa"] } };
    },
  });
  const identity = await authenticate({ headers: { authorization: "Bearer header.payload.signature" } });
  assert.equal(identity.subject, "auth0|staff-1");
  assert.deepEqual(options.algorithms, ["RS256"]);
  assert.equal(options.issuer, "https://integrity-valid.us.auth0.com/");
  assert.equal(options.audience, "https://office.integritydrivetrain.com/api");
});

test("rejects missing bearer tokens and sessions without MFA", async () => {
  const authenticate = createAuthenticator({
    env: env("mfa"),
    jwksFactory: () => ({}),
    verify: async () => ({ payload: { sub: "auth0|staff-1" } }),
  });
  await assert.rejects(() => authenticate({ headers: {} }), (error) => error.statusCode === 401);
  await assert.rejects(() => authenticate({ headers: { authorization: "Bearer header.payload.signature" } }), (error) => error.statusCode === 403 && /Multi-factor/.test(error.message));
});

test("does not accept non-HTTPS Auth0 issuers", () => {
  assert.throws(() => createAuthenticator({
    env: { OFFICE_AUTH0_ISSUER: "http://tenant.example.com", OFFICE_AUTH0_AUDIENCE: "office" },
  }), (error) => error.statusCode === 503);
});
