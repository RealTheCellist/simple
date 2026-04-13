# WATCHR Operations Automation

## Objective

Automate routine health checks so we can detect regressions early without manual daily checks.

## Workflow

- File: `.github/workflows/ops-routine.yml`
- Trigger:
  - daily schedule (`00:15 UTC`)
  - manual run (`workflow_dispatch`)

## What runs automatically

1. Platform checks
- `watchr-web`: test, build, perf budget, dist smoke
- `watchr-api`: lint, test
- `watchr-ops`: build, dist smoke
- `watchr-mobile`: typecheck
- `watchr-quant-lab`: test + sample backtest report

2. Production probe
- Script: `.github/scripts/ops-probe.mjs`
- Optional URL secrets:
  - `WATCHR_WEB_URL`
  - `WATCHR_API_URL`
  - `WATCHR_OPS_URL`
- Probe result is published as workflow summary + artifact (`ops-probe-summary`)

## Recommended repository secrets

- `WATCHR_WEB_URL` (example: `https://watchr-web.example.com`)
- `WATCHR_API_URL` (example: `https://watchr-api.example.com`)
- `WATCHR_OPS_URL` (example: `https://watchr-ops.example.com`)

If a secret is missing, that probe line is marked `SKIP`.

## Optional strict mode

`OPS_PROBE_STRICT=true` makes the probe job fail when configured endpoints fail.
Current default is `false` to avoid noisy red runs before URLs/secrets are finalized.
