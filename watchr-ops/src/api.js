import { API_BASE_URL, resolveRealtimeUrl } from "./config";

const ENTERPRISE_TOKEN_KEY = "ops_enterprise_token";

function headersWithAuth(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: headersWithAuth(token),
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.error || `${response.status} ${path}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export function loadEnterpriseToken() {
  return localStorage.getItem(ENTERPRISE_TOKEN_KEY) ?? "";
}

export function saveEnterpriseToken(token) {
  if (!token) {
    localStorage.removeItem(ENTERPRISE_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ENTERPRISE_TOKEN_KEY, token);
}

export async function fetchOpsSnapshot() {
  const [health, open] = await Promise.all([
    fetchJson("/health"),
    fetchJson("/api/predict/open")
  ]);
  return { health, open };
}

export async function enterpriseLogin({ email, password }) {
  return fetchJson("/api/enterprise/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function enterpriseMe(token) {
  return fetchJson("/api/enterprise/me", { token });
}

export async function enterpriseAudit(token, { limit = 30 } = {}) {
  return fetchJson(`/api/enterprise/audit?limit=${encodeURIComponent(String(limit))}`, { token });
}

export function connectRealtime({ onSnapshot, onConnected, onDisconnected, onError }) {
  const url = resolveRealtimeUrl(API_BASE_URL);
  let socket = null;
  let closedByClient = false;
  let reconnectTimer = null;
  const reconnectMs = 3500;

  function cleanupReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (closedByClient) return;
    cleanupReconnect();
    reconnectTimer = setTimeout(() => {
      connect();
    }, reconnectMs);
  }

  function connect() {
    try {
      socket = new WebSocket(url);
    } catch (error) {
      onError?.(error);
      scheduleReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      onConnected?.({ url });
      socket.send(
        JSON.stringify({
          type: "subscribe",
          channels: ["health", "prediction", "futures"]
        })
      );
      socket.send(JSON.stringify({ type: "snapshot" }));
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data || ""));
        if (payload?.type === "snapshot") {
          onSnapshot?.(payload.snapshot);
        }
      } catch (error) {
        onError?.(error);
      }
    });

    socket.addEventListener("error", (event) => {
      onError?.(event);
    });

    socket.addEventListener("close", () => {
      onDisconnected?.();
      scheduleReconnect();
    });
  }

  connect();

  return () => {
    closedByClient = true;
    cleanupReconnect();
    if (socket && socket.readyState <= 1) {
      socket.close(1000, "client_close");
    }
  };
}
