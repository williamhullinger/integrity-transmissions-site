import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const header = fs.readFileSync(path.join(siteRoot, "partials/header.html"), "utf8").trim();
const footer = fs.readFileSync(path.join(siteRoot, "partials/footer.html"), "utf8").trim();

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);

  if (entry.isDirectory()) {
    if (["partials", "scripts", ".git"].includes(entry.name)) return [];
    return walk(fullPath);
  }

  return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
});

const headerBlock = `<!-- SITE_HEADER_START -->\n${header}\n  <!-- SITE_HEADER_END -->`;
const footerBlock = `<!-- SITE_FOOTER_START -->\n${footer}\n  <!-- SITE_FOOTER_END -->`;
let updated = 0;

for (const filePath of walk(siteRoot)) {
  const source = fs.readFileSync(filePath, "utf8");
  let output = source;

  if (/<!-- SITE_HEADER_START -->[\s\S]*?<!-- SITE_HEADER_END -->/.test(output)) {
    output = output.replace(/<!-- SITE_HEADER_START -->[\s\S]*?<!-- SITE_HEADER_END -->/, headerBlock);
  } else {
    output = output.replace(/<div\s+data-include=["']partials\/header\.html["']><\/div>/, headerBlock);
  }

  if (/<!-- SITE_FOOTER_START -->[\s\S]*?<!-- SITE_FOOTER_END -->/.test(output)) {
    output = output.replace(/<!-- SITE_FOOTER_START -->[\s\S]*?<!-- SITE_FOOTER_END -->/, footerBlock);
  } else {
    output = output.replace(/<div\s+data-include=["']partials\/footer\.html["']><\/div>/, footerBlock);
  }

  output = output.replace(/\s*<script\s+src=["'](?:\/?Js|\/?js)\/partials\.js["']\s+defer><\/script>/gi, "");

  if (output !== source) {
    fs.writeFileSync(filePath, output, "utf8");
    updated += 1;
  }
}

console.log(`Embedded shared header and footer in ${updated} HTML files.`);
