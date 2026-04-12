import fs from "node:fs";
import path from "node:path";
import { loadRowsFromCsv } from "./csv.js";
import { generateSyntheticRows } from "./synthetic.js";
import { loadRowsFromYahoo } from "./yahoo.js";

function isNonEmptyRows(rows) {
  return Array.isArray(rows) && rows.length > 0;
}

function resolvedPath(filePath) {
  if (!filePath) return "";
  return path.resolve(process.cwd(), filePath);
}

export async function loadRowsWithPolicy(options = {}, deps = {}) {
  const loadYahoo = deps.loadYahoo ?? loadRowsFromYahoo;
  const loadCsv = deps.loadCsv ?? loadRowsFromCsv;
  const genSynthetic = deps.genSynthetic ?? generateSyntheticRows;

  const mode = options.mode ?? "synthetic";
  const tried = [];

  if (options.csv) {
    const rows = loadCsv(options.csv);
    return { rows, source: "csv", note: "", providersTried: ["csv"] };
  }

  if (mode !== "real") {
    return {
      rows: genSynthetic({ days: options.days, seed: options.seed }),
      source: "synthetic",
      note: "",
      providersTried: ["synthetic"]
    };
  }

  try {
    const rows = await loadYahoo({ years: options.years });
    if (isNonEmptyRows(rows)) {
      return { rows, source: "yahoo", note: "", providersTried: ["yahoo"] };
    }
    tried.push("yahoo:empty");
  } catch (error) {
    tried.push(`yahoo:error:${error.message}`);
  }

  if (options.backupCsv) {
    const backupPath = resolvedPath(options.backupCsv);
    if (fs.existsSync(backupPath)) {
      const backupRows = loadCsv(options.backupCsv);
      if (isNonEmptyRows(backupRows)) {
        return {
          rows: backupRows,
          source: "csv_backup",
          note: "yahoo unavailable, used backup csv",
          providersTried: [...tried, "csv_backup"]
        };
      }
      tried.push("csv_backup:empty");
    } else {
      tried.push("csv_backup:not_found");
    }
  }

  if (options.strictReal) {
    throw new Error(`real_data_unavailable (${tried.join(" | ")})`);
  }
  if (!options.realFallback) {
    throw new Error(`real_data_unavailable_and_fallback_disabled (${tried.join(" | ")})`);
  }

  return {
    rows: genSynthetic({ days: options.days, seed: options.seed }),
    source: "synthetic_fallback",
    note: `real_data_unavailable (${tried.join(" | ")})`,
    providersTried: [...tried, "synthetic_fallback"]
  };
}
