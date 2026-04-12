const INDICATOR_SPECS = [
  {
    key: "kospi200",
    label: "KOSPI200 Futures",
    weight: 0.34,
    direction: 1,
    patterns: [/KOSPI200/, /\bK200\b/, /\bKS200\b/, /\bKOSPI\b/]
  },
  {
    key: "kosdaq",
    label: "KOSDAQ Futures",
    weight: 0.14,
    direction: 1,
    patterns: [/KOSDAQ/]
  },
  {
    key: "nasdaq",
    label: "NASDAQ Futures",
    weight: 0.16,
    direction: 1,
    patterns: [/NASDAQ/, /\bNQ\b/]
  },
  {
    key: "sp500",
    label: "S&P500 Futures",
    weight: 0.14,
    direction: 1,
    patterns: [/\bS&P500\b/, /\bSP500\b/, /\bES\b/]
  },
  {
    key: "dow",
    label: "DOW Futures",
    weight: 0.1,
    direction: 1,
    patterns: [/\bDOW\b/, /\bDJI\b/, /DOWJONES/]
  },
  {
    key: "usdkrw",
    label: "USD/KRW",
    weight: 0.12,
    direction: -1,
    patterns: [/USDKRW/, /USD\/KRW/, /KRW/, /USDKRWFX/]
  }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function readSymbol(item) {
  return String(item?.symbol || item?.ticker || item?.name || "").trim().toUpperCase();
}

function readChangePercent(item) {
  const primary = toNumber(item?.changePercent);
  if (Number.isFinite(primary)) return primary;
  const secondary = toNumber(item?.changeRate);
  if (Number.isFinite(secondary)) return secondary;
  return Number.NaN;
}

function resolveIndicatorSpec(symbol) {
  return INDICATOR_SPECS.find((spec) => spec.patterns.some((pattern) => pattern.test(symbol)));
}

function toSign(value, deadzone = 0.03) {
  if (!Number.isFinite(value)) return 0;
  if (value > deadzone) return 1;
  if (value < -deadzone) return -1;
  return 0;
}

function classifyTone(score) {
  if (score >= 0.55) return { label: "STRONG BULLISH", tone: "up", summary: "Strong upside bias for cash session open." };
  if (score >= 0.2) return { label: "BULLISH", tone: "up", summary: "Mild upside bias for cash session open." };
  if (score > -0.2) return { label: "NEUTRAL", tone: "neutral", summary: "Mixed futures signal. Open likely near flat." };
  if (score > -0.55) return { label: "BEARISH", tone: "down", summary: "Mild downside bias for cash session open." };
  return { label: "STRONG BEARISH", tone: "down", summary: "Strong downside bias for cash session open." };
}

function normalizeSignal(changePercent) {
  return clamp(changePercent / 1.2, -1, 1);
}

export function computeMainSessionOutlook(futures, options = {}) {
  const weightMap = options.weightMap || {};
  if (!Array.isArray(futures) || futures.length === 0) {
    return {
      available: false,
      reason: "NO_FUTURES",
      label: "UNAVAILABLE",
      tone: "neutral",
      confidence: 0,
      coverage: 0,
      expectedOpenMovePct: 0,
      score: 0,
      factors: []
    };
  }

  const grouped = new Map();
  futures.forEach((item) => {
    const symbol = readSymbol(item);
    const changePercent = readChangePercent(item);
    if (!symbol || !Number.isFinite(changePercent)) return;
    const spec = resolveIndicatorSpec(symbol);
    if (!spec) return;
    if (!grouped.has(spec.key)) grouped.set(spec.key, []);
    grouped.get(spec.key).push({ symbol, changePercent });
  });

  if (!grouped.size) {
    return {
      available: false,
      reason: "NO_MATCHED_INDICATORS",
      label: "UNAVAILABLE",
      tone: "neutral",
      confidence: 0,
      coverage: 0,
      expectedOpenMovePct: 0,
      score: 0,
      factors: []
    };
  }

  const factors = [];
  let weightedContributionSum = 0;
  let matchedWeight = 0;

  INDICATOR_SPECS.forEach((spec) => {
    const rows = grouped.get(spec.key);
    if (!rows?.length) return;
    const avgChangePercent = rows.reduce((acc, row) => acc + row.changePercent, 0) / rows.length;
    const multiplier = clamp(toNumber(weightMap[spec.key]) || 1, 0.5, 1.8);
    const effectiveWeight = spec.weight * multiplier;
    const normalized = normalizeSignal(avgChangePercent) * spec.direction;
    const contribution = normalized * effectiveWeight;

    weightedContributionSum += contribution;
    matchedWeight += effectiveWeight;

    factors.push({
      key: spec.key,
      label: spec.label,
      symbol: rows[0].symbol,
      baseWeight: spec.weight,
      weight: Number(effectiveWeight.toFixed(4)),
      changePercent: Number(avgChangePercent.toFixed(3)),
      contribution: Number(contribution.toFixed(4))
    });
  });

  const score = matchedWeight > 0 ? weightedContributionSum / matchedWeight : 0;
  const coverage = clamp(matchedWeight, 0, 1);
  const confidenceValue = clamp(Math.abs(score) * 0.72 + coverage * 0.28, 0, 0.99);
  const confidence = Math.round(confidenceValue * 100);
  const expectedOpenMovePct = Number(clamp(score * 1.1, -2.5, 2.5).toFixed(2));
  const tone = classifyTone(score);
  const topFactors = [...factors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  return {
    available: true,
    reason: "",
    label: tone.label,
    tone: tone.tone,
    summary: tone.summary,
    confidence,
    coverage: Math.round(coverage * 100),
    expectedOpenMovePct,
    score: Number(score.toFixed(4)),
    factors,
    topFactors
  };
}

export function buildAdaptiveWeightMap(predictionLogs, minSamples = 10) {
  const logs = Array.isArray(predictionLogs) ? predictionLogs : [];
  const grouped = new Map();

  logs.forEach((entry) => {
    const actualMovePct = toNumber(entry?.actualMovePct);
    if (!Number.isFinite(actualMovePct)) return;
    const factors = Array.isArray(entry?.factors) ? entry.factors : [];
    if (!factors.length) return;

    factors.forEach((factor) => {
      const key = String(factor?.key || "");
      const contribution = toNumber(factor?.contribution);
      if (!key || !Number.isFinite(contribution)) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ contribution, actualMovePct });
    });
  });

  const map = {};
  INDICATOR_SPECS.forEach((spec) => {
    const samples = grouped.get(spec.key) || [];
    if (samples.length < minSamples) {
      map[spec.key] = 1;
      return;
    }

    let directionalWins = 0;
    let considered = 0;

    samples.forEach((sample) => {
      const predictedSign = toSign(sample.contribution);
      const actualSign = toSign(sample.actualMovePct);
      if (predictedSign === 0 || actualSign === 0) return;
      considered += 1;
      if (predictedSign === actualSign) directionalWins += 1;
    });

    if (considered < Math.ceil(minSamples * 0.7)) {
      map[spec.key] = 1;
      return;
    }

    const hitRate = directionalWins / considered;
    const multiplier = 1 + (hitRate - 0.5) * 0.8;
    map[spec.key] = Number(clamp(multiplier, 0.7, 1.4).toFixed(3));
  });

  return map;
}

export function getIndicatorSpecKeys() {
  return INDICATOR_SPECS.map((spec) => spec.key);
}
