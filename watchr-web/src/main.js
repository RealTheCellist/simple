import "./style.css";
import { buildAdaptiveWeightMap, computeMainSessionOutlook } from "./prediction.js";

const defaultApiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const APP_VERSION = String(import.meta.env.VITE_APP_VERSION || "1.0.0");
const ENABLE_MOCK_FALLBACK = String(import.meta.env.VITE_ENABLE_MOCK_FALLBACK ?? "true").toLowerCase() !== "false";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 9000);
const API_RETRY_ATTEMPTS = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS ?? 3);
const API_RETRY_BASE_MS = Number(import.meta.env.VITE_API_RETRY_BASE_MS ?? 350);
const API_RETRY_MAX_MS = Number(import.meta.env.VITE_API_RETRY_MAX_MS ?? 2200);
const MAX_HISTORY_LOGS = Number(import.meta.env.VITE_MAX_HISTORY_LOGS ?? 300);
const PREDICTION_EVAL_MINUTES = Number(import.meta.env.VITE_PREDICTION_EVAL_MINUTES ?? 45);
const PREDICTION_CAPTURE_MINUTES = Number(import.meta.env.VITE_PREDICTION_CAPTURE_MINUTES ?? 10);
const PREDICTION_MIN_SAMPLES = Number(import.meta.env.VITE_PREDICTION_MIN_SAMPLES ?? 10);
const MAX_PREDICTION_LOGS = Number(import.meta.env.VITE_MAX_PREDICTION_LOGS ?? 500);

const STORAGE_KEYS = {
  apiUrl: "watchr_api_url",
  watchlist: "sm_watchlist",
  alerts: "sm_alerts",
  history: "sm_history",
  predictionLogs: "sm_prediction_logs",
  predictionAdaptive: "sm_prediction_adaptive"
};

const COOLDOWN_MS = 60 * 60 * 1000;

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand"><span class="brand-dot"></span><span>WATCHR WEB APP</span></div>
      <span class="pill">OFFICIAL RELEASE v${APP_VERSION}</span>
    </div>
  </header>
  <main class="wrap shell">
    <aside class="card side">
      <div class="kicker">Runtime</div>
      <h2>Connection</h2>
      <p class="muted">Set backend URL. Calls: <code>/api/price/batch</code>, <code>/api/price/:ticker</code>, <code>/api/futures</code>.</p>
      <div class="field">
        <label for="apiUrlInput">API BASE URL</label>
        <input id="apiUrlInput" class="input" type="text" placeholder="http://localhost:3000">
      </div>
      <div class="field"><button id="saveApiBtn" class="btn primary" type="button">Save API URL</button></div>
      <div id="connStatus" class="status">Not checked yet.</div>
      <div class="field"><button id="checkApiBtn" class="btn" type="button">Check Backend</button></div>
      <div class="field"><button id="refreshNowBtn" class="btn" type="button">Refresh Now</button></div>
      <div class="field"><button id="notifBtn" class="btn" type="button">Enable Notifications</button></div>
    </aside>

    <section class="card main">
      <div class="tabs">
        <button class="tab-btn active" data-tab="watchlist" type="button">Watchlist</button>
        <button class="tab-btn" data-tab="futures" type="button">Futures</button>
        <button class="tab-btn" data-tab="alerts" type="button">Alerts <span id="alertsCount" class="tab-count">0</span></button>
        <button class="tab-btn" data-tab="history" type="button">History <span id="historyCount" class="tab-count">0</span></button>
      </div>

      <div id="panel-watchlist" class="panel active">
        <div class="panel-head">
          <h3>Watchlist</h3>
          <span id="watchlistMeta" class="pill">Idle</span>
        </div>
        <div class="add-row">
          <input id="tickerInput" class="input" type="text" placeholder="Add ticker (e.g. 005930.KS, AAPL)">
          <button id="addTickerBtn" class="btn primary" type="button">Add</button>
        </div>
        <div id="watchlistRows"></div>
        <div id="watchlistEmpty" class="empty">ADD TICKER TO BEGIN</div>
      </div>

      <div id="panel-futures" class="panel">
        <div class="panel-head">
          <h3>Futures</h3>
          <span id="futuresMeta" class="pill">Idle</span>
        </div>
        <section id="futuresPrediction" class="prediction-card">
          <div class="prediction-empty">PREDICTION UNAVAILABLE</div>
        </section>
        <div class="prediction-controls">
          <button id="toggleAdaptiveBtn" class="btn" type="button">Adaptive Weights: OFF</button>
          <button id="clearPredictionBtn" class="btn" type="button">Reset Backtest</button>
        </div>
        <div id="futuresGrid" class="futures-grid"></div>
        <div id="futuresEmpty" class="empty">NO FUTURES DATA</div>
      </div>

      <div id="panel-alerts" class="panel">
        <div class="panel-head">
          <h3>Alerts</h3>
          <span id="alertsMeta" class="pill">Idle</span>
        </div>
        <div class="alerts-form">
          <select id="alertTickerSelect" class="select"></select>
          <select id="alertOperatorSelect" class="select">
            <option value="above">ABOVE</option>
            <option value="below">BELOW</option>
          </select>
          <input id="alertTargetInput" class="input" type="number" min="0" step="0.01" placeholder="Target price">
          <button id="addAlertBtn" class="btn primary" type="button">Add</button>
        </div>
        <div id="alertRows"></div>
        <div id="alertsEmpty" class="empty">NO ACTIVE ALERTS</div>
      </div>

      <div id="panel-history" class="panel">
        <div class="panel-head">
          <h3>History</h3>
          <button id="clearHistoryBtn" class="btn" type="button" style="max-width:140px;">Clear History</button>
        </div>
        <div class="history-summary">
          <div class="summary-card"><div class="summary-key">Total Triggers</div><div id="sumTotal" class="summary-value">0</div></div>
          <div class="summary-card"><div class="summary-key">Today</div><div id="sumToday" class="summary-value">0</div></div>
          <div class="summary-card"><div class="summary-key">Unique Tickers</div><div id="sumTickers" class="summary-value">0</div></div>
        </div>
        <div id="historyRows"></div>
        <div id="historyEmpty" class="empty">NO HISTORY LOGS</div>
      </div>
    </section>
  </main>
