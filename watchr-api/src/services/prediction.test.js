import test from "node:test";
import assert from "node:assert/strict";
import { predictOpenFromFutures } from "./prediction.js";

test("predictOpenFromFutures returns bullish signal on positive global futures", () => {
  const result = predictOpenFromFutures([
    { symbol: "NQ=F", name: "NASDAQ", changeRate: 1.2 },
    { symbol: "ES=F", name: "S&P500", changeRate: 1.1 },
    { symbol: "YM=F", name: "DOW", changeRate: 0.8 },
    { symbol: "KOSPI200", name: "KOSPI200", changeRate: 0.7 },
    { symbol: "^KQ11", name: "KOSDAQ", changeRate: 0.4 },
    { symbol: "KRW=X", name: "USD-KRW", changeRate: -0.2 }
  ]);

  assert.ok(result);
  assert.equal(typeof result.score, "number");
  assert.ok(result.score > 0);
  assert.ok(["bullish", "strong_bullish"].includes(result.bias));
});

test("predictOpenFromFutures returns bearish signal on negative global futures", () => {
  const result = predictOpenFromFutures([
    { symbol: "NQ=F", name: "NASDAQ", changeRate: -1.8 },
    { symbol: "ES=F", name: "S&P500", changeRate: -1.4 },
    { symbol: "YM=F", name: "DOW", changeRate: -1.0 },
    { symbol: "KOSPI200", name: "KOSPI200", changeRate: -0.7 },
    { symbol: "^KQ11", name: "KOSDAQ", changeRate: -0.5 },
    { symbol: "KRW=X", name: "USD-KRW", changeRate: 0.6 }
  ]);

  assert.ok(result);
  assert.ok(result.score < 0);
  assert.ok(["bearish", "strong_bearish"].includes(result.bias));
});
