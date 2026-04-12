import { createRng } from "../utils/rng.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDateLabel(date) {
  return date.toISOString().slice(0, 10);
}

export function generateSyntheticRows({ days = 756, seed = 42 } = {}) {
  const rng = createRng(seed);
  const rows = [];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  let globalMomentum = 0;
  let regimeShift = 0;

  for (let i = 0; i < days; i += 1) {
    if (rng.next() < 0.05) {
      regimeShift = clamp(regimeShift + rng.normal(0, 0.08), -0.35, 0.35);
    }

    globalMomentum = 0.9 * globalMomentum + regimeShift + rng.normal(0, 0.24);
    const nq = globalMomentum + rng.normal(0, 0.33);
    const sp = 0.86 * globalMomentum + rng.normal(0, 0.28);
    const dow = 0.7 * globalMomentum + rng.normal(0, 0.25);
    const k200 = 0.76 * globalMomentum + rng.normal(0, 0.29);
    const kosdaq = 0.58 * globalMomentum + rng.normal(0, 0.35);
    const usdkrw = -0.55 * globalMomentum + rng.normal(0, 0.27);

    const theoreticalEdge =
      nq * 0.3 + sp * 0.25 + dow * 0.1 + k200 * 0.2 + kosdaq * 0.1 - usdkrw * 0.05;
    const openReturnPct = clamp(theoreticalEdge * 0.24 + rng.normal(0, 0.95), -3.1, 3.1);

    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    rows.push({
      date: toDateLabel(date),
      factors: {
        nq: Number(nq.toFixed(4)),
        sp: Number(sp.toFixed(4)),
        dow: Number(dow.toFixed(4)),
        k200: Number(k200.toFixed(4)),
        kosdaq: Number(kosdaq.toFixed(4)),
        usdkrw: Number(usdkrw.toFixed(4))
      },
      openReturnPct: Number(openReturnPct.toFixed(4))
    });
  }
  return rows;
}
