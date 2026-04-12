import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeChannels,
  parseClientMessage,
  REALTIME_CHANNELS,
  selectSnapshotChannels
} from "./protocol.js";

test("normalizeChannels returns defaults for empty input", () => {
  const result = normalizeChannels([]);
  assert.deepEqual(result, REALTIME_CHANNELS);
});

test("normalizeChannels keeps only valid channels", () => {
  const result = normalizeChannels(["prediction", "invalid", "health", "prediction"]);
  assert.deepEqual(result, ["prediction", "health"]);
});

test("parseClientMessage returns invalid on bad JSON", () => {
  const result = parseClientMessage("{bad");
  assert.equal(result.type, "invalid");
});

test("selectSnapshotChannels returns filtered snapshot payload", () => {
  const payload = selectSnapshotChannels(
    {
      generatedAt: "2026-01-01T00:00:00.000Z",
      health: { status: "ok" },
      prediction: { score: 10 },
      futures: [{ symbol: "NQ=F" }]
    },
    ["health", "prediction"]
  );

  assert.equal(payload.generatedAt, "2026-01-01T00:00:00.000Z");
  assert.deepEqual(payload.channels, ["health", "prediction"]);
  assert.equal(payload.data.health.status, "ok");
  assert.equal(payload.data.prediction.score, 10);
  assert.equal("futures" in payload.data, false);
});
