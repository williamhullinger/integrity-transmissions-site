import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const baseUrl = "https://integritydrivetrain.com";

const routeMap = new Map([
  ["index.html", "/"],
  ["about.html", "/about"],
  ["services.html", "/services"],
  ["transmissions.html", "/transmissions"],
  ["rebuild-guide.html", "/rebuild-guide"],
  ["reviews.html", "/reviews"],
  ["warranty.html", "/warranty"],
  ["contact.html", "/contact"],
  ["thank-you.html", "/thank-you"],
  ["review-thank-you.html", "/review-thank-you"],
]);

const pageImages = new Map([
  ["index.html", "/images/homepage-owner-patch-hero.webp"],
  ["about.html", "/images/about-owner-patch-hero.webp"],
  ["services.html", "/images/services-owner-clean-hero.webp"],
  ["transmissions.html", "/images/supported-units-hero.webp"],
  ["rebuild-guide.html", "/images/rebuild-options-hero.webp"],
  ["reviews.html", "/images/customer-reviews-owner-patch-hero.webp"],
  ["warranty.html", "/images/warranty-coverage-hero.webp"],
  ["contact.html", "/images/contact-owner-patch-hero.webp"],
]);

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);

  if (entry.isDirectory()) {
    if (["scripts", ".git"].includes(entry.name)) return [];
    return walk(fullPath);
  }

  return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
});

let updated = 0;

for (const filePath of walk(siteRoot)) {
  const source = fs.readFileSync(filePath, "utf8");
  let output = source;

  for (const [fileName, cleanPath] of routeMap) {
    output = output.replaceAll(`${baseUrl}/${fileName}`, `${baseUrl}${cleanPath}`);

    for (const prefix of ["", "./", "../", "../../"]) {
      output = output.replaceAll(`href="${prefix}${fileName}`, `href="${cleanPath}`);
      output = output.replaceAll(`href='${prefix}${fileName}`, `href='${cleanPath}`);
      output = output.replaceAll(`action="${prefix}${fileName}`, `action="${cleanPath}`);
      output = output.replaceAll(`action='${prefix}${fileName}`, `action='${cleanPath}`);
    }
  }

  const ogImage = pageImages.get(path.basename(filePath));

  if (ogImage) {
    output = output.replaceAll(`${baseUrl}/images/og-integrity-drivetrain.jpg`, `${baseUrl}${ogImage}`);
  }

  output = output
    .replace(/<link rel="icon" href="(?:\.\.\/)*images\/favicon\.ico">/g, '<link rel="icon" type="image/png" href="/images/integrity-logo-ITD.png">')
    .replace(/<link rel="apple-touch-icon" href="(?:\.\.\/)*images\/apple-touch-icon\.png">/g, '<link rel="apple-touch-icon" href="/images/integrity-logo-ITD.png">');

  if (output !== source) {
    fs.writeFileSync(filePath, output, "utf8");
    updated += 1;
  }
}

console.log(`Normalized internal and canonical URLs in ${updated} HTML files.`);