`;

function readArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readBool(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readPredictionLogs() {
  const logs = readArray(STORAGE_KEYS.predictionLogs, []);
  return logs
    .filter((entry) => entry && typeof entry === "object")
    .slice(0, MAX_PREDICTION_LOGS);
}

const state = {
  activeTab: "watchlist",
  apiBaseUrl: (localStorage.getItem(STORAGE_KEYS.apiUrl) || defaultApiBase).replace(/\/+$/, ""),
  watchlist: readArray(STORAGE_KEYS.watchlist, ["005930.KS"]),
  prices: {},
  futures: [],
  alerts: readArray(STORAGE_KEYS.alerts, []),
  history: readArray(STORAGE_KEYS.history, []),
  predictionLogs: readPredictionLogs(),
  predictionAdaptive: readBool(STORAGE_KEYS.predictionAdaptive, false),
  adaptiveWeightMap: {},
  currentOutlook: null,
  timers: { watchlist: null, futures: null }
};

const el = {
  apiUrlInput: document.getElementById("apiUrlInput"),
  saveApiBtn: document.getElementById("saveApiBtn"),
  checkApiBtn: document.getElementById("checkApiBtn"),
  refreshNowBtn: document.getElementById("refreshNowBtn"),
  notifBtn: document.getElementById("notifBtn"),
  connStatus: document.getElementById("connStatus"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  watchlistRows: document.getElementById("watchlistRows"),
  watchlistEmpty: document.getElementById("watchlistEmpty"),
  watchlistMeta: document.getElementById("watchlistMeta"),
  tickerInput: document.getElementById("tickerInput"),
  addTickerBtn: document.getElementById("addTickerBtn"),
  futuresGrid: document.getElementById("futuresGrid"),
  futuresPrediction: document.getElementById("futuresPrediction"),
  toggleAdaptiveBtn: document.getElementById("toggleAdaptiveBtn"),
  clearPredictionBtn: document.getElementById("clearPredictionBtn"),
  futuresEmpty: document.getElementById("futuresEmpty"),
  futuresMeta: document.getElementById("futuresMeta"),
  alertsCount: document.getElementById("alertsCount"),
  historyCount: document.getElementById("historyCount"),
  alertsMeta: document.getElementById("alertsMeta"),
  alertTickerSelect: document.getElementById("alertTickerSelect"),
  alertOperatorSelect: document.getElementById("alertOperatorSelect"),
  alertTargetInput: document.getElementById("alertTargetInput"),
  addAlertBtn: document.getElementById("addAlertBtn"),
  alertRows: document.getElementById("alertRows"),
  alertsEmpty: document.getElementById("alertsEmpty"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyRows: document.getElementById("historyRows"),
  historyEmpty: document.getElementById("historyEmpty"),
  sumTotal: document.getElementById("sumTotal"),
  sumToday: document.getElementById("sumToday"),
  sumTickers: document.getElementById("sumTickers")
};

function saveStateArrays() {
  localStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(state.watchlist));
  localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(state.alerts));
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function savePredictionState() {
  localStorage.setItem(STORAGE_KEYS.predictionLogs, JSON.stringify(state.predictionLogs.slice(0, MAX_PREDICTION_LOGS)));
  localStorage.setItem(STORAGE_KEYS.predictionAdaptive, state.predictionAdaptive ? "1" : "0");
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fmtNumber(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US") : "-";
}

function fmtPercent(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "-";
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function todayKey(dateValue) {
  const date = new Date(dateValue);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
}

function setStatus(text, tone = "") {
  el.connStatus.className = `status ${tone}`.trim();
  el.connStatus.textContent = text;
}

function setTab(tab) {
  state.activeTab = tab;
  el.tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tab}`));
}

