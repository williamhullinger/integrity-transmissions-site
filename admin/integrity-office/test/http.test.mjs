import assert from "node:assert/strict";
import test from "node:test";
import { assertOfficeOrigin, idempotencyKey, parseJson, routePath, stableJsonHash } from "../server/http.mjs";

test("normalizes function and public API paths", () => {
  assert.equal(routePath({ path: "/.netlify/functions/office-api/orders" }), "/orders");
  assert.equal(routePath({ path: "/api/orders" }), "/orders");
});

test("parses bounded JSON and requires explicit content type", () => {
  assert.deepEqual(parseJson({ headers: { "content-type": "application/json; charset=utf-8" }, body: "{\"ok\":true}" }), { ok: true });
  assert.throws(() => parseJson({ headers: {}, body: "{}" }), /Content-Type/);
  assert.throws(() => parseJson({ headers: { "content-type": "application/json" }, body: "x" }), /valid JSON/);
  assert.throws(() => parseJson({ headers: { "content-type": "application/json" }, body: "x".repeat(100) }, { maximumBytes: 10 }), /too large/);
});

test("rejects cross-origin staff writes and weak idempotency keys", () => {
  assertOfficeOrigin({ headers: { origin: "https://office.integritydrivetrain.com" } });
  assert.throws(() => assertOfficeOrigin({ headers: { origin: "https://attacker.example" } }), (error) => error.statusCode === 403);
  assert.equal(idempotencyKey({ headers: { "idempotency-key": "order:1234567890abcdef" } }), "order:1234567890abcdef");
  assert.throws(() => idempotencyKey({ headers: { "idempotency-key": "short" } }), /Idempotency-Key/);
});

test("stable JSON hashes do not depend on object key order", () => {
  assert.equal(stableJsonHash({ b: 2, a: { d: 4, c: 3 } }), stableJsonHash({ a: { c: 3, d: 4 }, b: 2 }));
});
