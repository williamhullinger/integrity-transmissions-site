import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import process from "node:process";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const siteRoot = resolve(import.meta.dirname, "..");
const functionRoot = join(repositoryRoot, "netlify/functions");
const failures = [];

const hasBalancedCssBlocks = (source) => {
  let depth = 0;
  let quote = "";
  let inComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (inComment) {
      if (current === "*" && next === "/") { inComment = false; index += 1; }
      continue;
    }
    if (!quote && current === "/" && next === "*") { inComment = true; index += 1; continue; }
    if (quote) {
      if (current === "\\") index += 1;
      else if (current === quote) quote = "";
      continue;
    }
    if (current === '"' || current === "'") { quote = current; continue; }
    if (current === "{") depth += 1;
    if (current === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0 && !quote && !inComment;
};

const walk = (root) => readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const path = join(root, entry.name);
  if (entry.isDirectory()) return walk(path);
  return [path];
});

const productionScripts = [
  ...walk(siteRoot).filter((path) => [".js", ".mjs"].includes(extname(path))),
  ...walk(functionRoot).filter((path) => [".js", ".mjs"].includes(extname(path))),
];

for (const script of productionScripts) {
  try {
    execFileSync(process.execPath, ["--check", script], { stdio: "pipe" });
  } catch (error) {
    failures.push(`${relative(repositoryRoot, script)}: JavaScript syntax check failed\n${error.stderr || error.message}`);
  }
}

if (!process.argv.includes("--syntax-only")) {
  const publicHtml = walk(siteRoot).filter((path) => extname(path) === ".html"
    && !path.includes(`${join(siteRoot, "staff")}/`)
    && !path.includes(`${join(siteRoot, "partials")}/`));
  const routeFiles = new Map();

  for (const stylesheet of walk(siteRoot).filter((path) => extname(path) === ".css")) {
    if (!hasBalancedCssBlocks(readFileSync(stylesheet, "utf8"))) {
      failures.push(`${relative(repositoryRoot, stylesheet)}: unbalanced CSS blocks, comments, or strings`);
    }
  }

  for (const page of publicHtml) {
    const html = readFileSync(page, "utf8");
    const label = relative(siteRoot, page);
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']https:\/\/integritydrivetrain\.com([^"']*)["']/i)?.[1];
    if (canonical != null) routeFiles.set(canonical || "/", page);

    const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) failures.push(`${label}: duplicate IDs (${[...new Set(duplicates)].join(", ")})`);

    for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
      if (!/\brel=["'][^"']*\bnoopener\b/i.test(match[0])) failures.push(`${label}: target="_blank" link is missing rel="noopener"`);
    }
    for (const match of html.matchAll(/<form\b[^>]*\baction=["']([^"']+)["']/gi)) {
      if (/^\/[^?#]+\.html(?:[?#]|$)/i.test(match[1])) failures.push(`${label}: form action should use a clean URL (${match[1]})`);
    }
    for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
      const href = match[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || "";
      if (/\brel=["'][^"']*stylesheet/i.test(match[0]) && /^(?:\/|\.\/|[a-z0-9_-])[^:]*\.css(?:\?|$)/i.test(href) && !/[?&]v=/.test(href)) {
        failures.push(`${label}: first-party stylesheet is missing a cache-busting version (${href})`);
      }
    }
    for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
      const src = match[1];
      if (/^(?:\/|\.\/|[a-z0-9_-])[^:]*\.js(?:\?|$)/i.test(src) && !/[?&]v=/.test(src)) {
        failures.push(`${label}: first-party script is missing a cache-busting version (${src})`);
      }
    }
    if (/\b(?:staff only|wholesale account|integrity price floor)\b/i.test(html)) {
      failures.push(`${label}: customer page contains internal operations language`);
    }
    if (/\b(?:keyword data|search demand|thin pages?|SEO campaign|content strategy)\b/i.test(html)) {
      failures.push(`${label}: customer page contains internal marketing language`);
    }
  }

  for (const page of publicHtml) {
    const html = readFileSync(page, "utf8");
    const label = relative(siteRoot, page);
    const currentIds = new Set([...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]));
    for (const match of html.matchAll(/\bhref=["']([^"'#][^"']*|#[^"']+)["']/gi)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|tel:|sms:|javascript:)/i.test(href) || !href.includes("#")) continue;
      const [pathPart, fragment] = href.split("#", 2);
      if (!fragment) continue;
      const cleanPathPart = pathPart.split("?", 1)[0];
      const targetFile = cleanPathPart ? routeFiles.get(cleanPathPart) : page;
      const targetIds = targetFile
        ? new Set([...readFileSync(targetFile, "utf8").matchAll(/\sid=["']([^"']+)["']/gi)].map((item) => item[1]))
        : new Set();
      if (!targetFile || !targetIds.has(fragment)) failures.push(`${label}: broken fragment link ${href}`);
    }
  }

  const headersFile = readFileSync(join(siteRoot, "_headers"), "utf8");
  for (const directive of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    if (!headersFile.includes(directive)) failures.push(`_headers: missing ${directive}`);
  }

  const redirects = readFileSync(join(siteRoot, "_redirects"), "utf8");
  for (const blockedPath of ["/staff/*", "/scripts/*", "/partials/*", "/Js/*", "/ACE_INTEGRATION.md"]) {
    if (!redirects.includes(blockedPath)) failures.push(`_redirects: missing block for ${blockedPath}`);
  }

  for (const required of ["netlify.toml", "package-lock.json", "scripts/build-integrity-site.mjs", "scripts/test-integrity-build.mjs"]) {
    if (!existsSync(join(repositoryRoot, required))) failures.push(`${required}: required production file is missing`);
  }

  const textFiles = walk(repositoryRoot).filter((path) => !path.includes("/node_modules/")
    && !path.includes("/.git/")
    && [".js", ".mjs", ".json", ".toml", ".html", ".css", ".md", ".xml", ".txt"].includes(extname(path)));
  for (const file of textFiles) {
    const content = readFileSync(file, "utf8");
    if (/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/.test(content)) failures.push(`${relative(repositoryRoot, file)}: possible Stripe secret key committed`);
  }
}

if (failures.length) {
  console.error(`Production audit failed with ${failures.length} finding${failures.length === 1 ? "" : "s"}:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Production audit passed (${productionScripts.length} JavaScript files checked${process.argv.includes("--syntax-only") ? "" : "; HTML, security and release checks passed"}).`);
