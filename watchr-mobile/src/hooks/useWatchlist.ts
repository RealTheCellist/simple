// src/hooks/useWatchlist.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBatch } from '../api/client';
import { checkAlerts } from './useAlerts';

const WATCHLIST_KEY = 'sm_watchlist';

export const useWatchlist = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load watchlist from AsyncStorage
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const stored = await AsyncStorage.getItem(WATCHLIST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setTickers(parsed);
        }
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  // Save watchlist to AsyncStorage
  const saveWatchlist = useCallback(async (newTickers: string[]) => {
    try {
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(newTickers));
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }, []);

  // Add ticker to watchlist
  const addTicker = useCallback(async (ticker: string) => {
    const upperTicker = ticker.toUpperCase();
    
    if (tickers.includes(upperTicker)) {
      return; // Already exists
    }

    const newTickers = [...tickers, upperTicker];
    setTickers(newTickers);
    await saveWatchlist(newTickers);
  }, [tickers, saveWatchlist]);

  // Remove ticker from watchlist
  const removeTicker = useCallback(async (ticker: string) => {
    const newTickers = tickers.filter(t => t !== ticker);
    setTickers(newTickers);
    await saveWatchlist(newTickers);
  }, [tickers, saveWatchlist]);

  // Fetch prices for all tickers
  const fetchPrices = useCallback(async () => {
    if (tickers.length === 0) {
      return;
    }

    try {
      const batchData = await fetchBatch(tickers);
      if (batchData) {
        setPrices(batchData);

        // Build price map for alert checking
        const priceMap: Record<string, number> = {};
        Object.keys(batchData).forEach(ticker => {
          priceMap[ticker] = batchData[ticker].price;
        });

        // Check alerts
        checkAlerts(priceMap);
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  }, [tickers]);

  // Set up polling
  useEffect(() => {
    if (tickers.length > 0) {
      // Fetch immediately
      fetchPrices();
      
      // Set up interval
      intervalRef.current = setInterval(() => {
        fetchPrices();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchPrices]);

  return {
    tickers,
    prices,
    addTicker,
    removeTicker,
    isLoading
  };
};