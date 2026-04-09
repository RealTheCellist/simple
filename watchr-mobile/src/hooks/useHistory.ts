// src/hooks/useHistory.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryLog } from '../types/history';

const HISTORY_KEY = 'sm_history';

export const useHistory = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);

  // Load logs from AsyncStorage
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLogs(parsed);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadLogs();
  }, []);

  // Save logs to AsyncStorage
  const saveLogs = useCallback(async (newLogs: HistoryLog[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newLogs));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }, []);

  const addLog = useCallback((log: Omit<HistoryLog, 'time'>) => {
    const newLog: HistoryLog = {
      ...log,
      time: new Date().toISOString()
    };
    
    setLogs(prevLogs => {
      const newLogs = [newLog, ...prevLogs];
      
      // Keep only the latest 50 logs
      if (newLogs.length > 50) {
        newLogs.splice(50);
      }
      
      saveLogs(newLogs);
      return newLogs;
    });
  }, [saveLogs]);

  const getLogs = useCallback(() => {
    return logs;
  }, [logs]);

  const clearAll = useCallback(() => {
    setLogs([]);
    saveLogs([]);
  }, [saveLogs]);

  return {
    logs,
    addLog,
    getLogs,
    clearAll
  };
};