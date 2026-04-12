# WATCHR Web Deployment Guide

This project supports automatic production deploys via GitHub Actions.

## Workflows

- `ci.yml`: build/test check on push + pull request
- `deploy-netlify.yml`: deploy to Netlify production on push to `main/master` (or manual run)
- `deploy-vercel.yml`: deploy to Vercel production on push to `main/master` (or manual run)
- `rollback-deploy.yml`: manual rollback deploy from selected git ref

## Required GitHub Secrets

Set these in `Repository Settings > Secrets and variables > Actions`.

### Netlify

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Vercel

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Optional alerts

- `DEPLOY_ALERT_WEBHOOK_URL` (Slack/Discord compatible incoming webhook)

## Recommended GitHub Variables

Set these in `Repository Settings > Secrets and variables > Actions > Variables`.

- `VITE_API_BASE_URL` (ex: `https://api.your-domain.com`)
- `VITE_APP_VERSION` (ex: `1.0.0`)
- `VITE_ENABLE_MOCK_FALLBACK` (`true` or `false`, production recommended: `false`)
- `VITE_API_TIMEOUT_MS` (ex: `9000`)
- `VITE_API_RETRY_ATTEMPTS` (ex: `3`)
- `VITE_API_RETRY_BASE_MS` (ex: `350`)
- `VITE_API_RETRY_MAX_MS` (ex: `2200`)
- `VITE_MAX_HISTORY_LOGS` (ex: `300`)
- `VITE_PREDICTION_EVAL_MINUTES` (ex: `45`)
- `VITE_PREDICTION_CAPTURE_MINUTES` (ex: `10`)
- `VITE_PREDICTION_MIN_SAMPLES` (ex: `10`)
- `VITE_MAX_PREDICTION_LOGS` (ex: `500`)

## Trigger behavior

- CI runs on every push/PR that changes `watchr-web/**`
- Deploy workflows run on push to `main/master` when `watchr-web/**` changes
- You can also run deploy workflows manually from `Actions > Run workflow`
- Rollback workflow runs manually from `Actions > Rollback Deploy`

## Quick rollout checklist

1. Configure secrets and variables.
2. Push to `main` branch.
3. Confirm `CI`, `Deploy Netlify`, and/or `Deploy Vercel` pass.
4. Open deployed URL and verify API connectivity and notifications.

## Reliability gates in CI

- Prediction self-test
- Build verification
- Performance budget check (`perf-budget.json`)
- Dist smoke check (asset links + SPA fallback files)
