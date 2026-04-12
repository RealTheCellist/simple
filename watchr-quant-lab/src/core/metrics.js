function safeDivide(a, b, fallback = 0) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return fallback;
  return a / b;
}

export function computeMaxDrawdownPct(equityCurve) {
  let peak = Number.NEGATIVE_INFINITY;
  let maxDrawdown = 0;

  for (const value of equityCurve) {
    if (value > peak) peak = value;
    const drawdown = peak > 0 ? ((value - peak) / peak) * 100 : 0;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}

export function computeSharpeLike(dailyReturns) {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((sum, v) => sum + v, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (dailyReturns.length - 1);
  const stdDev = Math.sqrt(Math.max(variance, 0));
  return safeDivide(mean, stdDev, 0) * Math.sqrt(252);
}

export function toPct(value, digits = 2) {
  return Number((value * 100).toFixed(digits));
}
