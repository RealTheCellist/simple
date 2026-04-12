import assert from "node:assert/strict";
import { buildAdaptiveWeightMap, computeMainSessionOutlook } from "./prediction.js";

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest("returns unavailable when futures input is empty", () => {
  const outlook = computeMainSessionOutlook([]);
  assert.equal(outlook.available, false);
  assert.equal(outlook.label, "UNAVAILABLE");
});

runTest("bullish mix returns positive score and up tone", () => {
  const futures = [
    { symbol: "KOSPI200", changePercent: 0.9 },
    { symbol: "NASDAQ", changePercent: 0.8 },
    { symbol: "S&P500", changePercent: 0.5 },
    { symbol: "DOW", changePercent: 0.4 },
    { symbol: "USDKRW", changePercent: -0.3 }
  ];
  const outlook = computeMainSessionOutlook(futures);
  assert.equal(outlook.available, true);
  assert.equal(outlook.tone, "up");
  assert.ok(outlook.score > 0);
  assert.ok(outlook.expectedOpenMovePct > 0);
});

runTest("bearish mix returns negative score and down tone", () => {
  const futures = [
    { symbol: "KOSPI200", changePercent: -0.8 },
    { symbol: "NASDAQ", changePercent: -0.9 },
    { symbol: "S&P500", changePercent: -0.6 },
    { symbol: "USDKRW", changePercent: 0.7 }
  ];
  const outlook = computeMainSessionOutlook(futures);
  assert.equal(outlook.available, true);
  assert.equal(outlook.tone, "down");
  assert.ok(outlook.score < 0);
  assert.ok(outlook.expectedOpenMovePct < 0);
});

runTest("confidence drops with low indicator coverage", () => {
  const fullCoverage = computeMainSessionOutlook([
    { symbol: "KOSPI200", changePercent: 0.5 },
    { symbol: "NASDAQ", changePercent: 0.4 },
    { symbol: "S&P500", changePercent: 0.2 },
    { symbol: "DOW", changePercent: 0.2 },
    { symbol: "USDKRW", changePercent: -0.2 },
    { symbol: "KOSDAQ", changePercent: 0.3 }
  ]);

  const lowCoverage = computeMainSessionOutlook([
    { symbol: "KOSPI200", changePercent: 0.5 }
  ]);

  assert.equal(fullCoverage.available, true);
  assert.equal(lowCoverage.available, true);
  assert.ok(fullCoverage.coverage >= lowCoverage.coverage);
  assert.ok(fullCoverage.confidence >= lowCoverage.confidence);
});

runTest("adaptive weight map boosts reliable factor and dampens weak factor", () => {
  const logs = [];
  for (let i = 0; i < 12; i += 1) {
    logs.push({
      actualMovePct: 0.6,
      factors: [
        { key: "kospi200", contribution: 0.4 },
        { key: "usdkrw", contribution: -0.2 }
      ]
    });
  }
  for (let i = 0; i < 12; i += 1) {
    logs.push({
      actualMovePct: 0.6,
      factors: [
        { key: "dow", contribution: -0.3 }
      ]
    });
  }

  const map = buildAdaptiveWeightMap(logs, 10);
  assert.ok(map.kospi200 > 1);
  assert.ok(map.usdkrw < 1);
  assert.ok(map.dow < 1);
});

runTest("computeMainSessionOutlook accepts weight map override", () => {
  const futures = [
    { symbol: "KOSPI200", changePercent: 0.5 },
    { symbol: "DOW", changePercent: -0.5 }
  ];

  const baseline = computeMainSessionOutlook(futures);
  const weighted = computeMainSessionOutlook(futures, {
    weightMap: { kospi200: 1.4, dow: 0.7 }
  });

  assert.equal(baseline.available, true);
  assert.equal(weighted.available, true);
  assert.ok(weighted.score > baseline.score);
});

if (process.exitCode && process.exitCode !== 0) {
  throw new Error("Prediction self-test failed.");
}

console.log("Prediction self-test passed.");