function updateCounts() {
  const activeAlerts = state.alerts.filter((item) => item.enabled !== false).length;
  el.alertsCount.textContent = String(activeAlerts);
  el.historyCount.textContent = String(state.history.length);
}

function renderWatchlist() {
  el.watchlistRows.innerHTML = "";
  el.watchlistEmpty.style.display = state.watchlist.length ? "none" : "block";

  state.watchlist.forEach((ticker) => {
    const quote = state.prices[ticker] || {};
    const changePercent = quote.changePercent ?? quote.changeRate ?? 0;
    const toneClass = toNumber(changePercent) >= 0 ? "chg-up" : "chg-down";
    const alertCount = state.alerts.filter((item) => item.ticker === ticker && item.enabled !== false).length;

    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div class="ticker">${ticker}</div>
        <div class="name">${quote.name || quote.companyName || "Unknown"}${alertCount ? ` - ${alertCount} alert` : ""}</div>
      </div>
      <div class="price">${fmtNumber(quote.price)}</div>
      <div class="${toneClass}">${fmtPercent(changePercent)}</div>
      <button class="icon-btn" type="button" data-remove-ticker="${ticker}" aria-label="Remove ${ticker}">x</button>
    `;
    el.watchlistRows.appendChild(row);
  });
}

function normalizeFutures(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && typeof payload === "object") return Object.values(payload).filter((item) => item && typeof item === "object");
  return [];
}

function renderFutures() {
  renderFuturesPrediction();
  renderPredictionControls();
  el.futuresGrid.innerHTML = "";
  el.futuresEmpty.style.display = state.futures.length ? "none" : "block";

  state.futures.forEach((item) => {
    const symbol = item.symbol || item.ticker || "UNKNOWN";
    const changePercent = item.changePercent ?? item.changeRate ?? 0;
    const toneClass = toNumber(changePercent) >= 0 ? "chg-up" : "chg-down";
    const card = document.createElement("article");
    card.className = "future-card";
    card.innerHTML = `
      <div class="future-name">${symbol}</div>
      <div class="future-price">${fmtNumber(item.price)}</div>
      <div class="future-change ${toneClass}">${fmtPercent(changePercent)}</div>
    `;
    el.futuresGrid.appendChild(card);
  });
}

function toSign(value, deadzone = 0.03) {
  if (!Number.isFinite(value)) return 0;
  if (value > deadzone) return 1;
  if (value < -deadzone) return -1;
  return 0;
}

function recomputeAdaptiveWeights() {
  state.adaptiveWeightMap = buildAdaptiveWeightMap(state.predictionLogs, PREDICTION_MIN_SAMPLES);
}

function getOutlookForFutures(futures) {
  const weightMap = state.predictionAdaptive ? state.adaptiveWeightMap : undefined;
  return computeMainSessionOutlook(futures, { weightMap });
}

function pickReferenceFactor(outlook) {
  if (!outlook?.available || !Array.isArray(outlook.factors) || !outlook.factors.length) return null;
  return (
    outlook.factors.find((factor) => factor.key === "kospi200") ||
    outlook.factors.find((factor) => factor.key === "kosdaq") ||
    outlook.factors[0]
  );
}

function capturePredictionSnapshot(outlook) {
  if (!outlook?.available) return;
  const referenceFactor = pickReferenceFactor(outlook);
  if (!referenceFactor) return;

  const now = Date.now();
  const lastTime = state.predictionLogs.length ? Number(state.predictionLogs[0].time || 0) : 0;
  if (now - lastTime < PREDICTION_CAPTURE_MINUTES * 60 * 1000) return;

  state.predictionLogs.unshift({
    id: makeId("pred"),
    time: now,
    label: outlook.label,
    score: outlook.score,
    expectedOpenMovePct: outlook.expectedOpenMovePct,
    referenceKey: referenceFactor.key,
    referenceChangeAtPred: referenceFactor.changePercent,
    factors: outlook.factors.map((factor) => ({
      key: factor.key,
      contribution: factor.contribution,
      changePercent: factor.changePercent
    })),
    resolvedAt: 0,
    actualMovePct: null,
    directionHit: null,
    absErrorPct: null
  });

  state.predictionLogs = state.predictionLogs.slice(0, MAX_PREDICTION_LOGS);
  savePredictionState();
}

function settlePredictionLogs(outlook) {
  if (!outlook?.available || !Array.isArray(outlook.factors) || !outlook.factors.length) return false;
  const now = Date.now();
  let changed = false;

  state.predictionLogs.forEach((entry) => {
    if (entry.resolvedAt) return;
    if (now - Number(entry.time || 0) < PREDICTION_EVAL_MINUTES * 60 * 1000) return;
    const refFactor = outlook.factors.find((factor) => factor.key === entry.referenceKey);
    if (!refFactor) return;

    const startChange = toNumber(entry.referenceChangeAtPred);
    const currentChange = toNumber(refFactor.changePercent);
    const predictedMove = toNumber(entry.expectedOpenMovePct);
    if (!Number.isFinite(startChange) || !Number.isFinite(currentChange) || !Number.isFinite(predictedMove)) return;

    const actualMovePct = Number((currentChange - startChange).toFixed(3));
    entry.actualMovePct = actualMovePct;
    entry.absErrorPct = Number(Math.abs(predictedMove - actualMovePct).toFixed(3));
    entry.directionHit = toSign(predictedMove) === toSign(actualMovePct);
    entry.resolvedAt = now;
    changed = true;
  });

  if (changed) {
    savePredictionState();
  }
  return changed;
}

function getPredictionStats() {
  const resolved = state.predictionLogs.filter((entry) => entry.resolvedAt && Number.isFinite(toNumber(entry.absErrorPct)));
  const directional = resolved.filter((entry) => toSign(toNumber(entry.expectedOpenMovePct)) !== 0 || toSign(toNumber(entry.actualMovePct)) !== 0);
  const hitCount = directional.filter((entry) => entry.directionHit === true).length;
  const avgAbsError = resolved.length
    ? resolved.reduce((sum, entry) => sum + toNumber(entry.absErrorPct), 0) / resolved.length
    : 0;

  return {
    captured: state.predictionLogs.length,
    resolved: resolved.length,
    pending: state.predictionLogs.length - resolved.length,
    hitRate: directional.length ? (hitCount / directional.length) * 100 : 0,
    avgAbsError
  };
}

function renderPredictionControls() {
  el.toggleAdaptiveBtn.textContent = `Adaptive Weights: ${state.predictionAdaptive ? "ON" : "OFF"}`;
}

function renderFuturesPrediction() {
  const outlook = state.currentOutlook || getOutlookForFutures(state.futures);
  const stats = getPredictionStats();
  if (!outlook.available) {
    el.futuresPrediction.innerHTML = `
      <div class="prediction-head">
        <div class="prediction-title">Main Session Outlook</div>
        <div class="prediction-chip neutral">No signal</div>
      </div>
      <div class="prediction-empty">Futures indicators are not enough yet.</div>
      <div class="prediction-meta">Backtest captured ${stats.captured}, resolved ${stats.resolved}.</div>
    `;
    return;
  }

  const toneClass = outlook.tone === "up" ? "up" : (outlook.tone === "down" ? "down" : "neutral");
  const signedMove = `${outlook.expectedOpenMovePct > 0 ? "+" : ""}${outlook.expectedOpenMovePct.toFixed(2)}%`;
  const factorRows = outlook.topFactors
    .map((factor) => {
      const factorTone = factor.contribution >= 0 ? "up" : "down";
      const changeText = `${factor.changePercent > 0 ? "+" : ""}${factor.changePercent.toFixed(2)}%`;
      return `
        <div class="factor-row">
          <span class="factor-name">${factor.label}</span>
          <span class="factor-change ${factorTone}">${changeText}</span>
        </div>
      `;
    })
    .join("");

  el.futuresPrediction.innerHTML = `
    <div class="prediction-head">
      <div class="prediction-title">Main Session Outlook</div>
      <div class="prediction-chip ${toneClass}">${outlook.label}</div>
    </div>
    <div class="prediction-main">
      <div>
        <div class="prediction-summary">${outlook.summary}</div>
        <div class="prediction-meta">Confidence ${outlook.confidence}% | Coverage ${outlook.coverage}% | Score ${outlook.score}</div>
      </div>
      <div class="prediction-move ${toneClass}">${signedMove}</div>
    </div>
    <div class="prediction-stats">
      <span>Backtest ${stats.resolved}/${stats.captured}</span>
      <span>Hit ${stats.hitRate.toFixed(1)}%</span>
      <span>MAE ${stats.avgAbsError.toFixed(2)}%</span>
      <span>Pending ${stats.pending}</span>
    </div>
    <div class="factor-list">
      ${factorRows}
    </div>
  `;
}

function renderAlertTickerOptions() {
  const current = el.alertTickerSelect.value;
  el.alertTickerSelect.innerHTML = "";
  if (!state.watchlist.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "NO TICKERS";
    el.alertTickerSelect.appendChild(option);
    el.alertTickerSelect.disabled = true;
    el.addAlertBtn.disabled = true;
    return;
  }

  state.watchlist.forEach((ticker) => {
    const option = document.createElement("option");
    option.value = ticker;
    option.textContent = ticker;
    el.alertTickerSelect.appendChild(option);
  });

  el.alertTickerSelect.disabled = false;
  el.addAlertBtn.disabled = false;
  if (state.watchlist.includes(current)) el.alertTickerSelect.value = current;
}

function renderAlerts() {
  el.alertRows.innerHTML = "";
  el.alertsEmpty.style.display = state.alerts.length ? "none" : "block";
  el.alertsMeta.textContent = `${state.alerts.length} total`;

  state.alerts.forEach((alert) => {
    const status = alert.enabled === false ? "PAUSED" : "LIVE";
    const toneClass = alert.operator === "above" ? "chg-up" : "chg-down";
    const row = document.createElement("div");
    row.className = "alert-row";
    row.innerHTML = `
      <div>
        <div class="ticker">${alert.ticker}</div>
        <div class="name">${alert.operator.toUpperCase()} ${fmtNumber(alert.target)}</div>
      </div>
      <div class="${toneClass}">${status}</div>
      <div class="name">${alert.lastFiredAt ? `Last ${new Date(alert.lastFiredAt).toLocaleTimeString()}` : "Never fired"}</div>
      <button class="icon-btn warn" type="button" data-toggle-alert="${alert.id}">${alert.enabled === false ? "Play" : "Pause"}</button>
      <button class="icon-btn" type="button" data-remove-alert="${alert.id}">x</button>
    `;
    el.alertRows.appendChild(row);
  });
}

function renderHistory() {
  el.historyRows.innerHTML = "";
  const sorted = [...state.history].sort((a, b) => b.time - a.time);
  el.historyEmpty.style.display = sorted.length ? "none" : "block";

  const today = todayKey(Date.now());
  el.sumTotal.textContent = String(sorted.length);
  el.sumToday.textContent = String(sorted.filter((item) => todayKey(item.time) === today).length);
  el.sumTickers.textContent = String(new Set(sorted.map((item) => item.ticker)).size);

  sorted.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <div class="history-top">
        <div class="history-code">${item.ticker}</div>
        <div class="history-time">${new Date(item.time).toLocaleString()}</div>
      </div>
      <div class="history-desc">${item.operator.toUpperCase()} ${fmtNumber(item.target)} - Triggered at ${fmtNumber(item.price)}</div>
    `;
    el.historyRows.appendChild(row);
  });
}

