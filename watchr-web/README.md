# WATCHR Web (Production Ready)

Deployable Vite web app for WATCHR with runtime controls, fallback mode, and host configs.

Current release: `v1.0.3`

## Local run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

For LAN preview:

```bash
npm run preview:host
```

## Tests

```bash
npm run test
```

## Quality Gates

```bash
npm run check:perf
npm run check:smoke
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

- `VITE_API_BASE_URL`: backend base URL
- `VITE_APP_VERSION`: app release label (ex: `1.0.0`)
- `VITE_ENABLE_MOCK_FALLBACK`: `true` or `false`
- `VITE_API_TIMEOUT_MS`: request timeout in ms
- `VITE_API_RETRY_ATTEMPTS`: API retry attempts
- `VITE_API_RETRY_BASE_MS`: retry backoff base (ms)
- `VITE_API_RETRY_MAX_MS`: retry backoff cap (ms)
- `VITE_MAX_HISTORY_LOGS`: max stored history rows
- `VITE_PREDICTION_EVAL_MINUTES`: minutes before prediction result is evaluated
- `VITE_PREDICTION_CAPTURE_MINUTES`: minimum minutes between prediction snapshots
- `VITE_PREDICTION_MIN_SAMPLES`: minimum resolved samples for adaptive tuning
- `VITE_MAX_PREDICTION_LOGS`: max backtest snapshot rows

## Deployment targets

- `netlify.toml` included (build, SPA redirects, security headers)
- `vercel.json` included (build output, SPA rewrites, security headers)
- `public/_redirects` included for SPA fallback

## CI/CD (GitHub Actions)

Workflow files are in `../.github/workflows`:

- `ci.yml`
- `deploy-netlify.yml`
- `deploy-vercel.yml`

For required secrets/variables and rollout steps, see `DEPLOYMENT.md`.
Rollback procedure is documented in `ROLLBACK.md`.
Release history is tracked in `CHANGELOG.md`.
Post-deploy monitoring is in `POST_DEPLOY_CHECKLIST.md`.
Routine automation is documented in `OPERATIONS_AUTOMATION.md`.
Hotfix workflow template is in `HOTFIX_TEMPLATE.md`.

## Implemented app features

- Watchlist CRUD + local persistence (`sm_watchlist`)
- Futures polling view
- Futures-based main-session outlook prediction (signal, confidence, expected open move)
- Prediction backtest tracker (hit-rate and MAE) + adaptive weight tuning mode
- API retry with exponential backoff for transient network failures
- Alerts CRUD + cooldown trigger (`sm_alerts`)
- Trigger history + summary cards (`sm_history`)
- Browser notification support
- Mock fallback mode when backend is unavailable
