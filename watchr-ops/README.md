# WATCHR Ops

운영/전략용 대시보드입니다.  
`watchr-api`를 기준으로 예측 상태, 지표 기여도, 가중치 시뮬레이션, 알림 품질을 확인합니다.

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

## Main Panels

- API health + 실시간 시그널
- 본장 예측 score/confidence
- 가중치 실험실 (로컬 시뮬레이션)
- 알림 품질 기록 (로컬 이벤트)
- 릴리즈 버전 / 롤백 히스토리
