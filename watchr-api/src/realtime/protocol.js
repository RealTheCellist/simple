export const REALTIME_CHANNELS = ["health", "prediction", "futures"];

export function normalizeChannels(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return [...REALTIME_CHANNELS];
  }
  const valid = input
    .map((item) => String(item || "").trim())
    .filter((item) => REALTIME_CHANNELS.includes(item));
  return [...new Set(valid)];
}

export function parseClientMessage(raw) {
  try {
    const payload = JSON.parse(String(raw || ""));
    const type = String(payload?.type || "").trim();
    if (!type) return { type: "invalid", reason: "missing_type" };
    return { type, payload };
  } catch (error) {
    return { type: "invalid", reason: "bad_json" };
  }
}

export function selectSnapshotChannels(snapshot, channels) {
  const selected = {};
  const activeChannels = normalizeChannels(channels);
  activeChannels.forEach((channel) => {
    if (channel in snapshot) selected[channel] = snapshot[channel];
  });
  return {
    generatedAt: snapshot.generatedAt ?? new Date().toISOString(),
    channels: activeChannels,
    data: selected
  };
}
