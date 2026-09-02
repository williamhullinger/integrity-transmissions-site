import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const port = Number.parseInt(process.env.INTEGRITY_PREVIEW_PORT || "4180", 10);
const redirects = new Map(
  fs.readFileSync(path.join(siteRoot, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .map(([from, to, status]) => [from, { to, status: Number.parseInt(status, 10) }]),
);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

const routeFile = (pathname) => {
  if (pathname === "/") return path.join(siteRoot, "index.html");
  if (path.extname(pathname)) return path.join(siteRoot, pathname.slice(1));
  return path.join(siteRoot, `${pathname.slice(1)}.html`);
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const redirect = redirects.get(pathname);

  if (redirect) {
    response.writeHead(redirect.status, { Location: redirect.to });
    response.end();
    return;
  }

  const filePath = routeFile(pathname);
  if (!filePath.startsWith(siteRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(fs.readFileSync(path.join(siteRoot, "404.html")));
    return;
  }

  response.writeHead(200, { "Content-Type": mimeTypes.get(path.extname(filePath)) || "text/html; charset=utf-8" });
  response.end(fs.readFileSync(filePath));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Integrity preview running at http://localhost:${port}`);
});
