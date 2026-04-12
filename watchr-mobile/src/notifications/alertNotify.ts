import * as Notifications from "expo-notifications";

const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

export async function sendAlert(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null
  });
}

export function isOnCooldown(id: string) {
  const last = cooldownMap.get(id);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

export function markCooldown(id: string) {
  cooldownMap.set(id, Date.now());
}
