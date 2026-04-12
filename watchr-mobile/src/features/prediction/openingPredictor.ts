import type { FuturesData } from "../../api/client";

type Factor = {
  key: string;
  label: string;
  weight: number;
  direction: 1 | -1;
  patterns: RegExp[];
};

export type OpenPredictionBias =
  | "strong_bullish"
  | "bullish"
  | "neutral"
  | "bearish"
  | "strong_bearish";

export type OpenPredictionContributor = {
  key: string;
  label: string;
  changeRate: number;
  contributionScore: number;
};

export type OpenPrediction = {
  score: number;
  confidence: number;
  coverage: number;
  bias: OpenPredictionBias;
  headline: string;
  contributors: OpenPredictionContributor[];
};

const FACTORS: Factor[] = [
  { key: "nq", label: "NASDAQ 선물", weight: 0.3, direction: 1, patterns: [/NASDAQ|NQ|나스닥/i] },
  { key: "spx", label: "S&P500 선물", weight: 0.25, direction: 1, patterns: [/S&P|SP500|ES/i] },
  { key: "dow", label: "DOW 선물", weight: 0.1, direction: 1, patterns: [/DOW|DJI|YM/i] },
  { key: "k200", label: "KOSPI200 선물", weight: 0.2, direction: 1, patterns: [/KOSPI200|K200|KS200/i] },
  { key: "kosdaq", label: "KOSDAQ", weight: 0.1, direction: 1, patterns: [/KOSDAQ/i] },
  { key: "usdkrw", label: "USD/KRW", weight: 0.05, direction: -1, patterns: [/USD.?KRW|USDKRW/i] }
];

const MAX_RATE = 4;
const SCORE_MULTIPLIER = 22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function findFactorRow(rows: FuturesData[], factor: Factor) {
  return rows.find((row) =>
    factor.patterns.some((pattern) => pattern.test(`${row.symbol} ${row.name}`))
  );
}

function resolveBias(score: number): OpenPredictionBias {
  if (score >= 35) return "strong_bullish";
  if (score >= 12) return "bullish";
  if (score <= -35) return "strong_bearish";
  if (score <= -12) return "bearish";
  return "neutral";
}

function resolveHeadline(bias: OpenPredictionBias) {
  switch (bias) {
    case "strong_bullish":
      return "갭상승 시나리오 우위";
    case "bullish":
      return "상승 출발 확률 우위";
    case "strong_bearish":
      return "갭하락 리스크 우위";
    case "bearish":
      return "하락 출발 가능성 우위";
    default:
      return "중립권, 시초가 확인 필요";
  }
}

export function predictOpenFromFutures(rows: FuturesData[]): OpenPrediction | null {
  if (!rows.length) return null;

  const totalWeight = FACTORS.reduce((sum, factor) => sum + factor.weight, 0);
  const contributors: OpenPredictionContributor[] = [];
  let weightedRate = 0;
  let matchedWeight = 0;

  for (const factor of FACTORS) {
    const row = findFactorRow(rows, factor);
    if (!row) continue;

    const boundedRate = clamp(row.changeRate, -MAX_RATE, MAX_RATE);
    const directionalRate = boundedRate * factor.direction;
    const weightedContribution = directionalRate * factor.weight;

    weightedRate += weightedContribution;
    matchedWeight += factor.weight;
    contributors.push({
      key: factor.key,
      label: factor.label,
      changeRate: boundedRate,
      contributionScore: weightedContribution * SCORE_MULTIPLIER
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
  const score = clamp(normalizedRate * SCORE_MULTIPLIER, -100, 100);
  const coverage = clamp(matchedWeight / totalWeight, 0, 1);
  const confidence = clamp(28 + Math.abs(score) * 0.55 + coverage * 20, 20, 96);
  const bias = resolveBias(score);

  return {
    score,
    confidence,
    coverage,
    bias,
    headline: resolveHeadline(bias),
    contributors: contributors
      .sort((a, b) => Math.abs(b.contributionScore) - Math.abs(a.contributionScore))
      .slice(0, 3)
  };
}
