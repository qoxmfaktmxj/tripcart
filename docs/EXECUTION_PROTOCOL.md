# TripCart Execution Protocol v1.0

업데이트: 2026-03-26
상태: **Canonical**
기반: HARNESS_GUIDE Layer 5 (Claude+Codex 분업 적응)

## 1. 이 문서의 목적

Claude 분석 → Codex 실행의 **핸드오프 규약**을 정의한다.
실행 규약이지, 문서 한 장 더가 아니다.

## 2. 실행 흐름

```
사용자 요청
  ↓
Claude: /analyze → 위험도 판정, 범위 파악
  ↓
  ├─ R0/R1 → Codex 직접 실행 (AGENTS.md 규칙)
  ├─ R2   → Claude: /exec-plan → Execution Packet → 사용자 확인 → Codex 실행
  └─ R3   → Claude 분석 + 사용자 명시 승인 → Codex 실행 (또는 사용자 직접)
  ↓
Codex: 실행 + 검증
  ↓
Claude: /review → 리뷰
  ↓
완료 증거 기록
```

## 3. 실행 프로파일

### Profile A — Direct (R0/R1)

Codex가 AGENTS.md만 보고 바로 실행.

적합:
- 문서 수정, 테스트 추가, UI 컴포넌트, 내부 리팩터링
- 검증: lint + typecheck + 관련 테스트

### Profile B — Controlled (R2)

Claude 분석 → Execution Packet → Codex 실행.

적합:
- API endpoint 추가/변경
- optimizer API 변경
- CI/CD 변경
- 큰 리팩터링

필수:
- `/analyze` 결과
- `/exec-plan` 산출물
- 사용자 확인 (최소 "OK" 수준)

### Profile C — High-Risk (R3)

Claude 분석 + 사용자 명시 승인 → Codex 실행.

적합:
- DB migration
- RLS 정책 변경
- auth 변경
- secret/env 변경

필수:
- `/analyze` 결과
- `/exec-plan` 산출물 + rollback 계획
- 사용자 명시적 "승인" 텍스트
- `tripcart-schema-guardian` 리뷰 (DB 관련 시)

## 4. Execution Packet 형식

Claude가 `/exec-plan`으로 생성, Codex가 받아서 실행.

```md
# Task: [작업명]

## 목적
[왜 이 변경이 필요한가]

## 위험도
R0 / R1 / R2 / R3

## 범위
- 수정 대상:
- 생성 대상:

## 비범위
- 건드리면 안 되는 것:

## 참고 문서
- [canonical docs 목록]

## 구현 순서
1. schema (필요 시)
2. API contract 동기화 (필요 시)
3. server implementation
4. client consumption
5. tests
6. docs sync

## 검증 기준
- [ ] lint 통과
- [ ] typecheck 통과
- [ ] 관련 테스트 통과
- [ ] GS1/GS2/GS3 미파괴

## 완료 정의
- [ ] 코드 변경 완료
- [ ] 테스트 추가/갱신
- [ ] 문서 동기화: [대상 문서]

## Stop 조건
- R3 경로에 예상치 못하게 닿으면 멈추고 보고
- canonical docs와 충돌 발견 시 멈추고 보고
- 테스트가 예상과 다르게 실패하면 멈추고 분석 요청
```

## 5. 실패 분류

Codex가 실행 중 실패하면 아래로 분류:

| 유형 | 설명 | 대응 |
|---|---|---|
| `INPUT_GAP` | 정보 부족 | Claude에게 재분석 요청 |
| `SPEC_CONFLICT` | 문서/요구사항 충돌 | 멈추고 사용자 확인 |
| `TEST_FAILURE` | 검증 실패 | 원인 분석 → retry 또는 replan |
| `ENV_FAILURE` | 실행 환경 문제 | 환경 확인 후 retry |
| `RISK_ESCALATION` | 예상보다 위험 높음 | 멈추고 사용자 승인 재요청 |
| `SCOPE_CREEP` | 범위 번짐 | 원래 범위로 되돌리고 replan |

### 대응 규칙

- **Retry**: 환경 문제, 일시적 실패. 동일 조건 최대 2회.
- **Replan**: 분해 방식 잘못, 범위 확장. Claude에게 `/exec-plan` 재요청.
- **Stop**: 승인 범위 초과, R3 발견, canonical 충돌. 멈추고 보고.
- **Rollback**: 회귀 발생, 데이터 위험. 변경 되돌리고 기록.

## 6. 완료 증거 (Execution Report)

작업 완료 시 최소한 아래를 남긴다:

```md
## Execution Report

- 작업: [작업명]
- 상태: done / partial / blocked / rolled-back
- 변경 파일:
  - file/path
- 실행 명령:
  - command
- 검증 결과:
  - passed: [목록]
  - failed: [목록]
- 문서 동기화: [완료/미완료 + 대상]
- 남은 리스크:
- 다음 작업:
```

## 7. Task Ledger Entry

각 작업 완료 후 한 줄 기록 (L6 Eval 기초):

```md
| Task ID | Date | Type | Domain | Risk | Status | First-Pass | Retry | Review | Notes |
|---|---|---|---|---|---|---|---:|---|---|
| TC-001 | 2026-03-26 | feature | schema | R3 | done | yes | 0 | yes | initial migration |
```

이 ledger는 `docs/evals/TASK_LEDGER.md`에 누적.
3건 이상 쌓이면 L6 Eval 시작.

## 8. 작업 유형별 체크리스트

### 신규 기능
- [ ] acceptance criteria 확인
- [ ] 구현 순서: schema → API → server → client → test → docs
- [ ] GS 영향 여부 확인

### 버그 수정
- [ ] 재현 경로 명시
- [ ] failing regression test 먼저
- [ ] 수정 후 재현 불가 확인

### 리팩터링
- [ ] 동작 보호용 테스트 확보
- [ ] 구조 변경과 행동 변경 분리
- [ ] diff 클수록 중간 checkpoint 빈도 높임

### DB Migration
- [ ] canonical schema 대조
- [ ] rollback 가능 여부
- [ ] data integrity 영향도
- [ ] `tripcart-schema-guardian` 리뷰
- [ ] R3 — 사용자 승인 필수

## 9. 멈춤 조건

아래 중 하나면 실행을 멈추고 보고:

1. 위험도가 R3로 상승
2. canonical docs와 실제 코드가 크게 충돌
3. auth/RLS/migration/secret 경로에 예상치 못하게 닿음
4. 테스트/빌드 검증이 전혀 불가능
5. 범위가 두 배 이상 확장
6. 작업 목표가 구현보다 조사에 가까움이 뒤늦게 판명
