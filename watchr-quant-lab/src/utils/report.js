import fs from "node:fs";
import path from "node:path";

export function writeReport(filePath, payload) {
  const resolved = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(payload, null, 2), "utf-8");
  return resolved;
}

export function topTradeRows(trades, count = 5) {
  return [...trades]
    .sort((a, b) => Math.abs(b.netReturnPct) - Math.abs(a.netReturnPct))
    .slice(0, count);
}
