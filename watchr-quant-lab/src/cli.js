import { runBacktest } from "./core/backtest.js";
import { runWalkForward } from "./core/walkforward.js";
import { DEFAULT_WEIGHTS } from "./core/model.js";
import { generateSyntheticRows } from "./data/synthetic.js";
import { loadRowsWithPolicy } from "./data/policy.js";
import { analyzeRowsQuality } from "./utils/dataQuality.js";
import { topTradeRows, writeReport } from "./utils/report.js";

function parseBool(value) {
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function parseWeekdays(input) {
  if (!input) return [];
  return String(input)
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v >= 0 && v <= 6);
}

function parseArgs(argv) {
  const options = {
    mode: "synthetic",
    days: 756,
    years: 5,
    seed: 42,
    threshold: 12,
    feeBps: 2,
    slippageBps: 1,
    taxBps: 0,
    shortCarryBps: 4,
    riskScale: 0.65,
    maxExposure: 0.6,
    minExposure: 0.05,
    blockWeekdays: "",
    blockHighVolPct: null,
    maxLossGuardPct: null,
    cooldownDaysAfterLoss: 1,
    out: "reports/latest-report.json",
    csv: "",
    backupCsv: "",
    stressRuns: 30,
    realFallback: true,
    strictReal: false,
    walkForward: true,
    wfTrainDays: 252,
    wfTestDays: 63,
    wfStepDays: 63
  };

  argv.forEach((item) => {
    if (!item.startsWith("--")) return;
    const [key, rawValue = "true"] = item.slice(2).split("=");
    if (!(key in options)) return;

    const current = options[key];
    if (current === null) {
      options[key] = rawValue === "null" ? null : Number(rawValue);
      return;
    }
    if (typeof current === "number") {
      options[key] = Number(rawValue);
      return;
    }
    if (typeof current === "boolean") {
      options[key] = parseBool(rawValue);
      return;
    }
    options[key] = rawValue;
  });
  return options;
}

function toNumericSeed(baseSeed, index) {
  const base = Number(baseSeed);
  if (Number.isFinite(base)) return base + index * 17;
  return `${baseSeed}_${index}`;
}

function summarizeStress(resultList) {
  if (resultList.length === 0) return null;
  const totals = resultList.map((r) => r.summary.totalReturnPct).sort((a, b) => a - b);
  const mdds = resultList.map((r) => r.summary.maxDrawdownPct).sort((a, b) => a - b);

  const at = (arr, pct) => arr[Math.max(0, Math.min(arr.length - 1, Math.floor(arr.length * pct)))];
  const meanTotal = totals.reduce((sum, v) => sum + v, 0) / totals.length;
  const meanMdd = mdds.reduce((sum, v) => sum + v, 0) / mdds.length;

  return {
    runs: resultList.length,
    meanTotalReturnPct: Number(meanTotal.toFixed(2)),
    medianTotalReturnPct: Number(at(totals, 0.5).toFixed(2)),
    p10TotalReturnPct: Number(at(totals, 0.1).toFixed(2)),
    p90TotalReturnPct: Number(at(totals, 0.9).toFixed(2)),
    meanMaxDrawdownPct: Number(meanMdd.toFixed(2)),
    worstMaxDrawdownPct: Number(at(mdds, 0).toFixed(2))
  };
}

function printSummary(summary) {
  console.log("");
  console.log("=== WATCHR Quant Lab Report ===");
  console.log(`Days: ${summary.days}`);
  console.log(`Entries: ${summary.entries}`);
  console.log(`Active Days: ${summary.activeDays}`);
  console.log(`Total Return: ${summary.totalReturnPct}%`);
  console.log(`Max Drawdown: ${summary.maxDrawdownPct}%`);
  console.log(`Win Rate: ${summary.winRatePct}%`);
  console.log(`Sharpe-like: ${summary.sharpeLike}`);
  console.log(`Final Equity: ${summary.finalEquity}`);
  console.log(`Total Costs: ${summary.totalCostPct}%`);
}

