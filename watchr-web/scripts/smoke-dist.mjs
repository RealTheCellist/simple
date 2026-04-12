import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const indexPath = path.join(distDir, "index.html");
const redirectsPath = path.join(distDir, "_redirects");
const robotsPath = path.join(distDir, "robots.txt");

function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) fail("Missing dist/index.html.");

const html = fs.readFileSync(indexPath, "utf8");

if (!html.includes('id="app"') && !html.includes("id='app'")) {
  fail("index.html does not contain #app root element.");
}

if (!/assets\/.+\.js/.test(html)) {
  fail("index.html does not reference built JS asset.");
}

if (!/assets\/.+\.css/.test(html)) {
  fail("index.html does not reference built CSS asset.");
}

if (!fs.existsSync(redirectsPath)) {
  fail("Missing dist/_redirects for SPA fallback.");
}

if (!fs.existsSync(robotsPath)) {
  fail("Missing dist/robots.txt.");
}

console.log("[smoke] dist sanity checks passed.");
