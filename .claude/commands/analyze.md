# TripCart Pre-Work Analysis

작업을 시작하기 전에 아래를 분석하라. 이 분석은 Codex에게 넘길 Execution Packet의 기초가 된다.

## 입력
$ARGUMENTS

## 분석 절차

### 1. 범위 파악
- 변경 대상 파일/영역
- 영향받는 canonical docs

### 2. 위험도 분류
docs/GOVERNANCE.md §4 기준으로 R0/R1/R2/R3 판정:
- R0: 문서/비실행
- R1: 저위험 코드
- R2: 인터페이스/구조
- R3: 민감 (auth/RLS/migration/secret)

### 3. 승인 필요 여부
docs/GOVERNANCE.md §5 승인 매트릭스 기준:
- R0/R1: 자동 → Codex 직접 실행 가능
- R2: Claude 분석 후 승인 필요
- R3: 사용자 명시 승인 필수

### 4. 검증 계획
- lint / typecheck / test 중 필요한 것
- GS1/GS2/GS3 영향 여부

### 5. 문서 동기화 대상
docs/GOVERNANCE.md §변경 매트릭스 기준

## 출력 형식

```md
## Analysis Result

- 작업 요약:
- 위험도: R0 / R1 / R2 / R3
- 승인: 자동 / Claude 분석 필요 / 사용자 승인 필수
- 변경 파일:
- 검증 계획:
- 문서 동기화:
- Codex에게 넘길 수 있는가: Yes / No (이유)
```
