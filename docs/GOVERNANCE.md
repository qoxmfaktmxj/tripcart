# TripCart Governance Spec v1.0

업데이트: 2026-03-26
상태: **Canonical**
기반: HARNESS_GUIDE Layer 2

## 1. 운영 범위

**Standard**

이유:
- auth/RLS/storage 등 민감 영역 존재 → Minimal 불가
- 규제/결제/레거시 없음 → High-Control 불필요
- solo founder + AI dual-agent(Claude+Codex) 운영

## 2. Canonical Source Map

| 문서 | 역할 | Tier |
|---|---|---|
| `docs/00_READ_THIS_FIRST.md` | 진입점, 정본 계층 정의 | 1 |
| `docs/PRODUCT_MASTER_PLAN.md` | 제품 방향, MVP 범위 | 1 |
| `docs/ARCHITECTURE.md` | 시스템 구조, 기술 스택 | 1 |
| `docs/API_CONTRACT_v0.2.md` | API 계약 | 1 |
| `docs/tripcart_schema_canonical_v0.3.sql` | DB 정본 | 1 |
| `docs/DESIGN_SYSTEM.md` | UI 토큰, 컴포넌트 규칙 | 1 |
| `docs/ROADMAP.md` | 단계별 계획 | 2 |
| `docs/DEVELOPMENT_OPERATING_SYSTEM.md` | 개발 운영 규약 | 2 |
| `docs/TEST_STRATEGY.md` | 테스트 전략, GS 정의 | 2 |
| `docs/SECURITY.md` | 보안/데이터 정책 | 2 |
| `docs/GOVERNANCE.md` | 이 문서 — 위험도/승인/품질 | 2 |

### Projection 대상 (canonical 아님)

| 파일 | Source | 용도 |
|---|---|---|
| `CLAUDE.md` | canonical docs 요약 | Claude 분석 진입점 |
| `AGENTS.md` | canonical docs 요약 | Codex 실행 진입점 |
| `.claude/settings.json` | GOVERNANCE + SECURITY | 기계적 강제 (hooks) |
| `.claude/commands/*.md` | GOVERNANCE + 작업 흐름 | Claude 슬래시 커맨드 |
| `.claude/agents/*.md` | GOVERNANCE + 도메인 지식 | TripCart 특화 서브에이전트 |

## 3. 에이전트 분업 모델

### Claude = 분석/설계/리뷰

| 모드 | 역할 |
|---|---|
| Discovery | 문서 충돌 확인, 범위 파악, 리스크 판단 |
| Blueprint | 설계 검토, 아키텍처 리뷰, 구현 순서 제안 |
| Review | PR 리뷰, 코드 품질, 보안 검토, API 정합성 |
| Eval | 작업 성과 평가, 정책 조정 근거 생성 |

Claude가 **하면 안 되는 것**:
- 대규모 코드 생성 (Codex 영역)
- 문서 분석 없이 바로 구현 시작
- canonical docs를 무시한 제안

### Codex = 구현/수정/테스트

| 모드 | 역할 |
|---|---|
| Feature | 기능 구현 |
| Migration | schema 변경, migration 작성 |
| API | endpoint 구현 |
| UI | Expo/Next.js 화면 구현 |
| Test | 테스트 작성/실행 |
| Refactor | 구조 개선 |

Codex가 **하면 안 되는 것**:
- AGENTS.md 규칙 위반
- canonical docs와 충돌하는 구현
- R3 영역을 승인 없이 변경
- service role key를 클라이언트에 노출

### 분업 흐름

```
R0/R1: Codex 직접 실행 (AGENTS.md 준수)
R2:    Claude 사전 분석 → Execution Packet → 승인 → Codex 실행
R3:    Claude 분석 + 사용자 명시 승인 → Codex 실행 (또는 사용자 직접)
```

## 4. 변경 위험도 분류

### R0 — 문서/비실행/저위험

