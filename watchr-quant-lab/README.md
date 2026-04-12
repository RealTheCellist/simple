# WATCHR Quant Lab

WATCHR 예측 모델을 실거래 전에 검증하는 백테스트 프로젝트입니다.

## 목표

- 전략 성능을 숫자로 확인
- 비용/리스크를 반영한 보수적 시뮬레이션
- 워크포워드(out-of-sample)로 과최적화 점검

## 실행

```bash
npm install
npm run run
```

## 실행 예시

```bash
# 기본(합성 데이터)
node src/cli.js --days=756 --seed=42

# Yahoo 실데이터 + 워크포워드
node src/cli.js --mode=real --years=5 --walkForward=true

# Yahoo 실패 시 백업 CSV 사용
node src/cli.js --mode=real --backupCsv=src/data/sample.csv

# 비용/리스크 강화
node src/cli.js --slippageBps=3 --taxBps=5 --shortCarryBps=8 --maxLossGuardPct=1.2 --blockWeekdays=1,3
```

## 주요 옵션

- `--mode`: `synthetic` | `real`
- `--days`: 합성 데이터 일수
- `--years`: 실데이터 조회 연수
- `--seed`: 합성 데이터 시드
- `--csv`: CSV 입력 경로
- `--backupCsv`: 실데이터 실패 시 사용할 백업 CSV
- `--strictReal`: 실데이터 실패 시 즉시 종료
- `--realFallback`: 실데이터 실패 시 합성 fallback 허용

- `--threshold`: 진입 점수 임계값
- `--riskScale`: 점수 대비 포지션 배율
- `--maxExposure`: 최대 포지션
- `--minExposure`: 최소 포지션

- `--feeBps`: 거래 수수료
- `--slippageBps`: 슬리피지
- `--taxBps`: 매도세/기타 세금 근사치
- `--shortCarryBps`: 숏 포지션 일일 캐리 비용(연환산 bps)

- `--blockWeekdays`: 특정 요일 거래 차단(0=일요일 ... 6=토요일)
- `--blockHighVolPct`: 고변동일 차단 기준(절대 %)
- `--maxLossGuardPct`: 일일 손실 한도(%), 초과 시 쿨다운
- `--cooldownDaysAfterLoss`: 손실 가드 발동 후 휴식일

- `--stressRuns`: 합성 반복 테스트 횟수
- `--walkForward`: 워크포워드 사용 여부
- `--wfTrainDays`: 학습 구간
- `--wfTestDays`: 검증 구간
- `--wfStepDays`: 이동 간격
- `--out`: 결과 JSON 파일 경로

## 출력

- 콘솔 요약
- JSON 리포트(기본: `reports/latest-report.json`)
  - `source`, `providersTried`, `dataQuality`
  - `summary`, `stressSummary`, `walkForward`
  - `topImpactDays`

## 주의

이 도구는 투자 판단 보조용이며 수익을 보장하지 않습니다.  
실거래 전에는 체결 슬리피지, 실제 수수료/세금, 데이터 지연, 시장 급변 구간을 별도로 검증해야 합니다.
