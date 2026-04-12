import { computePrediction, DEFAULT_WEIGHTS, scoreToSignal } from "./model.js";
import { computeMaxDrawdownPct, computeSharpeLike } from "./metrics.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function exposureFromScore(score, riskScale, maxExposure, minExposure) {
  const base = (Math.abs(score) / 100) * riskScale;
  return clamp(base, minExposure, maxExposure);
}

export function runBacktest(rows, options = {}) {
  const {
    weights = DEFAULT_WEIGHTS,
    threshold = 12,
    riskScale = 0.65,
    maxExposure = 0.6,
    minExposure = 0.05,
    feeBps = 2
  } = options;

  let equity = 1;
  let position = 0;
  let wins = 0;
  let activeDays = 0;
  let entries = 0;
  const equityCurve = [equity];
  const dailyReturns = [];
  const trades = [];

  for (const row of rows) {
    const prediction = computePrediction(row.factors, weights);
    const signal = scoreToSignal(prediction.score, threshold);
    const targetPosition =
      signal === "flat"
        ? 0
        : (signal === "long" ? 1 : -1) *
          exposureFromScore(prediction.score, riskScale, maxExposure, minExposure);

    const turnover = Math.abs(targetPosition - position);
    const fee = (turnover * feeBps) / 10000;
    const marketReturn = Number(row.openReturnPct || 0) / 100;
    const grossReturn = targetPosition * marketReturn;
    const netReturn = grossReturn - fee;

    if (targetPosition !== 0) {
      activeDays += 1;
      if (targetPosition * marketReturn > 0) wins += 1;
    }
    if (turnover > 0 && targetPosition !== position) entries += 1;

    equity *= 1 + netReturn;
    position = targetPosition;
    equityCurve.push(equity);
    dailyReturns.push(netReturn);

    trades.push({
      date: row.date,
      score: Number(prediction.score.toFixed(2)),
      signal,
      position: Number(targetPosition.toFixed(4)),
      marketReturnPct: Number((marketReturn * 100).toFixed(3)),
      netReturnPct: Number((netReturn * 100).toFixed(3)),
      equity: Number(equity.toFixed(6))
    });
  }

  const totalReturnPct = (equity - 1) * 100;
  const maxDrawdownPct = computeMaxDrawdownPct(equityCurve);
  const sharpeLike = computeSharpeLike(dailyReturns);
  const winRatePct = activeDays > 0 ? (wins / activeDays) * 100 : 0;
  const averageDailyReturnPct =
    dailyReturns.length > 0
      ? (dailyReturns.reduce((sum, v) => sum + v, 0) / dailyReturns.length) * 100
      : 0;

  return {
    summary: {
      days: rows.length,
      entries,
      activeDays,
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
      sharpeLike: Number(sharpeLike.toFixed(2)),
      winRatePct: Number(winRatePct.toFixed(2)),
      averageDailyReturnPct: Number(averageDailyReturnPct.toFixed(3)),
      finalEquity: Number(equity.toFixed(6))
    },
    trades
  };
}
