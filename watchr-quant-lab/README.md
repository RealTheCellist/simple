# WATCHR Quant Lab

예측 점수 기반 전략을 실제 투자 전에 검증하기 위한 백테스트 프로젝트입니다.

## 핵심 목적

- 전략이 과거 구간에서 어떤 성능을 보였는지 수치로 확인
- 임계값/포지션/수수료 파라미터 민감도 테스트
- 워크포워드(out-of-sample) 검증으로 과최적화 리스크 점검

## 실행

```bash
npm install
npm run run
```

## 실행 예시

```bash
# 합성 데이터 (기본)
node src/cli.js --days=756 --seed=42 --threshold=12

# CSV 데이터
node src/cli.js --csv=src/data/sample.csv --walkForward=true

# Yahoo 실데이터
node src/cli.js --mode=real --years=5 --walkForward=true
```

## 주요 옵션

- `--mode`: `synthetic` | `real` (기본 `synthetic`)
- `--days`: 합성 데이터 일수
- `--years`: 실데이터 조회 연수 (`mode=real`)
- `--seed`: 합성 데이터 시드
- `--threshold`: 진입 점수 임계값
- `--feeBps`: 거래 비용 (bps)
- `--riskScale`: 점수 대비 포지션 배율
- `--maxExposure`: 최대 포지션
- `--minExposure`: 최소 포지션
- `--stressRuns`: 합성 반복 실험 횟수
- `--realFallback`: 실데이터 실패 시 합성으로 자동 전환
- `--strictReal`: 실데이터 실패 시 즉시 에러 종료
- `--walkForward`: 워크포워드 실행 여부 (`true/false`)
- `--wfTrainDays`: 워크포워드 학습 구간 길이
- `--wfTestDays`: 워크포워드 검증 구간 길이
- `--wfStepDays`: 워크포워드 이동 간격
- `--csv`: CSV 파일 경로
- `--out`: JSON 리포트 출력 경로

## 출력

- 콘솔 리포트
- JSON 리포트 (기본 `reports/latest-report.json`)
- 항목: `summary`, `stressSummary`, `walkForward`, `topImpactDays`

## 주의

이 도구는 투자 의사결정 보조용이며 수익을 보장하지 않습니다.  
실거래 전에는 체결 슬리피지, 거래 정지 구간, 세금/수수료, 실시간 데이터 지연을 별도로 검증해야 합니다.
