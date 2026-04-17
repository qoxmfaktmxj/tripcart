# CLAUDE.md — TripCart (Claude 분석 진입점)

이 파일은 canonical docs의 **projection**이다. 정본은 `docs/` 폴더다.
Claude의 역할은 **분석/설계/리뷰**다. 구현은 Codex 또는 executor 에이전트가 한다.

## 현재 상태 (2026-04-15)

```
Phase 0: 완료 — monorepo scaffolding, pnpm, Supabase init, canonical schema migration
Phase 1: 구현됨; audit hardening pending — Auth, Places, Saved Places, Plans CRUD, Plan Stops
Phase 1.5: 구현됨; QA/docs alignment pending — guest-first trial, public landing, login migration, mobile tab nav
Phase 2: P0/P1 audit 정리 후 진입 — optimizer integration, alternatives, share/import
```

- **품질 Band: C (10/15)** — R0/R1 자동, R2는 분석/검증 포함 실행, R3 승인 필수
- **통과한 게이트**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm --filter @tripcart/web e2e`, `uv run --extra dev pytest`, `uv run --extra dev ruff check .`, `pnpm audit --prod --audit-level high`, local Supabase `rpc_share_security_smoke.sql`
- **남은 보안 주의**: local `.env.local` secret hygiene and hosted key rotation 여부는 수동 확인 필요

## Phase 2 진입 전 필수 TODO

1. **DB/RLS 보안 정리** (R3) — SECURITY DEFINER RPC가 caller-supplied `p_user_id`를 신뢰하지 않게 하고, owner mismatch 테스트를 추가한다.
2. **공유 visibility 정리** (R3/R2) — `link_only` 직접 select를 막고 share_code 검증 경로를 확정한다.
3. **API 계약 정렬** (R2) — `API_CONTRACT_v0.2.md`, `packages/types`, route response shape, optimizer DTO를 한 기준으로 맞춘다.
4. **optimizer internal auth** (R2) — `/v1/optimize`, `/v1/matrix`에 internal bearer token 검증을 붙이고 prod docs/redoc 비활성화 정책을 둔다.
5. **품질 게이트 유지** (R1/R2) — optimizer ruff와 `pnpm audit --prod --audit-level high`를 릴리스 차단 게이트로 유지한다.

## 구현된 API Endpoints (Phase 1 implemented slice)

아래는 현재 route가 존재하는 범위다. `API_CONTRACT_v0.2.md`의 optimizer/share/import/execution/spend/media/push/receipt/AI assist 전체가 구현됐다는 의미가 아니다.

```
# Auth
POST /auth/callback          — code→session 교환

# Places (public read)
GET  /api/v1/places          — 목록 (cursor pagination, search, filters)
GET  /api/v1/places/:id      — 상세 (hours, break_windows, visit_profile)

# Saved Places (인증 필수)
GET    /api/v1/me/saved-places           — 내 저장 장소 목록
POST   /api/v1/me/saved-places           — 저장 추가
DELETE /api/v1/me/saved-places/:placeId  — 저장 해제

# Plans (인증 필수)
GET    /api/v1/plans                     — 내 계획 목록
POST   /api/v1/plans                     — draft 생성
GET    /api/v1/plans/:id                 — 상세 (stops 포함)
PATCH  /api/v1/plans/:id                 — 수정 (→draft, version++)
DELETE /api/v1/plans/:id                 — soft delete

# Plan Stops (인증 필수)
POST   /api/v1/plans/:id/stops           — stop 추가
PATCH  /api/v1/plans/:id/stops/:stopId   — stop 수정
DELETE /api/v1/plans/:id/stops/:stopId   — stop 제거
PATCH  /api/v1/plans/:id/stops/reorder   — 순서 변경 (RPC)
```

## 주요 구현 파일 맵

```
apps/web/src/
  middleware.ts                          — 세션 갱신 + 라우트 보호
  app/(auth)/login,signup/page.tsx       — 인증 페이지
  app/auth/callback/route.ts             — auth callback
  app/api/v1/                            — API route handlers
  hooks/use-auth.ts                      — 클라이언트 auth hook
  lib/supabase/client.ts, server.ts      — Supabase 헬퍼
  lib/supabase/queries/                  — 도메인별 쿼리 함수
    places.ts, saved-places.ts, plans.ts, plan-stops.ts
  lib/utils/validation.ts                — UUID_RE 등

