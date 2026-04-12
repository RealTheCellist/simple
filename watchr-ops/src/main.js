import "./style.css";
import { REFRESH_MS } from "./config";
import { connectRealtime, fetchOpsSnapshot } from "./api";
import { FACTOR_META, defaultWeights, scoreWithWeights } from "./opsMath";
import {
  applyReleaseVersion,
  appendQaEvent,
  clearQaEvents,
  loadQaEvents,
  loadReleaseState,
  loadWeights,
  rollbackRelease,
  saveWeights
} from "./store";

const el = {
  refreshBtn: document.querySelector("#refreshBtn"),
  lastUpdated: document.querySelector("#lastUpdated"),
  healthText: document.querySelector("#healthText"),
  biasText: document.querySelector("#biasText"),
  scoreText: document.querySelector("#scoreText"),
  confidenceText: document.querySelector("#confidenceText"),
  contributors: document.querySelector("#contributors"),
  weightControls: document.querySelector("#weightControls"),
  simBias: document.querySelector("#simBias"),
  simScore: document.querySelector("#simScore"),
  addHitBtn: document.querySelector("#addHitBtn"),
  addMissBtn: document.querySelector("#addMissBtn"),
  clearQaBtn: document.querySelector("#clearQaBtn"),
  qaStats: document.querySelector("#qaStats"),
  versionInput: document.querySelector("#versionInput"),
  applyVersionBtn: document.querySelector("#applyVersionBtn"),
  rollbackBtn: document.querySelector("#rollbackBtn"),
  releaseInfo: document.querySelector("#releaseInfo")
};

const state = {
  futures: [],
  prediction: null,
  weights: loadWeights(defaultWeights()),
  qaEvents: loadQaEvents(),
  release: loadReleaseState(),
  realtimeConnected: false
};

function signed(value, digits = 2) {
  const num = Number(value || 0);
  return `${num >= 0 ? "+" : ""}${num.toFixed(digits)}`;
}

function toneClass(value) {
  if (value > 0) return "up";
  if (value < 0) return "dn";
  return "neutral";
}

function statText(target, value, cls) {
  target.classList.remove("up", "dn", "neutral");
  if (cls) target.classList.add(cls);
  target.textContent = value;
}

function renderTopStats(health, prediction) {
  const online = health?.status === "ok";
  const suffix = state.realtimeConnected ? " · RT" : " · POLL";
  statText(el.healthText, `${online ? "ONLINE" : "DEGRADED"}${suffix}`, online ? "up" : "dn");
  if (!prediction) {
    statText(el.biasText, "--");
    statText(el.scoreText, "--");
    statText(el.confidenceText, "--");
    return;
  }
  const score = Number(prediction.score || 0);
  statText(el.biasText, String(prediction.bias || "neutral").toUpperCase(), toneClass(score));
  statText(el.scoreText, signed(score, 1), toneClass(score));
  statText(el.confidenceText, `${Math.round(Number(prediction.confidence || 0))}%`, "neutral");
}

function renderContributors() {
  const rows = state.prediction?.contributors || [];
  if (!rows.length) {
    el.contributors.innerHTML = `<div class="row"><span class="name">데이터 없음</span><span class="rate">-</span><span class="score">-</span></div>`;
    return;
  }
  el.contributors.innerHTML = rows
    .slice(0, 6)
    .map((row) => {
      const score = Number(row.contributionScore || 0);
      return `<div class="row">
        <span class="name">${row.label || row.key}</span>
        <span class="rate ${toneClass(Number(row.changeRate || 0))}">${signed(Number(row.changeRate || 0))}%</span>
        <span class="score ${toneClass(score)}">${signed(score, 1)}</span>
      </div>`;
    })
    .join("");
}

function buildWeightControls() {
  el.weightControls.innerHTML = FACTOR_META.map((item) => {
    const value = Number(state.weights[item.key] || 0);
    return `<label class="weight-row">
      <span>${item.label}</span>
      <input data-weight="${item.key}" type="range" min="0" max="0.6" step="0.01" value="${value}" />
      <strong id="wv-${item.key}">${value.toFixed(2)}</strong>
    </label>`;
  }).join("");

  el.weightControls.querySelectorAll("input[data-weight]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const target = event.currentTarget;
      const key = target.dataset.weight;
      const value = Number(target.value || 0);
      state.weights[key] = value;
      saveWeights(state.weights);
      const valueEl = document.querySelector(`#wv-${key}`);
      if (valueEl) valueEl.textContent = value.toFixed(2);
      renderSimulation();
    });
  });
}

