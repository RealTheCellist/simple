# WATCHR Hotfix Template (v1.0.1+)

Use this template when preparing a production hotfix release.

## 1) Branch naming

- Format: `hotfix/v<next_version>-<short-topic>`
- Example: `hotfix/v1.0.1-futures-timeout`

## 2) Scope rules

- Fix only production-impacting issues.
- Avoid unrelated refactors or visual redesign.
- Keep diff small and reversible.

## 3) Required checks

1. `npm run test`
2. `npm run build`
3. `npm run check:perf`
4. `npm run check:smoke`

## 4) Release metadata

- Update `watchr-web/package.json` version (patch bump)
- Append one section in `watchr-web/CHANGELOG.md`
- Prepare release body in `watchr-web/releases/v<version>.md`

## 5) Rollout

1. Merge hotfix branch to `main`
2. Tag release: `v<version>`
3. Push branch and tag
4. Monitor post-deploy checklist for 60 minutes

Checklist reference: `watchr-web/POST_DEPLOY_CHECKLIST.md`
