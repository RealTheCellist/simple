# WATCHR Post-Deploy Checklist

Use this checklist immediately after production deployment.

## 0-5 minutes

1. Confirm GitHub Actions deploy workflow succeeded.
2. Open production URL and verify initial page render.
3. Check browser console for uncaught errors.
4. Verify API connectivity from `Connection > Check Backend`.

## 5-15 minutes

1. Watchlist add/remove works.
2. Futures tab loads grid + prediction card.
3. Adaptive toggle and backtest reset buttons respond.
4. Alerts add/toggle/remove works.
5. History tab summary numbers update correctly.

## 15-60 minutes

1. Confirm polling updates continue (`Watchlist`, `Futures`).
2. Verify notification permission and local alert trigger path.
3. Validate no abnormal latency spikes in network panel.
4. Check deploy alert webhook channel has no failure events.

## Rollback trigger guideline

Trigger rollback when any of the following persists over 10 minutes:

- Blank/broken UI on core route
- Futures/API fetch fails repeatedly despite healthy backend
- Prediction panel produces invalid or unstable output
- Alert/history core flows are blocked

Rollback procedure: `watchr-web/ROLLBACK.md`
