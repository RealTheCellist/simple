import { config } from "../config.js";
import { getCached, setCached } from "../lib/cache.js";
import { fetchJson } from "../lib/http.js";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

const FUTURES_SEED = [
  { symbol: "NQ=F", name: "NASDAQ" },
  { symbol: "ES=F", name: "S&P500" },
  { symbol: "YM=F", name: "DOW" },
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "KRW=X", name: "USD-KRW" }
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeIsoFromUnix(unixSec) {
  const value = toNumber(unixSec);
  if (!value) return new Date().toISOString();
  return new Date(value * 1000).toISOString();
}

function symbolFromTicker(tickerRaw) {
  const ticker = String(tickerRaw || "").trim().toUpperCase();
  if (!ticker) return "";
  if (/^\d{6}$/.test(ticker)) return `${ticker}.KS`;
  return ticker;
}

function syntheticQuote(symbol, name) {
  const seedMap = {
    "005930.KS": 84500,
    "NQ=F": 18640,
    "ES=F": 5235,
    "YM=F": 39210,
    "^KS11": 2725,
    "^KQ11": 905,
    "KRW=X": 1367
  };

  const base = seedMap[symbol] ?? 100;
  const hash = [...symbol].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const phase = Date.now() / 1000 / 90 + hash;
  const swingRate = Math.sin(phase) * 0.55;
  const price = base * (1 + swingRate / 100);
  const change = price - base;
  const changeRate = base > 0 ? (change / base) * 100 : 0;

  return {
    symbol,
    ticker: symbol,
    name: name || symbol,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changeRate: Number(changeRate.toFixed(2)),
    timestamp: new Date().toISOString(),
    source: "mock"
  };
}

function parseYahooChart(symbol, payload, displayName) {
  const row = payload?.chart?.result?.[0];
  const meta = row?.meta ?? {};
  const closes = row?.indicators?.quote?.[0]?.close ?? [];
  const reversed = [...closes].reverse();
  const lastClose = reversed.find((value) => Number.isFinite(value));
  const price = toNumber(meta.regularMarketPrice, toNumber(lastClose, 0));
  const previousClose = toNumber(meta.chartPreviousClose, toNumber(meta.previousClose, price));
  const change = price - previousClose;
  const changeRate = previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    ticker: symbol,
    name: displayName || meta.longName || meta.shortName || symbol,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changeRate: Number(changeRate.toFixed(2)),
    timestamp: safeIsoFromUnix(meta.regularMarketTime),
    source: "yahoo"
  };
}

async function fetchQuoteFromYahoo(symbol, displayName) {
  const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=true`;
  const payload = await fetchJson(url, config.upstreamTimeoutMs);
  return parseYahooChart(symbol, payload, displayName);
}

export async function fetchPrice(tickerRaw) {
  const symbol = symbolFromTicker(tickerRaw);
  if (!symbol) return null;
  const cacheKey = `price:${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const quote = await fetchQuoteFromYahoo(symbol);
    return setCached(cacheKey, quote, config.cacheTtlMs);
  } catch (error) {
    if (!config.mockFallback) return null;
    const quote = syntheticQuote(symbol);
    return setCached(cacheKey, quote, config.cacheTtlMs);
  }
}

export async function fetchBatchPrices(tickersRaw) {
  const tickers = (Array.isArray(tickersRaw) ? tickersRaw : [])
    .map((ticker) => symbolFromTicker(ticker))
    .filter(Boolean);

  const jobs = tickers.map(async (ticker) => {
    const quote = await fetchPrice(ticker);
    return [ticker, quote];
  });

  const pairs = await Promise.all(jobs);
  const payload = {};
  pairs.forEach(([ticker, quote]) => {
    if (quote) payload[ticker] = quote;
  });
  return payload;
}

export async function fetchFuturesSnapshot() {
  const cacheKey = "futures:snapshot";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const jobs = FUTURES_SEED.map(async (item) => {
    try {
      return await fetchQuoteFromYahoo(item.symbol, item.name);
    } catch (error) {
      if (!config.mockFallback) return null;
      return syntheticQuote(item.symbol, item.name);
    }
  });

  const baseRows = (await Promise.all(jobs)).filter(Boolean);
  const kospi = baseRows.find((row) => /KOSPI/i.test(row.name));
  const k200 = kospi
    ? {
        symbol: "KOSPI200",
        ticker: "KOSPI200",
        name: "KOSPI200",
        price: Number((kospi.price / 7.45).toFixed(2)),
        change: Number(((kospi.change / 7.45) * 1.05).toFixed(2)),
        changeRate: Number((kospi.changeRate * 1.05).toFixed(2)),
        timestamp: kospi.timestamp,
        source: kospi.source
      }
    : syntheticQuote("KOSPI200", "KOSPI200");

  const rows = [k200, ...baseRows];
  return setCached(cacheKey, rows, config.cacheTtlMs);
}
