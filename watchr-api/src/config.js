import "dotenv/config";

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: toNumber(process.env.PORT, 3000),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  mockFallback: toBool(process.env.MOCK_FALLBACK, true),
  upstreamTimeoutMs: toNumber(process.env.UPSTREAM_TIMEOUT_MS, 9000),
  cacheTtlMs: toNumber(process.env.CACHE_TTL_MS, 5000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  realtimeEnabled: toBool(process.env.REALTIME_ENABLED, true),
  realtimePath: process.env.REALTIME_PATH || "/ws",
  realtimeBroadcastMs: toNumber(process.env.REALTIME_BROADCAST_MS, 5000),
  enterpriseEnabled: toBool(process.env.ENTERPRISE_ENABLED, true),
  enterpriseTokenSecret:
    process.env.ENTERPRISE_TOKEN_SECRET || "dev-enterprise-secret-change-this",
  enterpriseTokenTtlSec: toNumber(process.env.ENTERPRISE_TOKEN_TTL_SEC, 60 * 60 * 8),
  enterpriseAuditMaxEntries: toNumber(process.env.ENTERPRISE_AUDIT_MAX_ENTRIES, 2000)
};
