import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AlertCondition } from "../types/alerts";
import { appendHistoryLog } from "../store/historyStore";
import { isOnCooldown, markCooldown, sendAlert } from "../notifications/alertNotify";

const ALERTS_KEY = "sm_alerts";
const COOLDOWN_MS = 60 * 60 * 1000;

const listeners = new Set<(alerts: AlertCondition[]) => void>();
let cache: AlertCondition[] = [];
let hydrated = false;

async function loadAlertsFromStorage(): Promise<AlertCondition[]> {
  try {
    const raw = await AsyncStorage.getItem(ALERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AlertCondition[];
  } catch (error) {
    console.warn("[Alerts] load failed", error);
    return [];
  }
}

async function saveAlertsToStorage(alerts: AlertCondition[]) {
  try {
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.warn("[Alerts] save failed", error);
  }
}

async function hydrate() {
  if (hydrated) return cache;
  cache = await loadAlertsFromStorage();
  hydrated = true;
  return cache;
}

function emit(next: AlertCondition[]) {
  cache = next;
  listeners.forEach((listener) => listener(cache));
}

async function persist(next: AlertCondition[]) {
  await saveAlertsToStorage(next);
  emit(next);
}

export async function getStoredAlerts(): Promise<AlertCondition[]> {
  return hydrate();
}

export async function evaluateAlertsFromPriceMap(priceMap: Record<string, number>): Promise<number> {
  const alerts = await getStoredAlerts();
  let fired = 0;
  let changed = false;

  const next = alerts.map((alert) => {
    const enabled = alert.enabled !== false;
    const currentPrice = priceMap[alert.ticker];
    if (!enabled || currentPrice === undefined) return alert;

    const hit = alert.operator === "above" ? currentPrice >= alert.price : currentPrice <= alert.price;
    if (!hit) return alert;
    if (Date.now() - Number(alert.lastFiredAt || 0) < COOLDOWN_MS) return alert;
    if (isOnCooldown(alert.id)) return alert;

    fired += 1;
    changed = true;
    markCooldown(alert.id);

    void sendAlert(
      `${alert.ticker} ${alert.operator.toUpperCase()} ${alert.price.toLocaleString("ko-KR")}`,
      `Current: ${currentPrice.toLocaleString("ko-KR")}`
    );

    void appendHistoryLog({
      ticker: alert.ticker,
      price: currentPrice,
      operator: alert.operator,
      target: alert.price,
      time: new Date().toISOString()
    });

    return { ...alert, lastFiredAt: Date.now() };
  });

  if (changed) {
    await persist(next);
  }

  return fired;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertCondition[]>(cache);

  useEffect(() => {
    listeners.add(setAlerts);
    void hydrate().then((next) => setAlerts(next));
    return () => {
      listeners.delete(setAlerts);
    };
  }, []);

  const refresh = useCallback(async () => {
    const next = await loadAlertsFromStorage();
    hydrated = true;
    emit(next);
  }, []);

  const addAlert = useCallback(async (input: Omit<AlertCondition, "id">) => {
    const normalizedTicker = input.ticker.trim().toUpperCase();
    if (!normalizedTicker) return;

    const duplicate = cache.find(
      (item) =>
        item.ticker === normalizedTicker &&
        item.operator === input.operator &&
        Number(item.price) === Number(input.price)
    );
    if (duplicate) return;

    const next: AlertCondition[] = [
      ...cache,
      {
        ...input,
        ticker: normalizedTicker,
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        enabled: true,
        lastFiredAt: 0
      }
    ];
    await persist(next);
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    const next = cache.filter((item) => item.id !== id);
    await persist(next);
  }, []);

  const toggleAlert = useCallback(async (id: string) => {
    const next = cache.map((item) =>
      item.id === id ? { ...item, enabled: item.enabled === false } : item
    );
    await persist(next);
  }, []);

  return { alerts, addAlert, removeAlert, toggleAlert, refresh };
}

export function useAlertsCount() {
  const { alerts } = useAlerts();
  return alerts.filter((item) => item.enabled !== false).length;
}
