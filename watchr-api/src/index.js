import express from "express";
import { config } from "./config.js";
import { fetchBatchPrices, fetchFuturesSnapshot, fetchPrice } from "./services/marketData.js";
import { predictOpenFromFutures } from "./services/prediction.js";

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "watchr-api",
    env: config.nodeEnv,
    mockFallback: config.mockFallback,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/price/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker || "").trim();
  if (!ticker || ticker.length > 32) {
    return res.status(400).json({ error: "invalid_ticker" });
  }

  const quote = await fetchPrice(ticker);
  if (!quote) return res.status(502).json({ error: "upstream_unavailable" });
  return res.json(quote);
});

app.get("/api/price/batch", async (req, res) => {
  const raw = String(req.query.tickers || "").trim();
  if (!raw) return res.status(400).json({ error: "tickers_required" });
  const tickers = raw
    .split(",")
    .map((ticker) => ticker.trim())
    .filter(Boolean)
    .slice(0, 30);
  if (!tickers.length) return res.status(400).json({ error: "tickers_required" });

  const payload = await fetchBatchPrices(tickers);
  return res.json(payload);
});

app.get("/api/futures", async (req, res) => {
  const rows = await fetchFuturesSnapshot();
  return res.json(rows);
});

app.get("/api/predict/open", async (req, res) => {
  const futures = await fetchFuturesSnapshot();
  const prediction = predictOpenFromFutures(futures);
  return res.json({
    prediction,
    futures,
    generatedAt: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  console.error("[watchr-api]", error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(config.port, config.host, () => {
  console.log(`[watchr-api] running on http://${config.host}:${config.port}`);
});
