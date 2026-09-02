import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const lastmod = new Date().toISOString().slice(0, 10);

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);

  if (entry.isDirectory()) {
    if (["partials", "scripts", ".git"].includes(entry.name)) return [];
    return walk(fullPath);
  }

  return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
});

const preferredOrder = [
  "https://integritydrivetrain.com/",
  "https://integritydrivetrain.com/services",
  "https://integritydrivetrain.com/services/transmission-replacement",
  "https://integritydrivetrain.com/services/transmission-repair",
  "https://integritydrivetrain.com/services/transmission-rebuild",
  "https://integritydrivetrain.com/services/bench-transmission-rebuild",
  "https://integritydrivetrain.com/services/torque-converter",
  "https://integritydrivetrain.com/services/transfer-case",
  "https://integritydrivetrain.com/services/differential",
  "https://integritydrivetrain.com/transmissions",
  "https://integritydrivetrain.com/transmissions/4l60e",
  "https://integritydrivetrain.com/transmissions/6l80-6l90",
  "https://integritydrivetrain.com/transmissions/10r80",
  "https://integritydrivetrain.com/transmissions/68rfe",
  "https://integritydrivetrain.com/transmissions/700r4",
  "https://integritydrivetrain.com/transmissions/4l80e",
  "https://integritydrivetrain.com/reman-transmissions",
  "https://integritydrivetrain.com/guides/transmission-problems",
  "https://integritydrivetrain.com/rebuild-guide",
  "https://integritydrivetrain.com/warranty",
  "https://integritydrivetrain.com/service-area",
  "https://integritydrivetrain.com/about",
  "https://integritydrivetrain.com/reviews",
  "https://integritydrivetrain.com/contact",
];

const urls = walk(siteRoot).flatMap((filePath) => {
  const html = fs.readFileSync(filePath, "utf8");
  if (/name="robots"\s+content="[^"]*noindex/i.test(html)) return [];
  if (path.basename(filePath) === "404.html") return [];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  return canonical ? [canonical] : [];
});

const uniqueUrls = [...new Set(urls)].sort((left, right) => {
  const leftIndex = preferredOrder.indexOf(left);
  const rightIndex = preferredOrder.indexOf(right);
  if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(siteRoot, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${uniqueUrls.length} URLs.`);
