# TripCart Task Ledger

상태: Active
목적: 작업 성과 추적 — L6 Eval 기초 데이터

## Ledger

| Task ID | Date | Type | Domain | Risk | Status | First-Pass | Retry | Review | Notes |
|---|---|---|---|---|---|---|---:|---|---|
| P0-FINISH | 2026-03-26 | infra | monorepo | R0 | done | pass | 0 | — | pnpm install, supabase init, schema migration, @types/react 18/19 충돌 해결 |
| P1-AUTH | 2026-03-26 | feature | auth | R3 | done | review-fix | 1 | code-reviewer | 7단계 Auth 구현. CRITICAL 2건(open redirect, getSession→getUser), HIGH 4건 수정. typecheck 통과 |
| P1-PLACES | 2026-03-26 | feature | places | R1 | done | review-fix | 1 | code-reviewer | Places read path (GET /places, GET /places/:id). executor 구현→reviewer 리뷰. CRITICAL 1건(is_open_now/next_break 누락), HIGH 4건(cursor injection, visit_profile 구조, 응답 래퍼, formatTime null) 수정 |
| P1-SAVED | 2026-03-26 | feature | saved-places | R1 | done | review-fix | 1 | code-reviewer | Saved Places CRUD (GET/POST/DELETE). CRITICAL 0, HIGH 2건(note 필드 누락, ALREADY_SAVED 미등록) 수정. DRY 개선(mapper/select 추출), meta envelope 추가, ERROR_CODES에 공통 코드 4개 등록 |

| P1-PLANS | 2026-03-26 | feature | plans | R2+R3 | done | review-fix | 1 | architect+code-reviewer | Plans CRUD 9 endpoints + reorder RPC migration. CRITICAL 2건(version race condition→RPC 원자화, locked_position NULL guard), HIGH 4건(POST/PATCH/reorder 응답 shape contract 정합) 수정. 타입 불일치 5건 해결 |

<!-- 5건 누적 완료 -->
