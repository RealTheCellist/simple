const fromEnv = (key, fallback) => {
  const value = import.meta.env[key];
  return value === undefined || value === "" ? fallback : value;
};

export const API_BASE_URL = fromEnv("VITE_API_BASE_URL", "http://127.0.0.1:3800");
export const REFRESH_MS = Number(fromEnv("VITE_OPS_REFRESH_MS", "30000"));
export const WS_PATH = fromEnv("VITE_REALTIME_PATH", "/ws");

export function resolveRealtimeUrl(apiBaseUrl = API_BASE_URL) {
  try {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = WS_PATH;
    url.search = "";
    return url.toString();
  } catch (error) {
    return "ws://127.0.0.1:3800/ws";
  }
}
