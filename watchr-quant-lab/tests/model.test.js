import test from "node:test";
import assert from "node:assert/strict";
import { computePrediction, scoreToSignal } from "../src/core/model.js";

test("computePrediction returns bullish score on positive risk factors", () => {
  const prediction = computePrediction({
    nq: 1.1,
    sp: 0.8,
    dow: 0.4,
    k200: 0.6,
    kosdaq: 0.5,
    usdkrw: -0.4
  });

  assert.ok(prediction.score > 0);
  assert.ok(["bullish", "strong_bullish", "neutral"].includes(prediction.bias));
});

test("scoreToSignal respects threshold", () => {
  assert.equal(scoreToSignal(13, 12), "long");
  assert.equal(scoreToSignal(-13, 12), "short");
  assert.equal(scoreToSignal(5, 12), "flat");
});