function renderAll() {
  renderWatchlist();
  renderFutures();
  renderAlertTickerOptions();
  renderAlerts();
  renderHistory();
  updateCounts();
}

async function fetchJson(path) {
  let lastError = null;
  const attempts = Math.max(1, Math.floor(API_RETRY_ATTEMPTS));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchJsonOnce(path);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const backoff = Math.min(API_RETRY_BASE_MS * (2 ** (attempt - 1)), API_RETRY_MAX_MS);
      const jitter = Math.floor(Math.random() * 120);
      await sleep(backoff + jitter);
    }
  }
  throw lastError || new Error("Request failed");
}

async function fetchJsonOnce(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${state.apiBaseUrl}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePricePayload(payload) {
  const map = {};
  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      const key = item?.ticker || item?.symbol;
      if (key) map[key] = item;
    });
    return map;
  }
  if (payload && Array.isArray(payload.data)) {
    payload.data.forEach((item) => {
      const key = item?.ticker || item?.symbol;
      if (key) map[key] = item;
    });
    return map;
  }
  if (payload && typeof payload === "object") {
    Object.entries(payload).forEach(([key, value]) => {
      if (value && typeof value === "object") map[key] = value;
    });
  }
  return map;
}

function buildMockQuote(ticker, previous) {
  const previousPrice = toNumber(previous?.price);
  const base = Number.isFinite(previousPrice) ? previousPrice : (100 + ticker.length * 17);
  const drift = (Math.random() - 0.5) * Math.max(1, base * 0.015);
  const price = Math.max(0.01, base + drift);
  const changePercent = base > 0 ? ((price - base) / base) * 100 : 0;
  return { ticker, symbol: ticker, price, changePercent };
}

