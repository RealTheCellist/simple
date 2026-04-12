import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const distDir = path.join(root, "dist");
const assetsDir = path.join(distDir, "assets");
const budgetPath = path.join(root, "perf-budget.json");

function fail(message) {
  console.error(`[perf-budget] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) fail("Missing dist directory. Run `npm run build` first.");
if (!fs.existsSync(assetsDir)) fail("Missing dist/assets directory.");
if (!fs.existsSync(budgetPath)) fail("Missing perf-budget.json.");

const budget = JSON.parse(fs.readFileSync(budgetPath, "utf8"));
const indexPath = path.join(distDir, "index.html");
if (!fs.existsSync(indexPath)) fail("Missing dist/index.html.");

const files = fs.readdirSync(assetsDir);
const jsFiles = files.filter((name) => name.endsWith(".js"));
const cssFiles = files.filter((name) => name.endsWith(".css"));

if (!jsFiles.length) fail("No JS assets found in dist/assets.");
if (!cssFiles.length) fail("No CSS assets found in dist/assets.");

function statsFor(fileNames) {
  return fileNames.map((name) => {
    const full = path.join(assetsDir, name);
    const raw = fs.readFileSync(full);
    return {
      name,
      bytes: raw.byteLength,
      gzipBytes: zlib.gzipSync(raw).byteLength
    };
  });
}

function sumBy(rows, key) {
  return rows.reduce((acc, row) => acc + row[key], 0);
}

const jsStats = statsFor(jsFiles);
const cssStats = statsFor(cssFiles);
const indexBytes = fs.readFileSync(indexPath).byteLength;

const largestJsBytes = Math.max(...jsStats.map((row) => row.bytes));
const totalJsBytes = sumBy(jsStats, "bytes");
const largestCssBytes = Math.max(...cssStats.map((row) => row.bytes));
const totalCssBytes = sumBy(cssStats, "bytes");
const totalGzipBytes = sumBy(jsStats, "gzipBytes") + sumBy(cssStats, "gzipBytes");

const checks = [
  ["maxIndexHtmlBytes", indexBytes],
  ["maxLargestJsBytes", largestJsBytes],
  ["maxTotalJsBytes", totalJsBytes],
  ["maxLargestCssBytes", largestCssBytes],
  ["maxTotalCssBytes", totalCssBytes],
  ["maxTotalGzipBytes", totalGzipBytes]
];

const violations = checks
  .filter(([key]) => Number.isFinite(Number(budget[key])))
  .filter(([key, value]) => value > Number(budget[key]))
  .map(([key, value]) => `${key}: ${value} > ${budget[key]}`);

console.log("[perf-budget] index.html bytes:", indexBytes);
console.log("[perf-budget] JS total/largest:", totalJsBytes, "/", largestJsBytes);
console.log("[perf-budget] CSS total/largest:", totalCssBytes, "/", largestCssBytes);
console.log("[perf-budget] gzip total (js+css):", totalGzipBytes);

if (violations.length) {
  console.error("[perf-budget] Budget violations:");
  violations.forEach((line) => console.error(`- ${line}`));
  process.exit(1);
}

console.log("[perf-budget] All checks passed.");
