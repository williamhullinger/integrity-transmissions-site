import { cp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repositoryRoot, "projects", "hullinger-transmission");
const publishRoot = path.join(repositoryRoot, "dist", "integrity");

const publicFiles = [
  "7cc0ffb2a4339e0f4dd94715249519ef.txt",
  "_headers",
  "_redirects",
  "robots.txt",
  "sitemap.xml",
  "404.html",
  "about.css", "about.html",
  "commerce-guides.css",
  "contact.css", "contact.html",
  "index.css", "index.html",
  "modern-pages.css",
  "privacy.html",
  "rebuild-guide.css", "rebuild-guide.html",
  "reman-order-success.html", "reman-order-success.js",
  "reman-order-terms.html", "reman-transmissions.html",
  "review-thank-you.html",
  "reviews.css", "reviews.html",
  "script.js",
  "seo-landing.css", "service-area.html",
  "services.css", "services.html",
  "styles.css",
  "thank-you.css", "thank-you.html",
  "transmissions.css", "transmissions.html",
  "vin-decoder.js",
  "warranty.css", "warranty.html",
  "guides/cvt-transmission-problems.html",
  "guides/transmission-problems.html",
  "reman-transmissions/10r80.html",
  "reman-transmissions/4l60e.html",
  "reman-transmissions/4l80e.html",
  "reman-transmissions/68rfe.html",
  "reman-transmissions/6l80.html",
  "reman-transmissions/6l90.html",
  "reman-transmissions/700r4.html",
  "services/bench-transmission-rebuild.html",
  "services/differential.html",
  "services/torque-converter.html",
  "services/transfer-case.html",
  "services/transmission-rebuild.html",
  "services/transmission-repair.html",
  "services/transmission-replacement.html",
  "transmissions/10r80.html",
  "transmissions/4l60e.html",
  "transmissions/4l80e.html",
  "transmissions/68rfe.html",
  "transmissions/6l80-6l90.html",
  "transmissions/700r4.html",
];

const copyFile = async (source, destination) => {
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force: true });
};

await rm(publishRoot, { recursive: true, force: true });
await mkdir(publishRoot, { recursive: true });

for (const relativePath of publicFiles) {
  await copyFile(path.join(sourceRoot, relativePath), path.join(publishRoot, relativePath));
}

const imageReferences = new Set();
const imagePattern = /(?:^|[(/'"\s])\/?(images\/[A-Za-z0-9_./-]+\.(?:avif|gif|ico|jpe?g|png|svg|webp))/gi;

for (const relativePath of publicFiles) {
  if (!/\.(?:css|html|js|xml)$/i.test(relativePath)) continue;
  const source = await readFile(path.join(sourceRoot, relativePath), "utf8");
  for (const match of source.matchAll(imagePattern)) imageReferences.add(match[1]);
}

for (const imagePath of [...imageReferences].sort()) {
  await copyFile(path.join(sourceRoot, imagePath), path.join(publishRoot, imagePath));
}

const publishedEntries = await readdir(publishRoot, { recursive: true });
console.log(`Integrity production bundle created with ${publishedEntries.length} files.`);
