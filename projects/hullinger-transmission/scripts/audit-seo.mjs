import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const baseUrl = "https://integritydrivetrain.com";
const indexNowKey = "7cc0ffb2a4339e0f4dd94715249519ef";
const errors = [];
const warnings = [];

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);

  if (entry.isDirectory()) {
    if (["partials", "scripts", ".git"].includes(entry.name)) return [];
    return walk(fullPath);
  }

  return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
});

const htmlFiles = walk(siteRoot);
const indexable = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
const seenCanonicals = new Map();
const heroImages = new Map();
const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const validateTagNesting = (html, relative) => {
  const simplified = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "<script></script>")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "<style></style>");
  const stack = [];

  for (const match of simplified.matchAll(/<\s*(\/?)\s*([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?(\/?)\s*>/g)) {
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const selfClosing = match[3] === "/" || voidElements.has(tag);

    if (selfClosing) continue;

    if (!closing) {
      stack.push(tag);
      continue;
    }

    const expected = stack.pop();
    if (expected !== tag) {
      errors.push(`${relative}: tag nesting error, closed </${tag}> while <${expected || "none"}> was open`);
      return;
    }
  }

  if (stack.length) errors.push(`${relative}: unclosed tag <${stack.at(-1)}>`);
};

const routeToFile = (route) => {
  const cleanRoute = route.split("#")[0].split("?")[0];

  if (cleanRoute === "/") return path.join(siteRoot, "index.html");
  if (!cleanRoute.startsWith("/")) return null;

  const relative = cleanRoute.slice(1);
  const htmlCandidate = path.join(siteRoot, `${relative}.html`);
  const directoryCandidate = path.join(siteRoot, relative, "index.html");

  if (fs.existsSync(htmlCandidate)) return htmlCandidate;
  if (fs.existsSync(directoryCandidate)) return directoryCandidate;
  return htmlCandidate;
};

const addDuplicate = (map, value, file, label) => {
  if (!value) return;
  if (map.has(value)) errors.push(`${file}: duplicate ${label} also used by ${map.get(value)}`);
  else map.set(value, file);
};

for (const filePath of htmlFiles) {
  const relative = path.relative(siteRoot, filePath).replaceAll(path.sep, "/");
  const html = fs.readFileSync(filePath, "utf8");
  const isNoindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const is404 = relative === "404.html";
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, " ").trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1].trim();
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1].trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing meta description`);
  if (h1Count !== 1 && !is404) errors.push(`${relative}: expected one H1, found ${h1Count}`);

  if (!isNoindex && !is404) {
    indexable.push(relative);
    if (!canonical) errors.push(`${relative}: missing canonical`);
    if (canonical?.includes(".html")) errors.push(`${relative}: canonical contains .html`);
    if (canonical && !canonical.startsWith(baseUrl)) errors.push(`${relative}: canonical is outside the production domain`);
    addDuplicate(seenTitles, title, relative, "title");
    addDuplicate(seenDescriptions, description, relative, "description");
    addDuplicate(seenCanonicals, canonical, relative, "canonical");

    if (title && (title.length < 30 || title.length > 68)) warnings.push(`${relative}: title length ${title.length}`);
    if (description && (description.length < 120 || description.length > 165)) warnings.push(`${relative}: description length ${description.length}`);
  }

  if (/data-include=|partials\.js/i.test(html)) errors.push(`${relative}: still depends on runtime HTML partials`);
  if (/417\s*Eurowerks|open\s+7\s+days|open\s+seven\s+days/i.test(html)) errors.push(`${relative}: contains prohibited stale business information`);
  if (/Integrity handles (?:the complete job|removal and installation)/i.test(html)) errors.push(`${relative}: contains outdated direct R&R wording`);

  validateTagNesting(html, relative);

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${relative}: duplicate IDs ${[...new Set(duplicateIds)].join(", ")}`);

  for (const imageMatch of html.matchAll(/<img\b[^>]*>/gi)) {
    const imageTag = imageMatch[0];
    if (!/\salt="[^"]*"/i.test(imageTag)) errors.push(`${relative}: image missing alt attribute`);
    if (!/\swidth="\d+"/i.test(imageTag) || !/\sheight="\d+"/i.test(imageTag)) {
      errors.push(`${relative}: image missing numeric width/height attributes`);
    }
  }

  for (const scriptMatch of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(scriptMatch[1]);
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  if (!isNoindex && !is404 && !/application\/ld\+json/i.test(html)) {
    errors.push(`${relative}: missing JSON-LD`);
  }

  for (const match of html.matchAll(/href="([^"]+)"/gi)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    if (/\.(?:css|js|png|jpe?g|webp|ico|xml|txt|pdf)(?:$|[?#])/i.test(href)) continue;
    const target = routeToFile(href);
    if (target && !fs.existsSync(target)) errors.push(`${relative}: broken internal link ${href}`);
  }

  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:css|js|png|jpe?g|webp|ico))"/gi)) {
    const target = path.join(siteRoot, match[1].slice(1));
    if (!fs.existsSync(target)) errors.push(`${relative}: missing asset ${match[1]}`);
  }

  for (const match of html.matchAll(/(?:src|href)="((?!https?:|\/)[^"#?]+\.(?:css|js|png|jpe?g|webp|ico))"/gi)) {
    const target = path.resolve(path.dirname(filePath), match[1]);
    if (!fs.existsSync(target)) errors.push(`${relative}: missing relative asset ${match[1]}`);
  }

  const hero = html.match(/<link\s+rel="preload"\s+as="image"\s+href="([^"]+)"/i)?.[1];
  if (hero && (relative === "service-area.html" || relative.includes("/"))) {
    if (heroImages.has(hero)) errors.push(`${relative}: reuses SEO hero image from ${heroImages.get(hero)}`);
    else heroImages.set(hero, relative);
  }
}

const sitemapPath = path.join(siteRoot, "sitemap.xml");

if (!fs.existsSync(sitemapPath)) {
  errors.push("sitemap.xml is missing");
} else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const canonicalUrls = [...seenCanonicals.keys()].sort();

  if (sitemapUrls.length !== 22) errors.push(`sitemap.xml: expected 22 URLs, found ${sitemapUrls.length}`);
  if (sitemapUrls.some((url) => url.includes(".html"))) errors.push("sitemap.xml: contains .html URLs");
  if (!sitemapUrls.every((url) => /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap))) {
    errors.push("sitemap.xml: missing lastmod values");
  }

  const missingFromSitemap = canonicalUrls.filter((url) => !sitemapUrls.includes(url));
  const extraInSitemap = sitemapUrls.filter((url) => !canonicalUrls.includes(url));
  if (missingFromSitemap.length) errors.push(`sitemap.xml: missing ${missingFromSitemap.join(", ")}`);
  if (extraInSitemap.length) errors.push(`sitemap.xml: extra ${extraInSitemap.join(", ")}`);
}

for (const required of ["_redirects", "_headers", "robots.txt", "404.html", `${indexNowKey}.txt`]) {
  if (!fs.existsSync(path.join(siteRoot, required))) errors.push(`${required} is missing`);
}

const indexNowKeyPath = path.join(siteRoot, `${indexNowKey}.txt`);
if (fs.existsSync(indexNowKeyPath) && fs.readFileSync(indexNowKeyPath, "utf8").trim() !== indexNowKey) {
  errors.push("IndexNow key file content does not match its filename");
}

console.log(`SEO audit: ${htmlFiles.length} HTML files, ${indexable.length} indexable pages.`);
console.log(`Unique SEO landing-page heroes: ${heroImages.size}.`);

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("SEO audit passed with no errors.");
