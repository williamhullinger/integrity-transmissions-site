import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const siteOrigin = "https://integritydrivetrain.com";
const host = new URL(siteOrigin).host;
const key = "7cc0ffb2a4339e0f4dd94715249519ef";
const keyLocation = `${siteOrigin}/${key}.txt`;
const endpoint = "https://api.indexnow.org/indexnow";
const shouldSubmit = process.argv.includes("--submit");

const sitemap = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length) throw new Error("No URLs were found in sitemap.xml.");

for (const url of urlList) {
  if (new URL(url).origin !== siteOrigin) {
    throw new Error(`Refusing to submit a URL outside ${siteOrigin}: ${url}`);
  }
}

const payload = { host, key, keyLocation, urlList };

if (!shouldSubmit) {
  console.log(`IndexNow dry run: ${urlList.length} URLs are ready for ${host}.`);
  console.log(`Key location: ${keyLocation}`);
  console.log("Run with --submit only after the key file and sitemap are live.");
  process.exit(0);
}

const keyResponse = await fetch(keyLocation, { redirect: "follow" });
if (!keyResponse.ok) {
  throw new Error(`The live IndexNow key returned HTTP ${keyResponse.status}. Deploy before submitting.`);
}

const liveKey = (await keyResponse.text()).trim();
if (liveKey !== key) throw new Error("The live IndexNow key file does not match the configured key.");

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

const responseBody = (await response.text()).trim();
if (!response.ok) {
  throw new Error(`IndexNow returned HTTP ${response.status}${responseBody ? `: ${responseBody}` : "."}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with HTTP ${response.status}.`);