function buildMockFutures() {
  const symbols = ["KOSPI200", "NASDAQ", "S&P500", "KOSDAQ", "USDKRW", "DOW"];
  return symbols.map((symbol) => {
    const anchor = symbol.length * 120 + 1000;
    const drift = (Math.random() - 0.5) * (anchor * 0.01);
    return { symbol, price: anchor + drift, changePercent: (drift / anchor) * 100 };
  });
}

function findQuotePrice(ticker) {
  const direct = state.prices[ticker];
  if (direct) return toNumber(direct.price);
  const upper = ticker.toUpperCase();
  const matched = Object.keys(state.prices).find((key) => key.toUpperCase() === upper);
  return matched ? toNumber(state.prices[matched].price) : Number.NaN;
}

function appendHistory(entry) {
  state.history.unshift(entry);
  if (state.history.length > MAX_HISTORY_LOGS) state.history = state.history.slice(0, MAX_HISTORY_LOGS);
}

function sendBrowserNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    const notification = new Notification(title, { body });
    setTimeout(() => notification.close(), 5000);
    return true;
  } catch {
    return false;
  }
}

function checkAlertsAgainstPrices() {
  let firedCount = 0;
  const now = Date.now();
  state.alerts.forEach((alert) => {
    if (alert.enabled === false) return;
    const price = findQuotePrice(alert.ticker);
    const target = toNumber(alert.target);
    if (!Number.isFinite(price) || !Number.isFinite(target)) return;

    const hit = alert.operator === "above" ? price >= target : price <= target;
    if (!hit) return;
    if (now - Number(alert.lastFiredAt || 0) < COOLDOWN_MS) return;

    alert.lastFiredAt = now;
    firedCount += 1;

    appendHistory({
      id: makeId("hist"),
      alertId: alert.id,
      ticker: alert.ticker,
      operator: alert.operator,
      target,
      price,
      time: now
    });

    sendBrowserNotification(
      `${alert.ticker} ${alert.operator.toUpperCase()} ${fmtNumber(target)}`,
      `Current price: ${fmtNumber(price)}`
    );
  });

  if (firedCount > 0) {
    saveStateArrays();
    renderAlerts();
    renderHistory();
    updateCounts();
    setStatus(`${firedCount} alert trigger${firedCount > 1 ? "s" : ""} detected.`, "ok");
  }
}

