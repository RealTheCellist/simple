# WATCHR Web (Production Ready)

Deployable Vite web app for WATCHR with runtime controls, fallback mode, and host configs.

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

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

- `VITE_API_BASE_URL`: backend base URL
- `VITE_ENABLE_MOCK_FALLBACK`: `true` or `false`
- `VITE_API_TIMEOUT_MS`: request timeout in ms
- `VITE_MAX_HISTORY_LOGS`: max stored history rows

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

## Implemented app features

- Watchlist CRUD + local persistence (`sm_watchlist`)
- Futures polling view
- Alerts CRUD + cooldown trigger (`sm_alerts`)
- Trigger history + summary cards (`sm_history`)
- Browser notification support
- Mock fallback mode when backend is unavailable
