import { WebSocket, WebSocketServer } from "ws";
import {
  normalizeChannels,
  parseClientMessage,
  REALTIME_CHANNELS,
  selectSnapshotChannels
} from "./protocol.js";

function safeSend(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

export function createRealtimeHub({ server, path = "/ws", broadcastMs = 5000, snapshotBuilder }) {
  const wss = new WebSocketServer({ server, path });
  const clientState = new Map();
  let timer = null;
  const startedAt = new Date().toISOString();

  function connectionCount() {
    return clientState.size;
  }

  function status() {
    return {
      enabled: true,
      path,
      broadcastMs,
      startedAt,
      connections: connectionCount(),
      channels: REALTIME_CHANNELS
    };
  }

  async function pushSnapshot(targets = null) {
    if (clientState.size === 0) return;
    const snapshot = await snapshotBuilder();
    const entries = targets ?? [...clientState.entries()];
    entries.forEach(([ws, state]) => {
      safeSend(ws, {
        type: "snapshot",
        snapshot: selectSnapshotChannels(snapshot, state.channels)
      });
    });
  }

  function onConnection(ws) {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    clientState.set(ws, {
      id,
      channels: [...REALTIME_CHANNELS],
      connectedAt: Date.now(),
      messagesIn: 0
    });

    safeSend(ws, {
      type: "welcome",
      clientId: id,
      channels: REALTIME_CHANNELS,
      serverTime: new Date().toISOString()
    });

    ws.on("message", async (raw) => {
      const state = clientState.get(ws);
      if (!state) return;
      state.messagesIn += 1;
      const incoming = parseClientMessage(raw);

      if (incoming.type === "invalid") {
        safeSend(ws, { type: "error", code: "INVALID_MESSAGE", reason: incoming.reason });
        return;
      }

      if (incoming.type === "ping") {
        safeSend(ws, { type: "pong", serverTime: new Date().toISOString() });
        return;
      }

      if (incoming.type === "subscribe") {
        state.channels = normalizeChannels(incoming.payload?.channels);
        safeSend(ws, { type: "subscribed", channels: state.channels });
        return;
      }

      if (incoming.type === "snapshot" || incoming.type === "get_snapshot") {
        await pushSnapshot([[ws, state]]);
        return;
      }

      safeSend(ws, { type: "error", code: "UNKNOWN_TYPE" });
    });

    ws.on("close", () => {
      clientState.delete(ws);
    });

    ws.on("error", () => {
      clientState.delete(ws);
    });
  }

  function start() {
    if (timer) return;
    wss.on("connection", onConnection);
    timer = setInterval(() => {
      void pushSnapshot();
    }, broadcastMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    wss.clients.forEach((client) => {
      try {
        client.close(1001, "server_shutdown");
      } catch (error) {
        // ignore
      }
    });
    wss.close();
    clientState.clear();
  }

  return {
    start,
    stop,
    status,
    pushSnapshot
  };
}
