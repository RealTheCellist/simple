#!/usr/bin/env node

const timeoutMs = Number(process.env.OPS_PROBE_TIMEOUT_MS || 8000);
const strict = String(process.env.OPS_PROBE_STRICT || "false").toLowerCase() === "true";

const probes = [
  { name: "web", label: "WATCHR Web", baseUrl: process.env.WATCHR_WEB_URL, paths: ["/"] },
  {
    name: "api",
    label: "WATCHR API",
    baseUrl: process.env.WATCHR_API_URL,
    paths: ["/health", "/api/realtime/status", "/api/enterprise/health"]
  },
  { name: "ops", label: "WATCHR OPS", baseUrl: process.env.WATCHR_OPS_URL, paths: ["/"] }
];

function joinUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function fetchWithTimeout(url) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const elapsedMs = Date.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      elapsedMs
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    return {
      ok: false,
      status: "ERR",
      elapsedMs,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const rows = [];
  let configuredProbeFailed = false;

  for (const probe of probes) {
    if (!probe.baseUrl) {
      rows.push({
        service: probe.label,
        endpoint: "-",
        result: "SKIP",
        detail: "url_not_configured",
        elapsedMs: "-"
      });
      continue;
    }

    for (const path of probe.paths) {
      const url = joinUrl(probe.baseUrl, path);
      const result = await fetchWithTimeout(url);
      const row = {
        service: probe.label,
        endpoint: path,
        result: result.ok ? "PASS" : "FAIL",
        detail: result.ok ? String(result.status) : `${result.status}${result.error ? ` (${result.error})` : ""}`,
        elapsedMs: `${result.elapsedMs}ms`
      };
      rows.push(row);
      if (!result.ok) configuredProbeFailed = true;
    }
  }

  const header = [
    "## Ops Probe Summary",
    "",
    `- generatedAt: ${new Date().toISOString()}`,
    `- timeoutMs: ${timeoutMs}`,
    `- strictMode: ${strict}`,
    "",
    "| service | endpoint | result | detail | latency |",
    "|---|---|---|---|---|"
  ];

  const table = rows.map(
    (row) => `| ${row.service} | \`${row.endpoint}\` | ${row.result} | ${row.detail} | ${row.elapsedMs} |`
  );

  const markdown = [...header, ...table, ""].join("\n");
  process.stdout.write(markdown);

  if (strict && configuredProbeFailed) {
    process.exitCode = 1;
  }
}

await run();
