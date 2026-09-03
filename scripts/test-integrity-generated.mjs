import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repositoryRoot, "projects", "hullinger-transmission");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "integrity-generated-"));
const generatedRoot = path.join(temporaryRoot, "hullinger-transmission");

const listHtml = async (directory, root = directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["images", ".git"].includes(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(absolutePath, root));
    else if (entry.name.endsWith(".html")) files.push(path.relative(root, absolutePath));
  }
  return files;
};

try {
  await cp(sourceRoot, generatedRoot, { recursive: true, filter: (source) => !source.includes(`${path.sep}images${path.sep}`) });
  for (const script of ["generate-seo-pages.mjs", "generate-reman-family-pages.mjs", "sync-partials.mjs"]) {
    execFileSync(process.execPath, [path.join(generatedRoot, "scripts", script)], { stdio: "pipe" });
  }

  const htmlFiles = await listHtml(sourceRoot);
  const drift = [];
  for (const relativePath of htmlFiles) {
    const [committed, regenerated] = await Promise.all([
      readFile(path.join(sourceRoot, relativePath), "utf8"),
      readFile(path.join(generatedRoot, relativePath), "utf8"),
    ]);
    if (committed !== regenerated) drift.push(relativePath);
  }

  assert.deepEqual(drift, [], `Generated Integrity pages are stale: ${drift.join(", ")}`);
  console.log(`Generated-page drift test passed: ${htmlFiles.length} HTML files are current.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
