const KEYS = {
  weights: "ops_weights",
  qaEvents: "ops_qa_events",
  release: "ops_release"
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadWeights(fallback) {
  return { ...fallback, ...readJson(KEYS.weights, {}) };
}

export function saveWeights(weights) {
  writeJson(KEYS.weights, weights);
}

export function loadQaEvents() {
  return readJson(KEYS.qaEvents, []);
}

export function appendQaEvent(type) {
  const events = loadQaEvents();
  const next = [{ type, at: new Date().toISOString() }, ...events].slice(0, 200);
  writeJson(KEYS.qaEvents, next);
  return next;
}

export function clearQaEvents() {
  writeJson(KEYS.qaEvents, []);
  return [];
}

export function loadReleaseState() {
  return readJson(KEYS.release, { current: "ops-v0.1.0", history: [] });
}

export function applyReleaseVersion(version) {
  const prev = loadReleaseState();
  const next = {
    current: version,
    history: [prev.current, ...prev.history].filter(Boolean).slice(0, 15)
  };
  writeJson(KEYS.release, next);
  return next;
}

export function rollbackRelease() {
  const prev = loadReleaseState();
  const [head, ...rest] = prev.history;
  if (!head) return prev;
  const next = {
    current: head,
    history: rest
  };
  writeJson(KEYS.release, next);
  return next;
}
