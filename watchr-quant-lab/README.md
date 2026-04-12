# WATCHR Quant Lab

WATCHR 예측 로직을 실제 투자 전에 검증하기 위한 백테스트 랩입니다.

## 핵심 목적

- 예측 점수 기반 전략의 성능 검증
- 임계값, 수수료, 포지션 크기 민감도 실험
- 리스크 지표(MDD, 샤프 유사치) 기반 의사결정 지원

## 빠른 시작

```bash
npm install
npm run run
```

## 주요 옵션

```bash
node src/cli.js --days=756 --seed=42 --threshold=11 --feeBps=2 --riskScale=1.2
node src/cli.js --csv=src/data/sample.csv
```

- `--days`: 시뮬레이션 일수
- `--seed`: 재현 가능한 난수 시드
- `--threshold`: 진입 점수 임계값
- `--feeBps`: 거래 비용 (bps)
- `--riskScale`: 점수 대비 포지션 배율
- `--stressRuns`: 여러 시드로 반복 시뮬레이션 횟수 (기본 30)
- `--csv`: CSV 데이터 사용 (컬럼: `date,nq,sp,dow,k200,kosdaq,usdkrw,openReturnPct`)
- `--out`: 결과 JSON 경로

## 출력

- 콘솔 요약 리포트
- JSON 리포트 파일 (`reports/latest-report.json` 기본)

## 주의

이 프로젝트는 투자 판단 보조 도구이며 수익을 보장하지 않습니다.  
실거래 전에는 데이터 품질, 슬리피지, 체결 가능성, 시장 급변 리스크를 별도 검증해야 합니다.
