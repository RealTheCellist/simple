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
});

test("strategy is sensitive to threshold", () => {
  const rows = generateSyntheticRows({ days: 400, seed: 99 });
  const lowThreshold = runBacktest(rows, { threshold: 8 });
  const highThreshold = runBacktest(rows, { threshold: 20 });
  assert.ok(lowThreshold.summary.activeDays >= highThreshold.summary.activeDays);
});