| 대상 | 예시 |
|---|---|
| `docs/**` | 문서 수정, 오타, 보강 |
| `README.md` | 프로젝트 설명 |
| 주석/타이포 | 코드 내 비기능적 정리 |
| `packages/design-tokens/` | 토큰 값 미세 조정 (breaking 아닌 것) |

### R1 — 저위험 코드 변경

| 대상 | 예시 |
|---|---|
| `packages/ui/**` | 공유 UI 컴포넌트 추가/수정 |
| `packages/types/**` | 타입 추가 (breaking 아닌 것) |
| `apps/web/**` 내부 | 페이지/컴포넌트 내부 리팩터링 |
| `apps/mobile/**` 내부 | 화면/컴포넌트 내부 리팩터링 |
| 테스트 추가 | unit/integration/e2e |
| `packages/config/**` | lint/tsconfig 변경 |

### R2 — 중위험 인터페이스/구조 변경

| 대상 | 예시 |
|---|---|
| API endpoint 추가/변경 | `API_CONTRACT_v0.2.md` 영향 |
| `packages/types/**` breaking | 공유 타입 시그니처 변경 |
| `services/optimizer/` API 변경 | optimizer 인터페이스 변경 |
| CI/CD 변경 | workflow, 빌드 파이프라인 |
| 큰 구조 리팩터링 | 디렉토리 이동, 모듈 분리/합병 |
| 외부 연동 변경 | TMAP/Naver API 호출 변경 |
| 배포 설정 변경 | Vercel/EAS/Docker config |

### R3 — 고위험 민감 변경

| 대상 | 예시 |
|---|---|
| `infra/supabase/migrations/**` | DB 스키마 변경, migration |
| RLS policies | 행 수준 보안 정책 |
| `auth.*` 관련 | 인증/인가 로직 |
| service role 사용 코드 | 서버 전용 privileged 접근 |
| `.env*`, secret 관련 | 환경변수, 키 관리 |
| storage bucket policies | 파일 접근 정책 |
| receipt/spend 데이터 경로 | 민감 사용자 데이터 |
| `OPTIMIZER_INTERNAL_TOKEN` | 내부 서비스 인증 |
| prod 배포 | 운영 환경 반영 |

## 5. 승인 정책 매트릭스

| 변경 유형 | 위험도 | 기본 정책 | 필수 검증 | 추가 조건 |
|---|---|---|---|---|
| 문서 수정 | R0 | 자동 허용 | — | canonical 충돌 시 검토 |
| 토큰 미세 조정 | R0 | 자동 허용 | — | DESIGN_SYSTEM.md 동기화 |
| 테스트 추가 | R1 | 자동 허용 | 관련 테스트 실행 | — |
| UI 컴포넌트 추가 | R1 | 자동 허용 | lint + typecheck | design token 준수 |
| 내부 리팩터링 | R1 | 자동 허용 | lint + type + test | GS1/2/3 깨지지 않음 |
| API endpoint 추가 | R2 | Claude 분석 필요 | contract + integration + build | API_CONTRACT 동기화 |
| optimizer API 변경 | R2 | Claude 분석 필요 | optimizer unit + GS | ARCHITECTURE.md 동기화 |
| CI/CD 변경 | R2 | Claude 분석 필요 | 파이프라인 dry-run | — |
| 외부 연동 변경 | R2 | Claude 분석 필요 | contract test | provider 영향도 확인 |
| DB migration | R3 | 사용자 승인 필수 | schema diff + rollback plan | canonical schema 동기화 |
| RLS 변경 | R3 | 사용자 승인 필수 | RLS regression + owner test | SECURITY.md 동기화 |
| auth 변경 | R3 | 사용자 승인 필수 | auth regression | SECURITY.md 동기화 |
| service role 코드 | R3 | 사용자 승인 필수 | server-only 확인 | 클라이언트 leak 검증 |
| secret/env 변경 | R3 | 사용자 승인 필수 | leak scan | — |
| prod 배포 | R3 | 사용자 직접 | 전체 게이트 통과 | — |

## 6. 품질 점수

