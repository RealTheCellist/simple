# WATCHR Web Deployment Guide

This project supports automatic production deploys via GitHub Actions.

## Workflows

- `ci.yml`: build/test check on push + pull request
- `deploy-netlify.yml`: deploy to Netlify production on push to `main/master` (or manual run)
- `deploy-vercel.yml`: deploy to Vercel production on push to `main/master` (or manual run)

## Required GitHub Secrets

Set these in `Repository Settings > Secrets and variables > Actions`.

### Netlify

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Vercel

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Recommended GitHub Variables

Set these in `Repository Settings > Secrets and variables > Actions > Variables`.

- `VITE_API_BASE_URL` (ex: `https://api.your-domain.com`)
- `VITE_ENABLE_MOCK_FALLBACK` (`true` or `false`, production recommended: `false`)
- `VITE_API_TIMEOUT_MS` (ex: `9000`)
- `VITE_MAX_HISTORY_LOGS` (ex: `300`)

## Trigger behavior

- CI runs on every push/PR that changes `watchr-web/**`
- Deploy workflows run on push to `main/master` when `watchr-web/**` changes
- You can also run deploy workflows manually from `Actions > Run workflow`

## Quick rollout checklist

1. Configure secrets and variables.
2. Push to `main` branch.
3. Confirm `CI`, `Deploy Netlify`, and/or `Deploy Vercel` pass.
4. Open deployed URL and verify API connectivity and notifications.
