# TripCart Code Review

변경된 코드를 docs/GOVERNANCE.md 기준으로 리뷰하라.

## 입력
$ARGUMENTS

## 리뷰 관점 (4가지)

### 1. Canonical 정합성
- API_CONTRACT_v0.2.md와 endpoint 일치 여부
- tripcart_schema_canonical_v0.3.sql과 DB 접근 일치 여부
- DESIGN_SYSTEM.md 토큰 준수 여부

### 2. 보안
- service role 클라이언트 노출 없음
- RLS bypass 없음
- secret 하드코딩 없음
- receipt/민감 데이터 처리 SECURITY.md 준수

### 3. 테스트
- 변경에 대응하는 테스트 존재/추가 여부
- GS1/GS2/GS3 영향 여부
- TEST_STRATEGY.md done definition 충족 여부

### 4. 구조
- ARCHITECTURE.md 의존성 규칙 준수
- 패키지 경계 위반 없음
- 불필요한 shared abstraction 없음

## 출력 형식

각 관점별로:
- Pass / Warning / Fail
- 구체적 파일:라인 지적
- 수정 제안

마지막에 전체 판정:
- Approve / Request Changes / Block (R3 위반)

## Task Ledger Entry (자동 생성)

리뷰 완료 후 반드시 아래 형식의 ledger entry를 생성하고,
`docs/evals/TASK_LEDGER.md` 테이블에 append하라.

```
| TC-NNN | YYYY-MM-DD | type | domain | R? | status | first-pass | retry | review-needed | notes |
```

- Task ID: 기존 ledger의 마지막 번호 + 1 (없으면 TC-001)
- Type: feature / bugfix / refactor / test / migration / docs / infra
- Domain: schema / api / ui / optimizer / auth / infra / docs
- Status: done / partial / blocked / rolled-back
- First-Pass: 첫 검증에서 바로 통과했는가 (yes/no)
- Retry: 재시도 횟수
- Review-Needed: 리뷰가 필요했는가 (yes/no)
- Notes: 한 줄 요약
