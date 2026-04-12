import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { fetchBatch, fetchPrice, type PriceData } from "../api/client";
import { evaluateAlertsFromPriceMap } from "./useAlerts";

const WATCHLIST_KEY = "sm_watchlist";

export async function loadStoredWatchlist(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).toUpperCase());
  } catch (error) {
    console.warn("[Watchlist] load failed", error);
    return [];
  }
}

export function useWatchlist() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistTickers = useCallback(async (next: string[]) => {
    setTickers(next);
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  }, []);

  const hydrateTickers = useCallback(async () => {
    const stored = await loadStoredWatchlist();
    setTickers(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void hydrateTickers();
  }, [hydrateTickers]);

  const addTicker = useCallback(
    async (ticker: string) => {
      const normalized = ticker.trim().toUpperCase();
      if (!normalized) return;
      if (tickers.includes(normalized)) return;
      await persistTickers([...tickers, normalized]);
    },
    [persistTickers, tickers]
  );

  const removeTicker = useCallback(
    async (ticker: string) => {
      const next = tickers.filter((item) => item !== ticker);
      setPrices((prev) => {
        const clone = { ...prev };
        delete clone[ticker];
        return clone;
      });
      await persistTickers(next);
    },
    [persistTickers, tickers]
  );

  const refreshPrices = useCallback(async () => {
    if (tickers.length === 0) return;

    let nextMap: Record<string, PriceData> = {};
    const batch = await fetchBatch(tickers);
    if (batch) {
      nextMap = batch;
    } else if (tickers.length === 1) {
      const single = await fetchPrice(tickers[0]);
      if (single) nextMap = { [tickers[0]]: single };
    }

    if (Object.keys(nextMap).length === 0) return;

    setPrices((prev) => ({ ...prev, ...nextMap }));

    const priceMap: Record<string, number> = {};
    Object.entries(nextMap).forEach(([ticker, quote]) => {
      priceMap[ticker] = quote.price;
    });
    await evaluateAlertsFromPriceMap(priceMap);
  }, [tickers]);

  useFocusEffect(
    useCallback(() => {
      void refreshPrices();
      intervalRef.current = setInterval(() => {
        void refreshPrices();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [refreshPrices])
  );

  return {
    tickers,
    prices,
    addTicker,
    removeTicker,
    isLoading,
    refreshPrices
  };
}

