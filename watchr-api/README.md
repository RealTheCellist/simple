# WATCHR API

WATCHR Web, Mobile, Ops가 공통으로 사용하는 Node.js 백엔드입니다.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

기본 주소: `http://localhost:3000`

## HTTP Endpoints

- `GET /health`
- `GET /api/price/:ticker`
- `GET /api/price/batch?tickers=005930.KS,AAPL,NQ=F`
- `GET /api/futures`
- `GET /api/predict/open`
- `GET /api/realtime/status`
- `GET /api/realtime/snapshot`
- `POST /api/enterprise/auth/login`
- `GET /api/enterprise/me`
- `GET /api/enterprise/roles`
- `GET /api/enterprise/users` (RBAC)
- `POST /api/enterprise/users` (RBAC)
- `GET /api/enterprise/audit` (RBAC)
- `POST /api/enterprise/decision` (RBAC)
- `GET /api/ops/metrics` (RBAC: `audit:read`)

## Realtime (WebSocket)

- 주소: `ws://localhost:3000/ws` (환경변수로 경로 변경 가능)
- 서버 이벤트
  - `welcome`
  - `snapshot`
  - `subscribed`
  - `pong`
  - `error`
- 클라이언트 이벤트
  - `{"type":"subscribe","channels":["health","prediction","futures"]}`
  - `{"type":"snapshot"}`
  - `{"type":"ping"}`

## Environment

- `PORT`, `HOST`
- `MOCK_FALLBACK`
- `UPSTREAM_TIMEOUT_MS`
- `CACHE_TTL_MS`
- `CORS_ORIGIN`
- `REALTIME_ENABLED`
- `REALTIME_PATH`
- `REALTIME_BROADCAST_MS`
- `ENTERPRISE_ENABLED`
- `ENTERPRISE_ALLOW_DEMO_USERS`
- `ENTERPRISE_BOOTSTRAP_ADMIN_EMAIL`
- `ENTERPRISE_BOOTSTRAP_ADMIN_PASSWORD`
- `ENTERPRISE_PASSWORD_MIN_LENGTH`
- `ENTERPRISE_TOKEN_SECRET`
- `ENTERPRISE_TOKEN_TTL_SEC`
- `ENTERPRISE_AUDIT_MAX_ENTRIES`
- `METRICS_ENABLED`

## Demo Enterprise Accounts

- `admin@watchr.local` / `admin12345`
- `trader@watchr.local` / `trader12345`
- `viewer@watchr.local` / `viewer12345`

## Notes

- 기본 외부 데이터 소스는 Yahoo chart API
- 외부 호출 실패 시 `MOCK_FALLBACK=true`이면 모의 데이터 응답
- WebSocket은 주기적으로 snapshot을 브로드캐스트
- 운영 환경(`NODE_ENV=production`)에서는 기본적으로 데모 계정이 비활성화됨
- 운영 시작 시 `ENTERPRISE_BOOTSTRAP_ADMIN_EMAIL/PASSWORD`로 관리자 계정 주입 필요

## Docker

```bash
docker build -t watchr-api .
docker run --rm -p 3000:3000 --env-file .env watchr-api
```

## Quality Checks

```bash
npm run lint
npm test
```