async function refreshWatchlist() {
  if (!state.watchlist.length) {
    el.watchlistMeta.textContent = "No tickers";
    return;
  }
  el.watchlistMeta.textContent = "Loading...";
  try {
    const query = encodeURIComponent(state.watchlist.join(","));
    const payload = await fetchJson(`/api/price/batch?tickers=${query}`);
    let nextPrices = normalizePricePayload(payload);
    if (!Object.keys(nextPrices).length && state.watchlist.length === 1) {
      const singlePayload = await fetchJson(`/api/price/${encodeURIComponent(state.watchlist[0])}`);
      nextPrices = normalizePricePayload([singlePayload]);
    }
    if (Object.keys(nextPrices).length) {
      state.prices = { ...state.prices, ...nextPrices };
    }
    renderWatchlist();
    checkAlertsAgainstPrices();
    el.watchlistMeta.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    if (!ENABLE_MOCK_FALLBACK) {
      el.watchlistMeta.textContent = "Failed";
      setStatus(`Watchlist fetch failed (${error.message}).`, "err");
      return;
    }
    const fallback = {};
    state.watchlist.forEach((ticker) => {
      fallback[ticker] = buildMockQuote(ticker, state.prices[ticker]);
    });
    state.prices = { ...state.prices, ...fallback };
    renderWatchlist();
    checkAlertsAgainstPrices();
    el.watchlistMeta.textContent = `Mock ${new Date().toLocaleTimeString()}`;
    setStatus(`Watchlist using mock data (${error.message}).`, "warn");
  }
}

