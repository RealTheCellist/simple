import { API_BASE_URL } from "./config";

async function fetchJson(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${path}`);
  }
  return await res.json();
}

export async function fetchOpsSnapshot() {
  const [health, open] = await Promise.all([fetchJson("/health"), fetchJson("/api/predict/open")]);
  return { health, open };
}