### 현재 평가 (2026-03-26, Phase 1 완료 후)

| 축 | 점수 | 근거 |
|---|---|---|
| Test Confidence | 0 | 테스트 코드 아직 없음. API 구현됐지만 테스트 미작성 |
| Architecture Clarity | 3 | canonical docs 완비 + Phase 1 API/쿼리/타입 구현 완료. schema-code 정합 확인됨 |
| Documentation Freshness | 3 | 11개 정본 문서 최신. GOVERNANCE/EXECUTION_PROTOCOL/TASK_LEDGER 추가 |
| Operational Safety | 2 | Auth middleware, RLS defense-in-depth, RPC 소유권 확인, open redirect 방지 구현. 로컬 Supabase 미검증 |
| Observability Readiness | 0 | 로그/메트릭/트레이스 미구현 (console.error만) |

**총점: 8 / 15 → Band D (상향 경계)**

### Band D 해석

- 탐색/문서화/테스트 확보 위주로 진행
- 구현 자동화는 R0/R1까지만
- R2 이상은 반드시 분석/승인 선행
- 테스트 커버리지가 올라가면 Band C → B로 상향 재평가

## 7. 자동화 허용 범위

### 현재 (Band D)

| 위험도 | Claude | Codex |
|---|---|---|
| R0 | 자동 분석/리뷰 | 자동 실행 |
| R1 | 자동 분석/리뷰 | 자동 실행 + 검증 필수 |
| R2 | 사전 분석 필수 | 분석 승인 후 실행 |
| R3 | 분석 + 사용자 승인 | 승인 후에만 실행 |

### Band C 도달 시 (Test Confidence ≥ 1, Operational Safety ≥ 2)

- R1 완전 자동화
- R2 Claude 분석 후 자동 실행 (사후 리뷰)
- R3은 여전히 사용자 승인 필수

## 8. Path 기반 민감 구역

```
# R3 — 반드시 승인
infra/supabase/migrations/**
infra/supabase/**/policies/**
**/auth/**
**/.env*
**/service-role*

# R2 — Claude 분석 필요
services/optimizer/api/**
apps/web/app/api/**
packages/types/**/*.ts (breaking changes)

# R1 — 검증 필수
apps/web/**
apps/mobile/**
packages/ui/**
packages/config/**

# R0 — 자유
docs/**
*.md
packages/design-tokens/** (non-breaking)
```

## 9. 서브에이전트 구조

### Claude 측 (분석/리뷰 전용)

OMC 범용 에이전트(19개)는 글로벌 설치 유지.
TripCart 특화 에이전트는 `.claude/agents/`에 추가:

| 에이전트 | 역할 | 입력 | 출력 | 금지 |
|---|---|---|---|---|
| `tripcart-schema-guardian` | DB/RLS/migration 정합성 검토 | schema SQL, migration diff | 위험 평가, 승인 권고 | 코드 생성 |
| `tripcart-api-reviewer` | API 계약 정합성 검토 | endpoint 코드, API_CONTRACT | 충돌 목록, 수정 제안 | endpoint 직접 구현 |
| `tripcart-expo-reviewer` | Expo/RN + design token 준수 검토 | 컴포넌트 코드, DESIGN_SYSTEM | 토큰 위반, 접근성 이슈 | UI 직접 구현 |

### Codex 측 (실행 전용)

AGENTS.md의 규칙을 따르며, `.codex/skills/`에 도메인 스킬을 선별 배치:

| 스킬 | 용도 |
|---|---|
| `expo-rn` | Expo SDK 54 + RN 0.81 best practices |
| `supabase` | Supabase client, RLS, Edge Functions |
| `fastapi` | FastAPI + OR-Tools 패턴 |
| `nextjs` | Next.js 16 App Router 패턴 |
| `testing` | Vitest + Playwright 패턴 |

## 10. Skill + Hook 전략

### Claude 측 Hook (`.claude/settings.json`)