async function refreshFutures() {
  el.futuresMeta.textContent = "Loading...";
  try {
    const payload = await fetchJson("/api/futures");
    state.futures = normalizeFutures(payload);
    recomputeAdaptiveWeights();
    state.currentOutlook = getOutlookForFutures(state.futures);
    capturePredictionSnapshot(state.currentOutlook);
    const settled = settlePredictionLogs(state.currentOutlook);
    if (settled) {
      recomputeAdaptiveWeights();
      state.currentOutlook = getOutlookForFutures(state.futures);
    }
    renderFutures();
    el.futuresMeta.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    if (!ENABLE_MOCK_FALLBACK) {
      state.futures = [];
      state.currentOutlook = null;
      renderFutures();
      el.futuresMeta.textContent = "Failed";
      setStatus(`Futures fetch failed (${error.message}).`, "err");
      return;
    }
    state.futures = buildMockFutures();
    recomputeAdaptiveWeights();
    state.currentOutlook = getOutlookForFutures(state.futures);
    capturePredictionSnapshot(state.currentOutlook);
    const settled = settlePredictionLogs(state.currentOutlook);
    if (settled) {
      recomputeAdaptiveWeights();
      state.currentOutlook = getOutlookForFutures(state.futures);
    }
    renderFutures();
    el.futuresMeta.textContent = `Mock ${new Date().toLocaleTimeString()}`;
    setStatus(`Futures using mock data (${error.message}).`, "warn");
  }
}

function addTicker() {
  const raw = el.tickerInput.value.trim().toUpperCase();
  if (!raw) return;
  if (!/^[A-Z0-9._-]+$/.test(raw)) {
    setStatus(`Invalid ticker format: ${raw}`, "warn");
    return;
  }
  if (state.watchlist.includes(raw)) {
    setStatus(`Ticker already exists: ${raw}`, "warn");
    return;
  }
  state.watchlist.push(raw);
  el.tickerInput.value = "";
  saveStateArrays();
  renderWatchlist();
  renderAlertTickerOptions();
  refreshWatchlist();
}

function removeTicker(ticker) {
  state.watchlist = state.watchlist.filter((item) => item !== ticker);
  delete state.prices[ticker];
  state.alerts = state.alerts.filter((item) => item.ticker !== ticker);
  saveStateArrays();
  renderAll();
}

function addAlert() {
  const ticker = el.alertTickerSelect.value;
  const operator = el.alertOperatorSelect.value;
  const target = toNumber(el.alertTargetInput.value);
  if (!ticker) return setStatus("Add a watchlist ticker first.", "warn");
  if (!Number.isFinite(target) || target <= 0) return setStatus("Enter a valid positive target price.", "warn");

  const duplicate = state.alerts.find((item) => item.ticker === ticker && item.operator === operator && Number(item.target) === target);
  if (duplicate) return setStatus("Same alert already exists.", "warn");

  state.alerts.push({ id: makeId("alt"), ticker, operator, target, enabled: true, lastFiredAt: 0 });
  el.alertTargetInput.value = "";
  saveStateArrays();
  renderAlerts();
  renderWatchlist();
  updateCounts();
}

