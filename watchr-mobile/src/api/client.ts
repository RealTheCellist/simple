// src/api/client.ts
import { Colors } from '../theme/tokens';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type PriceData = {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
};

export type FuturesData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
};

export const fetchPrice = async (ticker: string): Promise<PriceData | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/price/${ticker}`);
    if (!response.ok) {
      console.warn('[SM] fetchPrice failed:', response.status);
      return null;
    }
    const data: PriceData = await response.json();
    return data;
  } catch (error) {
    console.warn('[SM]', error);
    return null;
  }
};

export const fetchBatch = async (tickers: string[]): Promise<Record<string, PriceData> | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/price/batch?tickers=${tickers.join(',')}`);
    if (!response.ok) {
      console.warn('[SM] fetchBatch failed:', response.status);
      return null;
    }
    const data: Record<string, PriceData> = await response.json();
    return data;
  } catch (error) {
    console.warn('[SM]', error);
    return null;
  }
};

export const fetchFutures = async (): Promise<FuturesData[] | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/futures`);
    if (!response.ok) {
      console.warn('[SM] fetchFutures failed:', response.status);
      return null;
    }
    const data: FuturesData[] = await response.json();
    return data;
  } catch (error) {
    console.warn('[SM]', error);
    return null;
  }
};