import test from "node:test";
import assert from "node:assert/strict";
import { runBacktest } from "../src/core/backtest.js";
import { generateSyntheticRows } from "../src/data/synthetic.js";

test("runBacktest returns valid summary metrics", () => {
  const rows = generateSyntheticRows({ days: 520, seed: 777 });
  const result = runBacktest(rows, {
    threshold: 11,
    feeBps: 2,
    riskScale: 1.1
  });

  assert.equal(result.summary.days, 520);
  assert.ok(Number.isFinite(result.summary.totalReturnPct));
  assert.ok(Number.isFinite(result.summary.maxDrawdownPct));
  assert.ok(result.summary.maxDrawdownPct <= 0);
  assert.ok(result.trades.length === 520);
  assert.ok(Number.isFinite(result.summary.totalCostPct));
  assert.ok(result.summary.totalCostPct >= 0);
});

test("strategy is sensitive to threshold", () => {
  const rows = generateSyntheticRows({ days: 400, seed: 99 });
  const lowThreshold = runBacktest(rows, { threshold: 8 });
  const highThreshold = runBacktest(rows, { threshold: 20 });
  assert.ok(lowThreshold.summary.activeDays >= highThreshold.summary.activeDays);
});

test("higher slippage reduces return", () => {
  const rows = generateSyntheticRows({ days: 350, seed: 31415 });
  const lowCost = runBacktest(rows, { slippageBps: 0.5, feeBps: 1 });
  const highCost = runBacktest(rows, { slippageBps: 8, feeBps: 6 });
  assert.ok(lowCost.summary.totalReturnPct >= highCost.summary.totalReturnPct);
});

test("blocked weekdays reduce active trading days", () => {
  const rows = generateSyntheticRows({ days: 280, seed: 123 });
  const baseline = runBacktest(rows, { threshold: 10 });
  const blocked = runBacktest(rows, { threshold: 10, blockedWeekdays: [1, 3, 5] });
  assert.ok(blocked.summary.activeDays <= baseline.summary.activeDays);
});
