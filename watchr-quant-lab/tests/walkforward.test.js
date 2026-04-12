import test from "node:test";
import assert from "node:assert/strict";
import { generateSyntheticRows } from "../src/data/synthetic.js";
import { runWalkForward } from "../src/core/walkforward.js";

test("runWalkForward produces out-of-sample summary when enough rows exist", () => {
  const rows = generateSyntheticRows({ days: 900, seed: 2026 });
  const result = runWalkForward(rows, {
    trainDays: 252,
    testDays: 63,
    stepDays: 63
  });

  assert.equal(result.reason, "ok");
  assert.ok(result.folds.length > 0);
  assert.ok(result.summary.folds > 0);
  assert.ok(Number.isFinite(result.summary.meanOosReturnPct));
});

test("runWalkForward reports insufficient_rows for short datasets", () => {
  const rows = generateSyntheticRows({ days: 120, seed: 1 });
  const result = runWalkForward(rows, {
    trainDays: 252,
    testDays: 63
  });

  assert.equal(result.reason, "insufficient_rows");
  assert.equal(result.summary, null);
});
