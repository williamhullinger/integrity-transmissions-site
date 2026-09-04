import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../dist/integrity-office");
const [html, script, headers, redirects, robots] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "assets/office.js"), "utf8"),
  readFile(path.join(root, "_headers"), "utf8"),
  readFile(path.join(root, "_redirects"), "utf8"),
  readFile(path.join(root, "robots.txt"), "utf8"),
]);
const officeConfig = await readFile(path.resolve(root, "../../admin/integrity-office/netlify.toml"), "utf8");
const publicConfig = await readFile(path.resolve(root, "../../netlify.toml"), "utf8");

assert.match(html, /<title>Integrity Office<\/title>/);
assert.match(html, /noindex,nofollow,noarchive/);
assert.match(headers, /Content-Security-Policy:/);
assert.match(headers, /X-Frame-Options: DENY/);
assert.match(redirects, /\/api\/\*/);
assert.match(robots, /Disallow: \//);
assert.match(officeConfig, /publish = "\/dist\/integrity-office"/);
assert.match(officeConfig, /directory = "\/admin\/integrity-office\/functions"/);
assert.match(officeConfig, /schedule = "\*\/5 \* \* \* \*"/);
assert.doesNotMatch(publicConfig, /integrity-office/);
assert.doesNotMatch(`${html}\n${script}`, /(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/);
assert((await stat(path.join(root, "assets/office.js"))).size < 500_000, "Office JavaScript bundle must stay below 500 KB");

console.log("Integrity Office private build audit passed: CSP, noindex, routing, bundle size, and secret scan are clean.");
