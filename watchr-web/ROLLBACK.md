# WATCHR Rollback Playbook

This playbook defines how to quickly redeploy a known-good revision when production quality degrades.

## Rollback trigger examples

- API timeout/5xx spike after release
- Prediction output quality regression
- Client runtime error increase (blank screen, repeated fetch failures)
- Core KPI degradation (alert trigger accuracy, futures load reliability)

## Fast rollback path (GitHub Actions)

Use workflow: `Rollback Deploy`

1. Open `Actions > Rollback Deploy > Run workflow`.
2. `target_ref`: enter last known-good commit SHA (recommended) or tag.
3. `provider`: choose `netlify`, `vercel`, or `both`.
4. Run and monitor logs until deployment success.
5. Validate smoke checks and key user flows.

## Rollback validation checklist

1. `/` route loads and tabs switch normally.
2. `Futures` panel renders cards and prediction card.
3. API check succeeds (or mock fallback behaves as expected).
4. Alerts add/toggle/remove works.
5. Build metadata in action run matches selected `target_ref`.

## Rehearsal cadence

- Run rollback rehearsal at least once every 2 weeks.
- Capture elapsed time from trigger to verification completion.
- Target rollback recovery time: <= 15 minutes.