function toggleAlert(alertId) {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return;
  alert.enabled = alert.enabled === false;
  saveStateArrays();
  renderAlerts();
  renderWatchlist();
  updateCounts();
}

function removeAlert(alertId) {
  state.alerts = state.alerts.filter((item) => item.id !== alertId);
  saveStateArrays();
  renderAlerts();
  renderWatchlist();
  updateCounts();
}

function clearHistory() {
  if (!confirm("Clear all history logs?")) return;
  state.history = [];
  saveStateArrays();
  renderHistory();
  updateCounts();
}

async function checkBackend() {
  setStatus("Checking backend...", "warn");
  try {
    await fetchJson("/api/futures");
    setStatus("Backend reachable.", "ok");
  } catch (error) {
    setStatus(`Backend check failed: ${error.message}`, "err");
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return setStatus("Notifications are not supported in this browser.", "warn");
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    setStatus("Notifications enabled.", "ok");
  } else {
    setStatus(`Notification permission: ${permission}`, "warn");
  }
}

function startPolling() {
  clearInterval(state.timers.watchlist);
  clearInterval(state.timers.futures);
  state.timers.watchlist = setInterval(refreshWatchlist, 5000);
  state.timers.futures = setInterval(() => {
    if (state.activeTab === "futures") refreshFutures();
  }, 60000);
}

function bindEvents() {
  el.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;
      setTab(targetTab);
      if (targetTab === "watchlist") refreshWatchlist();
      if (targetTab === "futures") refreshFutures();
    });
  });

  el.saveApiBtn.addEventListener("click", () => {
    const value = el.apiUrlInput.value.trim();
    if (!value) return;
    state.apiBaseUrl = value.replace(/\/+$/, "");
    localStorage.setItem(STORAGE_KEYS.apiUrl, state.apiBaseUrl);
    setStatus(`API URL saved: ${state.apiBaseUrl}`, "ok");
  });

  el.checkApiBtn.addEventListener("click", checkBackend);
  el.refreshNowBtn.addEventListener("click", () => {
    refreshWatchlist();
    refreshFutures();
  });
  el.notifBtn.addEventListener("click", requestNotificationPermission);
  el.toggleAdaptiveBtn.addEventListener("click", () => {
    state.predictionAdaptive = !state.predictionAdaptive;
    savePredictionState();
    recomputeAdaptiveWeights();
    state.currentOutlook = getOutlookForFutures(state.futures);
    renderFutures();
    setStatus(`Adaptive weights ${state.predictionAdaptive ? "enabled" : "disabled"}.`, "ok");
  });
  el.clearPredictionBtn.addEventListener("click", () => {
    if (!confirm("Reset prediction backtest logs?")) return;
    state.predictionLogs = [];
    state.adaptiveWeightMap = {};
    savePredictionState();
    state.currentOutlook = getOutlookForFutures(state.futures);
    renderFutures();
    setStatus("Prediction backtest logs cleared.", "ok");
  });

  el.addTickerBtn.addEventListener("click", addTicker);
  el.tickerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTicker();
  });

  el.watchlistRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-ticker]");
    if (button) removeTicker(button.dataset.removeTicker);
  });

  el.addAlertBtn.addEventListener("click", addAlert);
  el.alertRows.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-toggle-alert]");
    if (toggleButton) return toggleAlert(toggleButton.dataset.toggleAlert);
    const removeButton = event.target.closest("[data-remove-alert]");
    if (removeButton) removeAlert(removeButton.dataset.removeAlert);
  });

  el.clearHistoryBtn.addEventListener("click", clearHistory);
}

async function init() {
  el.apiUrlInput.value = state.apiBaseUrl;
  recomputeAdaptiveWeights();
  state.currentOutlook = getOutlookForFutures(state.futures);
  bindEvents();
  renderAll();
  startPolling();
  await refreshWatchlist();
  await refreshFutures();
  updateCounts();
  setStatus("Ready. Add tickers and alerts to start.", "ok");
}

init();