function printTopMoves(rows) {
  console.log("");
  console.log("Top Impact Days:");
  rows.forEach((row) => {
    console.log(
      `- ${row.date} | signal=${row.signal} score=${row.score} net=${row.netReturnPct}% cost=${row.costPct}% equity=${row.equity}`
    );
  });
}

function printWalkForward(summary) {
  if (!summary) return;
  console.log("");
  console.log(
    `WalkForward: folds=${summary.folds} meanOOS=${summary.meanOosReturnPct}% medianOOS=${summary.medianOosReturnPct}% compoundedOOS=${summary.compoundedOosReturnPct}% meanSharpe=${summary.meanOosSharpeLike}`
  );
}

function buildBaseParams(options) {
  return {
    weights: DEFAULT_WEIGHTS,
    threshold: options.threshold,
    feeBps: options.feeBps,
    slippageBps: options.slippageBps,
    taxBps: options.taxBps,
    shortCarryBps: options.shortCarryBps,
    riskScale: options.riskScale,
    maxExposure: options.maxExposure,
    minExposure: options.minExposure,
    blockedWeekdays: parseWeekdays(options.blockWeekdays),
    blockHighVolPct: options.blockHighVolPct,
    maxLossGuardPct: options.maxLossGuardPct,
    cooldownDaysAfterLoss: options.cooldownDaysAfterLoss
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const loaded = await loadRowsWithPolicy(options);
  const rows = loaded.rows;

  if (rows.length === 0) {
    throw new Error("No input rows available");
  }

  const quality = analyzeRowsQuality(rows);
  const baseParams = buildBaseParams(options);
  const result = runBacktest(rows, baseParams);

  let stressSummary = null;
  if (loaded.source === "synthetic" && options.stressRuns > 1) {
    const stressResults = [];
    for (let i = 0; i < options.stressRuns; i += 1) {
      const runSeed = toNumericSeed(options.seed, i + 1);
      const runRows = generateSyntheticRows({ days: options.days, seed: runSeed });
      stressResults.push(runBacktest(runRows, baseParams));
    }
    stressSummary = summarizeStress(stressResults);
  }

  let walkForward = null;
  if (options.walkForward) {
    walkForward = runWalkForward(rows, {
      ...baseParams,
      trainDays: options.wfTrainDays,
      testDays: options.wfTestDays,
      stepDays: options.wfStepDays
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: loaded.source,
    providersTried: loaded.providersTried ?? [],
    note: loaded.note ?? "",
    dataQuality: quality,
    options,
    summary: result.summary,
    stressSummary,
    walkForward: walkForward?.summary ?? null,
    topImpactDays: topTradeRows(result.trades, 8)
  };

  const saved = writeReport(options.out, report);
  printSummary(result.summary);
  printTopMoves(report.topImpactDays.slice(0, 5));
  if (stressSummary) {
    console.log("");
    console.log(
      `Stress(${stressSummary.runs}): mean=${stressSummary.meanTotalReturnPct}% median=${stressSummary.medianTotalReturnPct}% p10=${stressSummary.p10TotalReturnPct}% worstMDD=${stressSummary.worstMaxDrawdownPct}%`
    );
  }
  if (walkForward?.summary) {
    printWalkForward(walkForward.summary);
  } else if (walkForward?.reason && walkForward.reason !== "ok") {
    console.log("");
    console.log(`WalkForward skipped: ${walkForward.reason}`);
  }
  console.log("");
  console.log(`Source: ${loaded.source}`);
  console.log(`DataRows: ${quality.rows} (${quality.startDate} ~ ${quality.endDate})`);
  console.log(`ProvidersTried: ${(loaded.providersTried ?? []).join(" -> ")}`);
  if (loaded.note) {
    console.log(`Note: ${loaded.note}`);
  }
  console.log(`Report saved: ${saved}`);
}

main();
