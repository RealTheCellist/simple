import fs from "node:fs";
import path from "node:path";

const distPath = path.resolve(process.cwd(), "dist");
const htmlPath = path.join(distPath, "index.html");

if (!fs.existsSync(distPath)) {
  console.error("dist 폴더가 없습니다. 먼저 npm run build 실행 필요");
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error("dist/index.html 누락");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf-8");
if (!html.includes("WATCHR OPS")) {
  console.error("빌드 결과에 WATCHR OPS 마커가 없습니다.");
  process.exit(1);
}

console.log("smoke check passed");
