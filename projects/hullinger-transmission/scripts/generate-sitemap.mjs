import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(siteRoot, "../..");
const sitemapPath = path.join(siteRoot, "sitemap.xml");
const existingLastmod = new Map();

const retainLastmod = (sitemap) => {
  for (const match of sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/g)) {
    const retained = existingLastmod.get(match[1]);
    if (!retained || match[2] > retained) existingLastmod.set(match[1], match[2]);
  }
};

if (fs.existsSync(sitemapPath)) retainLastmod(fs.readFileSync(sitemapPath, "utf8"));

try {
  const committedSitemap = execFileSync("git", ["show", "HEAD:projects/hullinger-transmission/sitemap.xml"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  retainLastmod(committedSitemap);
} catch {
  // A source archive without Git history can still preserve the local sitemap values.
}

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
  "https://integritydrivetrain.com/reman-powertrain",
  "https://integritydrivetrain.com/reman-engines",
  "https://integritydrivetrain.com/reman-transmissions",
  "https://integritydrivetrain.com/reman-transfer-cases",
  "https://integritydrivetrain.com/reman-transmissions/10r80",
  "https://integritydrivetrain.com/reman-transmissions/6l80",
  "https://integritydrivetrain.com/reman-transmissions/6l90",
  "https://integritydrivetrain.com/reman-transmissions/68rfe",
  "https://integritydrivetrain.com/reman-transmissions/4l60e",
  "https://integritydrivetrain.com/reman-transmissions/4l80e",
  "https://integritydrivetrain.com/reman-transmissions/700r4",
  "https://integritydrivetrain.com/guides",
  "https://integritydrivetrain.com/guides/remanufactured-transmission-cost",
  "https://integritydrivetrain.com/guides/reman-vs-rebuilt-vs-used-transmission",
  "https://integritydrivetrain.com/guides/transmission-core-return",
  "https://integritydrivetrain.com/guides/shipping-transmission",
  "https://integritydrivetrain.com/guides/transmission-warranty-coverage",
  "https://integritydrivetrain.com/guides/how-to-identify-transmission",
  "https://integritydrivetrain.com/guides/identify-transfer-case",
  "https://integritydrivetrain.com/guides/transmission-programming-relearn",
  "https://integritydrivetrain.com/guides/transmission-problems",
  "https://integritydrivetrain.com/guides/cvt-transmission-problems",
  "https://integritydrivetrain.com/rebuild-guide",
  "https://integritydrivetrain.com/warranty",
  "https://integritydrivetrain.com/service-area",
  "https://integritydrivetrain.com/about",
  "https://integritydrivetrain.com/reviews",
  "https://integritydrivetrain.com/contact",
];

const lastModified = (filePath) => {
  const relativePath = path.relative(repositoryRoot, filePath);
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", relativePath], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).trim();
    if (!dirty) {
      const committed = execFileSync("git", ["log", "-1", "--format=%cs", "--", relativePath], {
        cwd: repositoryRoot,
        encoding: "utf8",
      }).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(committed)) return committed;
    }
  } catch {
    // Fall back to the filesystem date when Git metadata is unavailable.
  }
  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
};

const urls = walk(siteRoot).flatMap((filePath) => {
  const html = fs.readFileSync(filePath, "utf8");
  if (/name="robots"\s+content="[^"]*noindex/i.test(html)) return [];
  if (path.basename(filePath) === "404.html") return [];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical) return [];
  const computedLastmod = lastModified(filePath);
  const previousLastmod = existingLastmod.get(canonical);
  return [{
    url: canonical,
    filePath,
    lastmod: previousLastmod && previousLastmod > computedLastmod ? previousLastmod : computedLastmod,
  }];
});

const uniqueUrls = [...new Map(urls.map((entry) => [entry.url, entry])).values()].sort((left, right) => {
  const leftIndex = preferredOrder.indexOf(left.url);
  const rightIndex = preferredOrder.indexOf(right.url);
  if (leftIndex === -1 && rightIndex === -1) return left.url.localeCompare(right.url);
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml, "utf8");
console.log(`Generated sitemap.xml with ${uniqueUrls.length} URLs.`);