function renderSimulation() {
  const result = scoreWithWeights(state.futures, state.weights);
  statText(el.simBias, `SIM BIAS ${result.bias.toUpperCase()}`, toneClass(result.score));
  statText(
    el.simScore,
    `SIM SCORE ${signed(result.score, 1)} | COVERAGE ${Math.round(result.coverage * 100)}%`,
    toneClass(result.score)
  );
}

function renderQa() {
  const total = state.qaEvents.length;
  const hits = state.qaEvents.filter((item) => item.type === "hit").length;
  const misses = state.qaEvents.filter((item) => item.type === "miss").length;
  const hitRate = total ? (hits / total) * 100 : 0;
  el.qaStats.innerHTML = `
    <div class="row"><span class="name">총 평가</span><span class="rate">${total}</span><span class="score">events</span></div>
    <div class="row"><span class="name">적중/오탐</span><span class="rate up">${hits}</span><span class="score dn">${misses}</span></div>
    <div class="row"><span class="name">적중률</span><span class="rate ${hitRate >= 60 ? "up" : "neutral"}">${hitRate.toFixed(1)}%</span><span class="score">target 60%</span></div>
  `;
}

function renderRelease() {
  const history = state.release.history.slice(0, 5);
  const rows = [
    `<div class="row"><span class="name">현재 버전</span><span class="rate up">${state.release.current}</span><span class="score">active</span></div>`
  ];
  history.forEach((ver, idx) => {
    rows.push(
      `<div class="row"><span class="name">이전 ${idx + 1}</span><span class="rate">${ver}</span><span class="score">rollback</span></div>`
    );
  });
  el.releaseInfo.innerHTML = rows.join("");
}

function renderTimestamp(modeLabel) {
  el.lastUpdated.textContent = `${modeLabel} ${new Date().toLocaleTimeString("ko-KR")}`;
}

function applySnapshot({ health, prediction, futures }, modeLabel) {
  state.futures = futures || [];
  state.prediction = prediction || null;
  renderTopStats(health || { status: "error" }, state.prediction);
  renderContributors();
  renderSimulation();
  renderTimestamp(modeLabel);
}

async function refreshNow() {
  el.refreshBtn.disabled = true;
  el.refreshBtn.textContent = "SYNCING...";

  try {
    const snapshot = await fetchOpsSnapshot();
    applySnapshot(
      {
        health: snapshot.health,
        prediction: snapshot.open?.prediction,
        futures: snapshot.open?.futures
      },
      "POLL"
    );
  } catch (error) {
    renderTopStats({ status: "error" }, null);
    el.contributors.innerHTML = `<div class="row"><span class="name">API 연결 실패</span><span class="rate dn">ERR</span><span class="score">check backend</span></div>`;
    renderTimestamp("FAIL");
  } finally {
    el.refreshBtn.disabled = false;
    el.refreshBtn.textContent = "LIVE REFRESH";
  }
}

function setupRealtime() {
  return connectRealtime({
    onConnected: () => {
      state.realtimeConnected = true;
      renderTimestamp("RT CONNECTED");
      renderTopStats({ status: "ok" }, state.prediction);
    },
    onDisconnected: () => {
      state.realtimeConnected = false;
      renderTimestamp("RT LOST");
      renderTopStats({ status: "ok" }, state.prediction);
      void refreshNow();
    },
    onSnapshot: (snapshot) => {
      const data = snapshot?.data || {};
      applySnapshot(
        {
          health: data.health,
          prediction: data.prediction,
          futures: data.futures
        },
        "RT"
      );
    },
    onError: () => {
      state.realtimeConnected = false;
    }
  });
}

function bindEvents() {
  el.refreshBtn.addEventListener("click", refreshNow);

  el.addHitBtn.addEventListener("click", () => {
    state.qaEvents = appendQaEvent("hit");
    renderQa();
  });
  el.addMissBtn.addEventListener("click", () => {
    state.qaEvents = appendQaEvent("miss");
    renderQa();
  });
  el.clearQaBtn.addEventListener("click", () => {
    state.qaEvents = clearQaEvents();
    renderQa();
  });

  el.applyVersionBtn.addEventListener("click", () => {
    const value = String(el.versionInput.value || "").trim();
    if (!value) return;
    state.release = applyReleaseVersion(value);
    el.versionInput.value = "";
    renderRelease();
  });

  el.rollbackBtn.addEventListener("click", () => {
    state.release = rollbackRelease();
    renderRelease();
  });
}

function boot() {
  buildWeightControls();
  renderQa();
  renderRelease();
  renderSimulation();
  bindEvents();
  void refreshNow();

  const disconnectRealtime = setupRealtime();
  window.addEventListener("beforeunload", () => {
    disconnectRealtime?.();
  });

  setInterval(() => {
    if (!state.realtimeConnected) {
      void refreshNow();
    }
  }, REFRESH_MS);
}

boot();
