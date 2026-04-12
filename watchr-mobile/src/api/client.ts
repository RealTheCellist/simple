const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 9000;

export type PriceData = {
  ticker: string;
  price: number;
  change: number;
  changeRate: number;
  timestamp?: string;
};

export type FuturesData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  timestamp?: string;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.warn("[API]", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePrice(ticker: string, payload: any): PriceData {
  const price = toNumber(payload?.price);
  const change = toNumber(payload?.change);
  const changeRate = toNumber(payload?.changeRate ?? payload?.changePercent);
  return {
    ticker: payload?.ticker ?? payload?.symbol ?? ticker,
    price,
    change,
    changeRate,
    timestamp: payload?.timestamp
  };
}

function normalizeBatch(payload: any): Record<string, PriceData> {
  const result: Record<string, PriceData> = {};

  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      const ticker = String(item?.ticker ?? item?.symbol ?? "").toUpperCase();
      if (!ticker) return;
      result[ticker] = normalizePrice(ticker, item);
    });
    return result;
  }

  if (payload && Array.isArray(payload.data)) {
    return normalizeBatch(payload.data);
  }

  if (payload && typeof payload === "object") {
    Object.entries(payload).forEach(([key, value]) => {
      const ticker = key.toUpperCase();
      if (!value || typeof value !== "object") return;
      result[ticker] = normalizePrice(ticker, value);
    });
  }

  return result;
}

function normalizeFutures(payload: any): FuturesData[] {
  const rows: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : payload && typeof payload === "object"
          ? Object.values(payload)
          : [];

  return rows
    .filter((row: unknown): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      symbol: String(row.symbol ?? row.ticker ?? row.name ?? "UNKNOWN"),
      name: String(row.name ?? row.symbol ?? row.ticker ?? "UNKNOWN"),
      price: toNumber(row.price),
      change: toNumber(row.change),
      changeRate: toNumber(row.changeRate ?? row.changePercent),
      timestamp: typeof row.timestamp === "string" ? row.timestamp : undefined
    }));
}

export async function fetchPrice(ticker: string): Promise<PriceData | null> {
  const payload = await fetchJson<any>(`/api/price/${encodeURIComponent(ticker)}`);
  if (!payload) return null;
  return normalizePrice(ticker.toUpperCase(), payload);
}

export async function fetchBatch(tickers: string[]): Promise<Record<string, PriceData> | null> {
  const query = encodeURIComponent(tickers.join(","));
  const payload = await fetchJson<any>(`/api/price/batch?tickers=${query}`);
  if (!payload) return null;
  const normalized = normalizeBatch(payload);
  return Object.keys(normalized).length ? normalized : null;
}

export async function fetchFutures(): Promise<FuturesData[] | null> {
  const payload = await fetchJson<any>("/api/futures");
  if (!payload) return null;
  const normalized = normalizeFutures(payload);
  return normalized.length ? normalized : null;
}
