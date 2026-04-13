# Changelog

## v1.0.3 - 2026-04-13

- Added release note for `v1.0.2` and aligned latest release metadata
- Synced package versions across web/api/ops/mobile to `1.0.3`
- Added mobile CI workflow for TypeScript safety gate
- Hardened enterprise auth store with hashed passwords and stronger policy
- Added protected ops metrics endpoint for runtime observability

## v1.0.2 - 2026-04-13

- Published latest integrated release note (`watchr-web/releases/v1.0.2.md`)

## v1.0.1 - 2026-04-13

- Platform expansion release: `watchr-api`, `watchr-ops`, `watchr-quant-lab` integrated
- Quant Lab matured with real-data mode, walk-forward validation, and data policy/cost model
- Realtime pipeline shipped (API WebSocket hub + Ops subscribe/polling fallback)
- Enterprise capability shipped (auth login, RBAC permissions, audit trail)
- Production hardening and release sync updates across mobile/web tooling

## v1.0.0 - 2026-04-12

- Production deployment pipelines for Netlify and Vercel
- CI quality gates: tests, build, performance budget, dist smoke checks
- Futures-based main-session prediction with backtest tracking
- Adaptive weight tuning mode for prediction factors
- Runtime API resilience with timeout + retry/backoff
- Manual rollback workflow and rollback playbook
- Post-deploy checklist and hotfix template/process assets
