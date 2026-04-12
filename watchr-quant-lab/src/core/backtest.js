import { computePrediction, DEFAULT_WEIGHTS, scoreToSignal } from "./model.js";
import { computeMaxDrawdownPct, computeSharpeLike } from "./metrics.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function exposureFromScore(score, riskScale, maxExposure, minExposure) {
  const base = (Math.abs(score) / 100) * riskScale;
  return clamp(base, minExposure, maxExposure);
}

function toDateWeekday(dateLabel) {
  const day = new Date(`${dateLabel}T00:00:00Z`).getUTCDay();
  return Number.isFinite(day) ? day : 0;
}

function parseBlockedWeekdays(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v >= 0 && v <= 6))];
}

export function runBacktest(rows, options = {}) {
  const {
    weights = DEFAULT_WEIGHTS,
    threshold = 12,
    riskScale = 0.65,
    maxExposure = 0.6,
    minExposure = 0.05,
    feeBps = 2,
    slippageBps = 1,
    taxBps = 0,
    shortCarryBps = 4,
    blockedWeekdays = [],
    blockHighVolPct = null,
    maxLossGuardPct = null,
    cooldownDaysAfterLoss = 1
  } = options;

  let equity = 1;
  let position = 0;
  let wins = 0;
  let activeDays = 0;
  let entries = 0;
  let cooldownLeft = 0;
  let blockedByWeekdayCount = 0;
  let blockedByVolCount = 0;
  let blockedByCooldownCount = 0;
  let guardTriggeredCount = 0;
  let totalFeeCostPct = 0;
  let totalSlippageCostPct = 0;
  let totalTaxCostPct = 0;
  let totalCarryCostPct = 0;

  const blockedDays = parseBlockedWeekdays(blockedWeekdays);
  const equityCurve = [equity];
  const dailyReturns = [];
  const trades = [];

  for (const row of rows) {
    const prediction = computePrediction(row.factors, weights);
    const baseSignal = scoreToSignal(prediction.score, threshold);
    const marketReturn = Number(row.openReturnPct || 0) / 100;
    const weekday = toDateWeekday(row.date);
    const blockedByWeekday = blockedDays.includes(weekday);
    const blockedByVol =
      Number.isFinite(blockHighVolPct) && blockHighVolPct !== null
        ? Math.abs(marketReturn * 100) >= Number(blockHighVolPct)
        : false;
    const blockedByCooldown = cooldownLeft > 0;

    let signal = baseSignal;
    if (blockedByWeekday || blockedByVol || blockedByCooldown) signal = "flat";

    const targetPosition =
      signal === "flat"
        ? 0
        : (signal === "long" ? 1 : -1) *
          exposureFromScore(prediction.score, riskScale, maxExposure, minExposure);

    const turnover = Math.abs(targetPosition - position);
    const feeCost = (turnover * feeBps) / 10000;
    const slippageCost = (turnover * slippageBps) / 10000;
    const longReduction = Math.max(0, Math.max(position, 0) - Math.max(targetPosition, 0));
    const taxCost = (longReduction * taxBps) / 10000;
    const carryCost = targetPosition < 0 ? (Math.abs(targetPosition) * shortCarryBps) / 10000 / 252 : 0;
    const grossReturn = targetPosition * marketReturn;
    const netReturn = grossReturn - feeCost - slippageCost - taxCost - carryCost;

    totalFeeCostPct += feeCost * 100;
    totalSlippageCostPct += slippageCost * 100;
    totalTaxCostPct += taxCost * 100;
    totalCarryCostPct += carryCost * 100;

    if (targetPosition !== 0) {
      activeDays += 1;
      if (targetPosition * marketReturn > 0) wins += 1;
    }
    if (turnover > 0 && targetPosition !== position) entries += 1;

    if (blockedByWeekday) blockedByWeekdayCount += 1;
    if (blockedByVol) blockedByVolCount += 1;
    if (blockedByCooldown) blockedByCooldownCount += 1;

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
      costPct: Number(((feeCost + slippageCost + taxCost + carryCost) * 100).toFixed(4)),
      equity: Number(equity.toFixed(6))
    });

    if (blockedByCooldown && cooldownLeft > 0) {
      cooldownLeft -= 1;
    }
    if (
      Number.isFinite(maxLossGuardPct) &&
      maxLossGuardPct !== null &&
      netReturn * 100 <= -Math.abs(Number(maxLossGuardPct))
    ) {
      cooldownLeft = Math.max(0, Number(cooldownDaysAfterLoss) || 0);
      guardTriggeredCount += 1;
    }
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
      finalEquity: Number(equity.toFixed(6)),
      totalCostPct: Number(
        (totalFeeCostPct + totalSlippageCostPct + totalTaxCostPct + totalCarryCostPct).toFixed(3)
      ),
      costBreakdownPct: {
        fee: Number(totalFeeCostPct.toFixed(3)),
        slippage: Number(totalSlippageCostPct.toFixed(3)),
        tax: Number(totalTaxCostPct.toFixed(3)),
        shortCarry: Number(totalCarryCostPct.toFixed(3))
      },
      blockedDays: {
        weekday: blockedByWeekdayCount,
        highVol: blockedByVolCount,
        cooldown: blockedByCooldownCount
      },
      guardTriggeredCount
    },
    trades
  };
}
