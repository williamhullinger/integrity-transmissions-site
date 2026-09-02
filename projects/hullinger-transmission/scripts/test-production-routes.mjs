import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const sitemap = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
const canonicalUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const redirectRules = fs.readFileSync(path.join(siteRoot, "_redirects"), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.split(/\s+/))
  .map(([from, to, status]) => [from, to, Number.parseInt(status, 10)]);
const redirectMap = new Map(redirectRules.map((rule) => [rule[0], rule]));

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

const routeFile = (pathname) => {
  if (pathname === "/") return path.join(siteRoot, "index.html");
  if (path.extname(pathname)) return path.join(siteRoot, pathname.slice(1));
  return path.join(siteRoot, `${pathname.slice(1)}.html`);
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  const redirect = redirectMap.get(requestUrl.pathname);

  if (redirect) {
    response.writeHead(redirect[2], { Location: redirect[1] });
    response.end();
    return;
  }

  const filePath = routeFile(requestUrl.pathname);

  if (!filePath.startsWith(siteRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(fs.readFileSync(path.join(siteRoot, "404.html")));
    return;
  }

  response.writeHead(200, { "Content-Type": mimeTypes.get(path.extname(filePath)) || "text/html; charset=utf-8" });
  response.end(fs.readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const failures = [];

for (const canonical of canonicalUrls) {
  const productionUrl = new URL(canonical);
  const response = await fetch(`${origin}${productionUrl.pathname}`, { redirect: "manual" });
  const body = await response.text();
  const servedCanonical = body.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];

  if (response.status !== 200) failures.push(`${productionUrl.pathname}: expected 200, received ${response.status}`);
  if (servedCanonical !== canonical) failures.push(`${productionUrl.pathname}: canonical mismatch (${servedCanonical || "missing"})`);
  if (!/<h1\b/i.test(body)) failures.push(`${productionUrl.pathname}: missing H1 in served response`);
  if (!/class="site-header"/i.test(body) || !/class="site-footer"/i.test(body)) {
    failures.push(`${productionUrl.pathname}: missing static header or footer`);
  }
}

for (const [from, to, status] of redirectRules) {
  const response = await fetch(`${origin}${from}`, { redirect: "manual" });
  if (response.status !== status) failures.push(`${from}: expected ${status}, received ${response.status}`);
  if (response.headers.get("location") !== to) failures.push(`${from}: expected location ${to}, received ${response.headers.get("location")}`);
}

const missingResponse = await fetch(`${origin}/definitely-not-a-real-integrity-page`, { redirect: "manual" });
if (missingResponse.status !== 404) failures.push(`missing route: expected 404, received ${missingResponse.status}`);

await new Promise((resolve) => server.close(resolve));

if (failures.length) {
  console.error(`Production route test failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Production route test passed: ${canonicalUrls.length} canonical pages, ${redirectRules.length} redirects, and custom 404.`);
