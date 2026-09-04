import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const officeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(officeRoot, "web");
const outputRoot = path.resolve(officeRoot, "../../dist/integrity-office");
const assetRoot = path.join(outputRoot, "assets");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(assetRoot, { recursive: true });

await Promise.all([
  cp(path.join(webRoot, "index.html"), path.join(outputRoot, "index.html")),
  cp(path.join(webRoot, "styles.css"), path.join(assetRoot, "office.css")),
  cp(path.join(webRoot, "_headers"), path.join(outputRoot, "_headers")),
  cp(path.join(webRoot, "_redirects"), path.join(outputRoot, "_redirects")),
  cp(path.join(webRoot, "robots.txt"), path.join(outputRoot, "robots.txt")),
]);

await build({
  entryPoints: [path.join(webRoot, "src/app.mjs")],
  outfile: path.join(assetRoot, "office.js"),
  bundle: true,
  minify: true,
  sourcemap: false,
  legalComments: "none",
  target: ["es2022"],
  platform: "browser",
  format: "iife",
  logLevel: "warning",
});

console.log("Integrity Office private application bundle created.");
