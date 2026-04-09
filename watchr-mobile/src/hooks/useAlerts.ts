// src/hooks/useAlerts.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertCondition } from '../types/alerts';
import { sendAlert, isOnCooldown, markCooldown } from '../utils/alertNotify';

const ALERTS_KEY = 'sm_alerts';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<AlertCondition[]>([]);

  // Load alerts from AsyncStorage
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const stored = await AsyncStorage.getItem(ALERTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setAlerts(parsed);
        }
      } catch (error) {
        console.error('Failed to load alerts:', error);
      }
    };

    loadAlerts();
  }, []);

  // Save alerts to AsyncStorage
  const saveAlerts = useCallback(async (newAlerts: AlertCondition[]) => {
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }, []);

  const addAlert = useCallback((condition: Omit<AlertCondition, 'id'>) => {
    const newAlert: AlertCondition = {
      ...condition,
      id: Date.now().toString(36),
    };
    
    const newAlerts = [...alerts, newAlert];
    setAlerts(newAlerts);
    saveAlerts(newAlerts);
  }, [alerts, saveAlerts]);

  const removeAlert = useCallback((id: string) => {
    const newAlerts = alerts.filter(alert => alert.id !== id);
    setAlerts(newAlerts);
    saveAlerts(newAlerts);
  }, [alerts, saveAlerts]);

  const getAlerts = useCallback(() => {
    return alerts;
  }, [alerts]);

  const checkAlerts = useCallback((priceMap: Record<string, number>) => {
    alerts.forEach(alert => {
      const currentPrice = priceMap[alert.ticker];
      
      if (currentPrice === undefined) return;
      
      let fulfilled = false;
      
      if (alert.operator === 'above' && currentPrice >= alert.price) {
        fulfilled = true;
      } else if (alert.operator === 'below' && currentPrice <= alert.price) {
        fulfilled = true;
      }
      
      if (fulfilled && !isOnCooldown(alert.id)) {
        sendAlert(
          `${alert.ticker} 가격 알림`,
          `${alert.ticker}의 가격이 ${alert.operator === 'above' ? '상승' : '하락'}하여 ${alert.price}에 도달했습니다.`
        );
        markCooldown(alert.id);
      }
    });
  }, [alerts]);

  return {
    alerts,
    addAlert,
    removeAlert,
    getAlerts,
    checkAlerts,
  };
};