# WATCHR Ops

WATCHR 운영/전략 대시보드입니다.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build
npm run check:smoke
```

## Realtime

- 기본 연결: `ws://<api-host>/ws`
- 실시간 연결 성공 시 Ops는 `RT` 모드로 표시
- 실시간이 끊기면 자동으로 HTTP 폴링 모드로 fallback

## Main Panels

- API health + 실시간 시그널
- 본장 예측 score/confidence
- 지수 기여도
- 가중치 실험실
- 알림 품질 추적
- 릴리즈 버전 / 롤백 이력
