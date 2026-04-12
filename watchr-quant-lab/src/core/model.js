export const DEFAULT_WEIGHTS = {
  nq: 0.3,
  sp: 0.25,
  dow: 0.1,
  k200: 0.2,
  kosdaq: 0.1,
  usdkrw: 0.05
};

export const DIRECTIONS = {
  nq: 1,
  sp: 1,
  dow: 1,
  k200: 1,
  kosdaq: 1,
  usdkrw: -1
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreToBias(score) {
  if (score >= 35) return "strong_bullish";
  if (score >= 12) return "bullish";
  if (score <= -35) return "strong_bearish";
  if (score <= -12) return "bearish";
  return "neutral";
}

export function computePrediction(factors, weights = DEFAULT_WEIGHTS, scale = 22) {
  const keys = Object.keys(DEFAULT_WEIGHTS);
  let weighted = 0;
  let totalWeight = 0;

  for (const key of keys) {
    const weight = Number(weights[key] ?? 0);
    const factor = Number(factors[key] ?? 0);
    const direction = Number(DIRECTIONS[key] ?? 1);
    weighted += factor * direction * weight;
    totalWeight += weight;
  }

  const normalized = totalWeight > 0 ? weighted / totalWeight : 0;
  const score = clamp(normalized * scale, -100, 100);
  const confidence = clamp(25 + Math.abs(score) * 0.7, 20, 98);

  return {
    score,
    bias: scoreToBias(score),
    confidence
  };
}

export function scoreToSignal(score, threshold = 12) {
  if (score >= threshold) return "long";
  if (score <= -threshold) return "short";
  return "flat";
}
