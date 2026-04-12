export const FACTOR_META = [
  { key: "nq", label: "NASDAQ", direction: 1, patterns: [/NASDAQ|NQ/i], defaultWeight: 0.3 },
  { key: "sp", label: "S&P500", direction: 1, patterns: [/S&P|SP500|ES/i], defaultWeight: 0.25 },
  { key: "dow", label: "DOW", direction: 1, patterns: [/DOW|DJI|YM/i], defaultWeight: 0.1 },
  { key: "k200", label: "KOSPI200", direction: 1, patterns: [/KOSPI200|K200/i], defaultWeight: 0.2 },
  { key: "kosdaq", label: "KOSDAQ", direction: 1, patterns: [/KOSDAQ/i], defaultWeight: 0.1 },
  { key: "usdkrw", label: "USD/KRW", direction: -1, patterns: [/USD.?KRW|KRW=X/i], defaultWeight: 0.05 }
];

export function defaultWeights() {
  return Object.fromEntries(FACTOR_META.map((item) => [item.key, item.defaultWeight]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function factorRow(futures, meta) {
  return futures.find((row) => meta.patterns.some((pattern) => pattern.test(`${row.symbol} ${row.name}`)));
}

export function scoreWithWeights(futures, weights) {
  const matched = [];
  const totalWeight = FACTOR_META.reduce((sum, item) => sum + Number(weights[item.key] || 0), 0);
  let weighted = 0;
  let usedWeight = 0;

  FACTOR_META.forEach((meta) => {
    const row = factorRow(futures, meta);
    if (!row) return;
    const weight = Number(weights[meta.key] || 0);
    if (weight <= 0) return;
    const boundedRate = clamp(Number(row.changeRate || 0), -4, 4);
    const contribution = boundedRate * meta.direction * weight;
    usedWeight += weight;
    weighted += contribution;
    matched.push({
      key: meta.key,
      label: meta.label,
      changeRate: boundedRate,
      contribution
    });
  });

  const normalized = usedWeight > 0 ? weighted / usedWeight : 0;
  const score = clamp(normalized * 22, -100, 100);
  const bias = score > 12 ? "bullish" : score < -12 ? "bearish" : "neutral";
  const coverage = totalWeight > 0 ? usedWeight / totalWeight : 0;
  return { score, bias, coverage, matched };
}
