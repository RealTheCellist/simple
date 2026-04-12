# WATCHR API

WATCHR Web + WATCHR Mobile이 공통으로 사용하는 Node.js 백엔드입니다.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

기본 주소: `http://localhost:3000`

## Endpoints

- `GET /health`
- `GET /api/price/:ticker`
- `GET /api/price/batch?tickers=005930.KS,AAPL,NQ=F`
- `GET /api/futures`
- `GET /api/predict/open`

## Notes

- 외부 데이터는 Yahoo chart API를 사용합니다.
- 외부 호출 실패 시 `MOCK_FALLBACK=true`이면 모의 데이터로 응답합니다.
- 웹/모바일 시연과 로컬 개발 안정성을 위해 짧은 TTL 캐시를 사용합니다.

## Docker

```bash
docker build -t watchr-api .
docker run --rm -p 3000:3000 --env-file .env watchr-api
```

## Quality checks

```bash
npm run lint
npm test
```
