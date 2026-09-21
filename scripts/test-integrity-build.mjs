import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishRoot = path.join(repositoryRoot, "dist", "integrity");

await import("./build-integrity-site.mjs");

const publishedFiles = (await readdir(publishRoot, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => path.join(entry.parentPath || entry.path, entry.name))
  .map((absolutePath) => path.relative(publishRoot, absolutePath).replaceAll(path.sep, "/"));

const requiredFiles = [
  "index.html",
  "reman-powertrain.html",
  "reman-engines.html",
  "reman-transfer-cases.html",
  "reman-transmissions.html",
  "reman-transmissions/10r80.html",
  "reman-transmissions/4r100.html",
  "reman-transmissions/48re.html",
  "reman-transmissions/4l60e.html",
  "reman-transmissions/4l80e.html",
  "reman-transmissions/545rfe.html",
  "reman-transmissions/5r55s.html",
  "reman-transmissions/62te.html",
  "reman-transmissions/68rfe.html",
  "reman-transmissions/6r80.html",
  "reman-transmissions/6l80.html",
  "reman-transmissions/6l90.html",
  "reman-transmissions/700r4.html",
  "reman-order-success.html",
  "reman-order-terms.html",
  "legal/reman-policy-bundle-2026-09-04.html",
  "customer-policies.html",
  "shipping-returns.html",
  "integrity-limited-warranty.html",
  "service-policies.html",
  "website-terms.html",
  "privacy.html",
  "styles.css",
  "vin-decoder.js",
  "sitemap.xml",
  "robots.txt",
  "_headers",
  "_redirects",
  "images/reman-nationwide-shipping-hero.webp",
  "images/reman-engine-assembly.webp",
  "images/reman-transfer-case-assembly.webp",
  "images/upgrade-selection-guide.webp",
  "guides/delayed-engagement-drive-reverse.html",
  "guides/no-reverse-transmission.html",
  "guides/transmission-shudder-vs-engine-misfire.html",
  "guides/transmission-slipping.html",
];

for (const file of requiredFiles) {
  assert(publishedFiles.includes(file), `Production bundle is missing ${file}`);
}

const forbiddenPatterns = [
  /(?:^|\/)staff(?:\/|$)/i,
  /(?:^|\/)scripts(?:\/|$)/i,
  /(?:^|\/)partials(?:\/|$)/i,
  /(?:^|\/)Js(?:\/|$)/,
  /(?:^|\/)\.env/i,
  /\.md$/i,
  /(?:^|\/)readme/i,
];

for (const file of publishedFiles) {
  assert(!forbiddenPatterns.some((pattern) => pattern.test(file)), `Internal file was published: ${file}`);
  assert((await stat(path.join(publishRoot, file))).size > 0, `Production bundle contains an empty file: ${file}`);
}

for (const htmlFile of publishedFiles.filter((file) => file.endsWith(".html"))) {
  const html = await readFile(path.join(publishRoot, htmlFile), "utf8");
  assert(!/ACE_INTEGRATION|STRIPE_REMAN_OPERATIONS|REMAN_COMMERCE_ROADMAP/.test(html), `${htmlFile} links to internal operations material`);
}

console.log(`Production bundle test passed: ${publishedFiles.length} public files and no internal operations artifacts.`);
