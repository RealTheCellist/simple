const FACTORS = [
  { key: "nq", weight: 0.3, direction: 1, patterns: [/NASDAQ|NQ/i] },
  { key: "sp", weight: 0.25, direction: 1, patterns: [/S&P|SP500|ES/i] },
  { key: "dow", weight: 0.1, direction: 1, patterns: [/DOW|DJI|YM/i] },
  { key: "k200", weight: 0.2, direction: 1, patterns: [/KOSPI200|K200|KS200/i] },
  { key: "kosdaq", weight: 0.1, direction: 1, patterns: [/KOSDAQ/i] },
  { key: "usdkrw", weight: 0.05, direction: -1, patterns: [/USD.?KRW|USDKRW|KRW=X/i] }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function findRow(rows, factor) {
  return rows.find((row) => factor.patterns.some((pattern) => pattern.test(`${row.symbol} ${row.name}`)));
}

function classify(score) {
  if (score >= 35) return "strong_bullish";
  if (score >= 12) return "bullish";
  if (score <= -35) return "strong_bearish";
  if (score <= -12) return "bearish";
  return "neutral";
}

function headline(bias) {
  if (bias === "strong_bullish") return "갭상승 시나리오 우위";
  if (bias === "bullish") return "상승 출발 확률 우위";
  if (bias === "strong_bearish") return "갭하락 리스크 우위";
  if (bias === "bearish") return "하락 출발 가능성 우위";
  return "중립권, 시초가 확인 필요";
}

export function predictOpenFromFutures(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const totalWeight = FACTORS.reduce((sum, factor) => sum + factor.weight, 0);
  const contributors = [];
  let matchedWeight = 0;
  let weightedRate = 0;

  for (const factor of FACTORS) {
    const row = findRow(rows, factor);
    if (!row) continue;
    const rate = clamp(Number(row.changeRate) || 0, -4, 4);
    const contribution = rate * factor.direction * factor.weight;

    matchedWeight += factor.weight;
    weightedRate += contribution;
    contributors.push({
      key: factor.key,
      changeRate: rate,
      contributionScore: contribution * 22
    });
  }

  if (!matchedWeight) {
    return {
      score: 0,
      confidence: 20,
      coverage: 0,
      bias: "neutral",
      headline: "데이터 부족, 중립 시나리오",
      contributors: []
    };
  }

  const normalizedRate = weightedRate / matchedWeight;
  const score = clamp(normalizedRate * 22, -100, 100);
  const coverage = clamp(matchedWeight / totalWeight, 0, 1);
  const confidence = clamp(28 + Math.abs(score) * 0.55 + coverage * 20, 20, 96);
  const bias = classify(score);

  return {
    score,
    confidence,
    coverage,
    bias,
    headline: headline(bias),
    contributors: contributors.sort((a, b) => Math.abs(b.contributionScore) - Math.abs(a.contributionScore))
  };
}
