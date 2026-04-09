// src/utils/alertNotify.ts
import * as Notifications from 'expo-notifications';
import { addLog } from '../hooks/useHistory';

const cooldowns = new Map<string, number>();

export const requestPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
};

export const sendAlert = async (title: string, body: string, ticker?: string, price?: number, operator?: 'above' | 'below', target?: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null,
  });

  // Add to history if all parameters are provided
  if (ticker && price !== undefined && operator && target !== undefined) {
    addLog({
      ticker,
      price,
      operator,
      target,
      time: new Date().toLocaleTimeString('ko-KR')
    });
  }
};

export const isOnCooldown = (id: string): boolean => {
  const lastSent = cooldowns.get(id);
  if (!lastSent) return false;
  
  const now = Date.now();
  const cooldownPeriod = 60 * 60 * 1000; // 1 hour in milliseconds
  
  return now - lastSent < cooldownPeriod;
};

export const markCooldown = (id: string) => {
  cooldowns.set(id, Date.now());
};