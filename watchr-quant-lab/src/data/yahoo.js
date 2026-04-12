const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

const FACTOR_SYMBOLS = {
  nq: "NQ=F",
  sp: "ES=F",
  dow: "YM=F",
  k200: "^KS11",
  kosdaq: "^KQ11",
  usdkrw: "KRW=X"
};

const TARGET_SYMBOL = "^KS11";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateLabel(unixSec) {
  return new Date(unixSec * 1000).toISOString().slice(0, 10);
}

async function fetchChart(symbol, years = 5) {
  const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?range=${years}y&interval=1d&includePrePost=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo fetch failed ${response.status} for ${symbol}`);
  }
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};
  const opens = quote.open ?? [];
  const closes = quote.close ?? [];

  const rows = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const ts = safeNumber(timestamps[i]);
    const open = safeNumber(opens[i]);
    const close = safeNumber(closes[i]);
    if (!ts || open === null || close === null) continue;
    rows.push({
      date: toDateLabel(ts),
      open,
      close
    });
  }
  return rows;
}

function pctChange(current, prev) {
  if (!Number.isFinite(current) || !Number.isFinite(prev) || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

export async function loadRowsFromYahoo({ years = 5 } = {}) {
  const symbolEntries = Object.entries(FACTOR_SYMBOLS);
  const chartPairs = await Promise.all(
    symbolEntries.map(async ([key, symbol]) => [key, await fetchChart(symbol, years)])
  );
  const targetRows = await fetchChart(TARGET_SYMBOL, years);

  const factorByDate = Object.fromEntries(chartPairs.map(([key, rows]) => [key, rows]));
  const dateSet = new Set();
  chartPairs.forEach(([, rows]) => rows.forEach((row) => dateSet.add(row.date)));
  targetRows.forEach((row) => dateSet.add(row.date));
  const dates = [...dateSet].sort();

  const factorMaps = {};
  for (const [key, rows] of Object.entries(factorByDate)) {
    factorMaps[key] = new Map(rows.map((row) => [row.date, row]));
  }
  const targetMap = new Map(targetRows.map((row) => [row.date, row]));

  const dataset = [];
  for (let i = 2; i < dates.length; i += 1) {
    const dPrev2 = dates[i - 2];
    const dPrev1 = dates[i - 1];
    const dNow = dates[i];

    const factorValues = {};
    let valid = true;
    for (const key of Object.keys(FACTOR_SYMBOLS)) {
      const prev2 = factorMaps[key].get(dPrev2);
      const prev1 = factorMaps[key].get(dPrev1);
      if (!prev2 || !prev1) {
        valid = false;
        break;
      }
      const change = pctChange(prev1.close, prev2.close);
      if (change === null) {
        valid = false;
        break;
      }
      factorValues[key] = Number(change.toFixed(6));
    }
    if (!valid) continue;

    const targetPrev = targetMap.get(dPrev1);
    const targetNow = targetMap.get(dNow);
    if (!targetPrev || !targetNow) continue;
    const openGap = pctChange(targetNow.open, targetPrev.close);
    if (openGap === null) continue;

    dataset.push({
      date: dNow,
      factors: factorValues,
      openReturnPct: Number(openGap.toFixed(6))
    });
  }

  return dataset;
}
