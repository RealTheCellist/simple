import { API_BASE_URL, resolveRealtimeUrl } from "./config";

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
