import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HistoryLog } from "../types/history";

export const HISTORY_KEY = "sm_history";
const MAX_LOGS = 50;

export async function loadHistoryLogs(): Promise<HistoryLog[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryLog[];
  } catch (error) {
    console.warn("[HistoryStore] load failed", error);
    return [];
  }
}

export async function saveHistoryLogs(logs: HistoryLog[]): Promise<void> {
  try {
    const next = logs.slice(0, MAX_LOGS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("[HistoryStore] save failed", error);
  }
}

export async function appendHistoryLog(log: HistoryLog): Promise<void> {
  const current = await loadHistoryLogs();
  const next = [log, ...current].slice(0, MAX_LOGS);
  await saveHistoryLogs(next);
}

export async function clearHistoryLogs(): Promise<void> {
  await saveHistoryLogs([]);
}

