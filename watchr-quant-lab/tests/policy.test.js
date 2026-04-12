import test from "node:test";
import assert from "node:assert/strict";
import { loadRowsWithPolicy } from "../src/data/policy.js";

const demoRows = [
  {
    date: "2026-01-01",
    factors: { nq: 0.1, sp: 0.1, dow: 0.1, k200: 0.1, kosdaq: 0.1, usdkrw: -0.1 },
    openReturnPct: 0.2
  }
];

test("real mode uses fallback when real source fails", async () => {
  const loaded = await loadRowsWithPolicy(
    {
      mode: "real",
      realFallback: true,
      strictReal: false,
      days: 50,
      seed: 7
    },
    {
      loadYahoo: async () => {
        throw new Error("network down");
      },
      genSynthetic: () => demoRows
    }
  );

  assert.equal(loaded.source, "synthetic_fallback");
  assert.equal(loaded.rows.length, 1);
});

test("real mode throws when strictReal=true and yahoo fails", async () => {
  await assert.rejects(
    () =>
      loadRowsWithPolicy(
        {
          mode: "real",
          realFallback: false,
          strictReal: true
        },
        {
          loadYahoo: async () => {
            throw new Error("no data");
          }
        }
      ),
    /real_data_unavailable/
  );
});
