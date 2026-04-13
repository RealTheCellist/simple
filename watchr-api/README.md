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
- `ENTERPRISE_TOKEN_SECRET`
- `ENTERPRISE_TOKEN_TTL_SEC`
- `ENTERPRISE_AUDIT_MAX_ENTRIES`

## Demo Enterprise Accounts

- `admin@watchr.local` / `admin123`
- `trader@watchr.local` / `trader123`
- `viewer@watchr.local` / `viewer123`

## Notes

- 기본 외부 데이터 소스는 Yahoo chart API
- 외부 호출 실패 시 `MOCK_FALLBACK=true`이면 모의 데이터 응답
- WebSocket은 주기적으로 snapshot을 브로드캐스트

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