apps/mobile/src/
  lib/supabase.ts                        — SecureStore 기반 초기화
  providers/auth-provider.tsx            — 인증 context

infra/supabase/
  migrations/20260326000000_canonical_v0.3.sql
  migrations/20260326000001_reorder_stops_rpc.sql  — reorder + reset_plan_to_draft RPC
```

## 역할 분업

- **Claude**: 문서 분석, 위험도 판정, 설계 검토, 코드 리뷰, Execution Packet 생성
- **Codex / executor**: 기능 구현, migration 작성, API 구현, UI 구현, 테스트 작성/실행

## 정본 문서 (docs/)

### Tier 1 — 반드시 따라야 하는 정본
1. `docs/00_READ_THIS_FIRST.md` — 진입점
2. `docs/PRODUCT_MASTER_PLAN.md` — 제품 방향
3. `docs/ARCHITECTURE.md` — 시스템 구조
4. `docs/API_CONTRACT_v0.2.md` — API 계약
5. `docs/tripcart_schema_canonical_v0.3.sql` — DB 정본
6. `docs/DESIGN_SYSTEM.md` — UI 토큰

### Tier 2 — 실행/운영 정본
7. `docs/GOVERNANCE.md` — 위험도/승인/품질 점수
8. `docs/DEVELOPMENT_OPERATING_SYSTEM.md` — 개발 운영
9. `docs/TEST_STRATEGY.md` — 테스트 전략
10. `docs/SECURITY.md` — 보안 정책
11. `docs/ROADMAP.md` — 단계별 계획

### 실행 기록
12. `docs/EXECUTION_PROTOCOL.md` — 실행 규약
13. `docs/evals/TASK_LEDGER.md` — 작업 성과 추적 (5건 기록)

## 위험도 분류 (GOVERNANCE.md §4)

- **R0**: 문서, 토큰 미세 조정 → 자동 허용
- **R1**: UI 컴포넌트, 내부 리팩터링, 테스트 → 자동 + 검증 필수
- **R2**: API endpoint, optimizer API, CI/CD → Claude 분석 필요
- **R3**: migration, RLS, auth, secret, prod → 사용자 승인 필수

## Claude 슬래시 커맨드

- `/context` — 정본 문서 로드 및 현재 상태 요약
- `/analyze [작업 설명]` — 작업 전 위험도/범위 분석
- `/review [대상]` — 4관점 코드 리뷰 (정합성/보안/테스트/구조)
- `/exec-plan [작업 설명]` — Codex용 Execution Packet 생성

## Claude 특화 에이전트

- `tripcart-schema-guardian` — DB/RLS/migration 검토 (opus)
- `tripcart-api-reviewer` — API 계약 정합성 (sonnet)
- `tripcart-expo-reviewer` — Expo/UI 토큰 준수 (sonnet)

## 절대 금지

- canonical docs와 충돌하는 제안을 사실처럼 굳히기
- 사용자 승인 없이 R3 영역 변경 승인
- Codex 없이 대규모 코드 직접 생성
- 문서 분석 없이 바로 구현 시작

## 핵심 제품 원칙 요약

- Plan과 Execution은 절대 섞지 않는다
- 공유는 상대시간, 실행은 절대시간
- MVP: 한 지역 + 자동차 + 일정 생성 + 공유/복제 + 실행 기록 기초
- 지도 내비: 외부 앱 handoff (직접 구현 아님)
