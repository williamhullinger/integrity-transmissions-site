import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repositoryRoot, "projects", "hullinger-transmission");
const publishRoot = path.join(repositoryRoot, "dist", "integrity");

const rootAssetExtensions = new Set([".css", ".html", ".js", ".xml"]);
const rootAssetNames = new Set([
  "7cc0ffb2a4339e0f4dd94715249519ef.txt",
  "_headers",
  "_redirects",
  "robots.txt",
]);
const publicDirectories = ["guides", "images", "reman-transmissions", "services", "transmissions"];

const copyFile = async (source, destination) => {
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { force: true });
};

const sourceEntries = await readdir(sourceRoot, { withFileTypes: true });

await rm(publishRoot, { recursive: true, force: true });
await mkdir(publishRoot, { recursive: true });

for (const entry of sourceEntries) {
  if (!entry.isFile()) continue;
  if (!rootAssetNames.has(entry.name) && !rootAssetExtensions.has(path.extname(entry.name))) continue;
  await copyFile(path.join(sourceRoot, entry.name), path.join(publishRoot, entry.name));
}

for (const directory of publicDirectories) {
  await cp(path.join(sourceRoot, directory), path.join(publishRoot, directory), {
    recursive: true,
    force: true,
  });
}

const publishedEntries = await readdir(publishRoot, { recursive: true });
console.log(`Integrity production bundle created with ${publishedEntries.length} files.`);
