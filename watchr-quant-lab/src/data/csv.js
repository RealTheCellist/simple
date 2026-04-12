import fs from "node:fs";
import path from "node:path";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadRowsFromCsv(csvPath) {
  const resolved = path.resolve(process.cwd(), csvPath);
  const raw = fs.readFileSync(resolved, "utf-8").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const indexOf = (name) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((v) => v.trim());
    return {
      date: cols[indexOf("date")] || "",
      factors: {
        nq: toNumber(cols[indexOf("nq")]),
        sp: toNumber(cols[indexOf("sp")]),
        dow: toNumber(cols[indexOf("dow")]),
        k200: toNumber(cols[indexOf("k200")]),
        kosdaq: toNumber(cols[indexOf("kosdaq")]),
        usdkrw: toNumber(cols[indexOf("usdkrw")])
      },
      openReturnPct: toNumber(cols[indexOf("openReturnPct")])
    };
  });
}
