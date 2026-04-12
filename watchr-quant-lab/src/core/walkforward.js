import { runBacktest } from "./backtest.js";
import { DEFAULT_WEIGHTS } from "./model.js";

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function scoreSummary(summary) {
  return (
    summary.totalReturnPct +
    summary.sharpeLike * 6 +
    summary.maxDrawdownPct * 1.2 +
    summary.winRatePct * 0.1
  );
}

function buildGrid(baseOptions = {}) {
  const thresholdList = baseOptions.thresholdGrid ?? [8, 10, 12, 14, 16];
  const riskScaleList = baseOptions.riskScaleGrid ?? [0.45, 0.65, 0.85];
  const maxExposureList = baseOptions.maxExposureGrid ?? [0.4, 0.6, 0.8];
  const feeBps = baseOptions.feeBps ?? 2;
  const slippageBps = baseOptions.slippageBps ?? 1;
  const taxBps = baseOptions.taxBps ?? 0;
  const shortCarryBps = baseOptions.shortCarryBps ?? 4;
  const minExposure = baseOptions.minExposure ?? 0.05;
  const blockedWeekdays = baseOptions.blockedWeekdays ?? [];
  const blockHighVolPct = baseOptions.blockHighVolPct ?? null;
  const maxLossGuardPct = baseOptions.maxLossGuardPct ?? null;
  const cooldownDaysAfterLoss = baseOptions.cooldownDaysAfterLoss ?? 1;

  const grid = [];
  thresholdList.forEach((threshold) => {
    riskScaleList.forEach((riskScale) => {
      maxExposureList.forEach((maxExposure) => {
        grid.push({
          weights: DEFAULT_WEIGHTS,
          threshold,
          riskScale,
          maxExposure,
          minExposure,
          feeBps,
          slippageBps,
          taxBps,
          shortCarryBps,
          blockedWeekdays,
          blockHighVolPct,
          maxLossGuardPct,
          cooldownDaysAfterLoss
        });
      });
    });
  });
  return grid;
}

function pickBestParams(trainRows, grid) {
  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const params of grid) {
    const train = runBacktest(trainRows, params);
    const score = scoreSummary(train.summary);
    if (score > bestScore) {
      bestScore = score;
      best = {
        params,
        score,
        trainSummary: train.summary
      };
    }
  }
  return best;
}

export function runWalkForward(rows, options = {}) {
  const trainDays = options.trainDays ?? 252;
  const testDays = options.testDays ?? 63;
  const stepDays = options.stepDays ?? testDays;
  const grid = buildGrid(options);
  const folds = [];

  if (rows.length < trainDays + testDays) {
    return {
      summary: null,
      folds: [],
      reason: "insufficient_rows"
    };
  }

  for (let start = 0; start + trainDays + testDays <= rows.length; start += stepDays) {
    const trainRows = rows.slice(start, start + trainDays);
    const testRows = rows.slice(start + trainDays, start + trainDays + testDays);
    const best = pickBestParams(trainRows, grid);
    const testResult = runBacktest(testRows, best.params);

    folds.push({
      trainStart: trainRows[0]?.date,
      trainEnd: trainRows[trainRows.length - 1]?.date,
      testStart: testRows[0]?.date,
      testEnd: testRows[testRows.length - 1]?.date,
      params: best.params,
      trainSummary: best.trainSummary,
      testSummary: testResult.summary
    });
  }

  if (!folds.length) {
    return {
      summary: null,
      folds: [],
      reason: "no_fold_generated"
    };
  }

  const oosReturns = folds.map((f) => f.testSummary.totalReturnPct);
  const oosSharpe = folds.map((f) => f.testSummary.sharpeLike);
  const oosMdd = folds.map((f) => f.testSummary.maxDrawdownPct);
  const oosWinRate = folds.map((f) => f.testSummary.winRatePct);
  const compoundedEquity = folds.reduce((eq, f) => eq * f.testSummary.finalEquity, 1);

  return {
    summary: {
      folds: folds.length,
      meanOosReturnPct: Number(mean(oosReturns).toFixed(2)),
      medianOosReturnPct: Number(
        [...oosReturns].sort((a, b) => a - b)[Math.floor(oosReturns.length / 2)].toFixed(2)
      ),
      meanOosSharpeLike: Number(mean(oosSharpe).toFixed(2)),
      meanOosMddPct: Number(mean(oosMdd).toFixed(2)),
      meanOosWinRatePct: Number(mean(oosWinRate).toFixed(2)),
      compoundedOosReturnPct: Number(((compoundedEquity - 1) * 100).toFixed(2))
    },
    folds,
    reason: "ok"
  };
}
