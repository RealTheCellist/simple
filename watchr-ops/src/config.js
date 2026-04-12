const fromEnv = (key, fallback) => {
  const value = import.meta.env[key];
  return value === undefined || value === "" ? fallback : value;
};

export const API_BASE_URL = fromEnv("VITE_API_BASE_URL", "http://127.0.0.1:3800");
export const REFRESH_MS = Number(fromEnv("VITE_OPS_REFRESH_MS", "30000"));