| Hook | 이벤트 | 동작 |
|---|---|---|
| `secret-guard` | PreToolUse(Bash/Write/Edit) | `.env`, secret, service-role 패턴 차단 |
| `destructive-guard` | PreToolUse(Bash) | `force-push`, `reset --hard`, `rm -rf`, `drop` 차단 |
| `migration-guard` | PreToolUse(Write/Edit) | `infra/supabase/migrations/` 변경 시 경고 |
| `post-lint` | PostToolUse(Write/Edit) | `apps/`, `packages/` 수정 후 lint+typecheck 실행 |

### Codex 측 가드레일 (AGENTS.md에 명시)

| 규칙 | 내용 |
|---|---|
| schema-first | migration 없이 DB 구조 직접 수정 금지 |
| contract-first | API_CONTRACT 없이 endpoint 임의 생성 금지 |
| token-compliance | DESIGN_SYSTEM.md 토큰 무시 금지 |
| service-role-isolation | 클라이언트에 service role 노출 금지 |
| test-with-change | 기능 변경 시 관련 테스트 동반 |

## 11. 운영 모드 전이

```
현재: Discovery → Blueprint 완료, Artifact Generation 완료
다음: Tool Adapter 생성 (L4) → Execution Protocol 채택 (L5)

전이 조건:
- Governance 승인 → L4 진입
- L4 adapter 생성 완료 → L5 실행 가능
- 실행 작업 3건+ 누적 → L6 Eval 시작
```

## 12. 다음 단계 생성 대상

### L4에서 만들 파일

```
.claude/settings.json          — hooks (secret/destructive/migration/post-lint)
.claude/commands/context.md    — TripCart 문맥 로드
.claude/commands/analyze.md    — 작업 전 분석
.claude/commands/review.md     — 코드/PR 리뷰
.claude/commands/exec-plan.md  — Codex용 Execution Packet 생성
.claude/agents/tripcart-schema-guardian.md
.claude/agents/tripcart-api-reviewer.md
.claude/agents/tripcart-expo-reviewer.md
CLAUDE.md                      — 갱신 (governance projection)
AGENTS.md                      — 갱신 (governance + execution protocol projection)
```

## 13. 멈춤 조건

아래가 해결되지 않으면 L4 진입 전에 확인:
- [x] canonical source 명확 — 완료
- [x] 승인 정책 정의 — 완료
- [x] R3 경계 명확 — 완료
- [x] 품질 점수 근거 확인 — 완료
- [ ] 사용자 승인 — **이 문서 검토 후 진행**

---

# HANDOFF PACKET FOR LAYER 4

## Governance Scope
Standard

## Canonical Source Map
docs/ 폴더 11개 문서 (Tier 1: 6개, Tier 2: 5개)

## Approval Matrix
R0: 자동 | R1: 자동+검증 | R2: Claude 분석 필요 | R3: 사용자 승인 필수

## Quality Score
6/15 = Band D → 탐색/문서화/테스트 확보 위주, R2+ 자동화 제한

## Automation Boundaries
Band D: R0/R1만 자동, R2 분석 필수, R3 승인 필수

## Planned Artifact Pack
Pack M (Standard) — 기존 canonical docs + GOVERNANCE.md + QUALITY_SCORE는 이 문서에 통합

## Planned Skill Set
Claude: OMC 19개 범용 + TripCart 특화 3개
Codex: expo-rn, supabase, fastapi, nextjs, testing

## Planned Hook Set
Claude: secret-guard, destructive-guard, migration-guard, post-lint
Codex: AGENTS.md 규칙으로 프롬프트 레벨 강제

## Planned Sub-Agent Set
Claude: tripcart-schema-guardian, tripcart-api-reviewer, tripcart-expo-reviewer
Codex: 별도 서브에이전트 없음 (AGENTS.md + skills로 충분)

## Open Risks / Required Approvals
- Band D이므로 첫 R2/R3 작업 시 보수적으로 운영
- Test Confidence가 0인 상태에서 구현 자동화 범위를 넓히지 않음
- schema migration 첫 실행 시 반드시 수동 검증
