import { useCallback, useEffect, useState } from "react";
import type { HistoryLog } from "../types/history";
import { clearHistoryLogs, loadHistoryLogs, saveHistoryLogs } from "../store/historyStore";

const listeners = new Set<(logs: HistoryLog[]) => void>();
let cache: HistoryLog[] = [];
let hydrated = false;

async function hydrate() {
  if (hydrated) return cache;
  cache = await loadHistoryLogs();
  hydrated = true;
  return cache;
}

function emit(next: HistoryLog[]) {
  cache = next;
  listeners.forEach((listener) => listener(cache));
}

async function persist(next: HistoryLog[]) {
  await saveHistoryLogs(next);
  emit(next);
}

export async function refreshHistoryCache() {
  const next = await loadHistoryLogs();
  hydrated = true;
  emit(next);
  return next;
}

export function useHistory() {
  const [logs, setLogs] = useState<HistoryLog[]>(cache);

  useEffect(() => {
    listeners.add(setLogs);
    void hydrate().then((next) => setLogs(next));
    return () => {
      listeners.delete(setLogs);
    };
  }, []);

  const addLog = useCallback(async (log: HistoryLog) => {
    const next = [log, ...cache].slice(0, 50);
    await persist(next);
  }, []);

  const clearAll = useCallback(async () => {
    await clearHistoryLogs();
    emit([]);
  }, []);

  const refresh = useCallback(async () => {
    await refreshHistoryCache();
  }, []);

  return { logs, addLog, clearAll, refresh };
}

