# TripCart Roadmap v1.1
업데이트: 2026-03-24  
상태: **Canonical Execution Plan**

## 1. 로드맵 목적

이 문서는 “무엇을 먼저 만들고, 무엇을 뒤로 미루는가”를 고정한다.  
MVP 범위를 지키고, Codex/에이전트가 우선순위를 흔들지 않도록 만드는 것이 목적이다.

## 2. 개발 방식

- 개발 모드: **solo founder + Codex pair development**
- 코드베이스: **monorepo**
- 정본 문서 우선 순서:
  - Product Master Plan
  - Architecture
  - API Contract
  - Schema
  - Design System

## 3. 전체 단계

| Phase | 목표 | 결과물 | 상태 |
|---|---|---|---|
| Phase 0 | 인프라/정본 고정 | repo, local supabase, canonical schema, AGENTS, CI | **완료** |
| Phase 1 | 도메인 기반 구축 | auth, places, saved places, plans CRUD | **완료** (API only, FE UI 미구현) |
| Phase 2 | 일정 최적화 | optimizer integration, alternatives, share/import | MVP 핵심 |
| Phase 3 | 실행/기록 | execution, spend, media, summary | MVP 후반 |
| Phase 4 | 운영 고도화 | alerts, share polish, admin correction flow | V1.5 |
| Phase 5 | AI 보강 | gap suggest, OCR, personalization | V2 |

## 4. Phase 0 — 인프라 및 정본 고정

### 목표
- 코드 생성 전에 정본 문서와 개발 구조를 고정한다
- local Supabase / optimizer / monorepo skeleton 을 만든다

### 작업
- monorepo 초기화
- pnpm workspace + turbo 설정
- Next.js app 생성
- Expo app 생성
- FastAPI optimizer service 생성
- local Supabase CLI 세팅
- canonical schema 적용
- `.env.example` 정리
- lint/typecheck/test CI 기본선 구축
- AGENTS.md, TEST_STRATEGY.md, SECURITY.md repo 반영

### 종료 조건
- `supabase start` 성공
- schema 적용 성공
- web/mobile/optimizer 최소 hello world + shared package import 성공
- CI에서 lint/typecheck가 돈다

## 5. Phase 1 — 도메인 기반 구축

### 목표
TripCart의 핵심 도메인 구조를 실제 코드로 만든다.

### 작업 순서
1. Auth 연동
2. users bootstrap / profile
3. places / place_hours / break_windows read path
4. user_saved_places CRUD
5. trip_plans CRUD
6. trip_plan_stops reorder/lock
7. basic plan detail UI
8. admin 없이도 seed data browse 가능하도록 정리

### 종료 조건
- 사용자가 장소를 저장할 수 있다
- draft plan 을 생성/수정/조회할 수 있다
- stop reorder 가 동작한다
- golden scenario plan 을 FE에서 열 수 있다

## 6. Phase 2 — 일정 최적화 (MVP 핵심)

### 목표
장바구니 -> 실제 일정안 생성 -> 공유/복제를 완성한다.

### 작업 순서
1. optimizer `/matrix`, `/optimize` skeleton
2. route matrix cache 연동
3. optimize endpoint wiring
4. alternatives 저장 / 조회 / 선택
5. warning 구조 일관화
6. 공유 링크 생성
7. 공유 preview 페이지
8. 공유 import
9. one-region / car-first 품질 점검

### 종료 조건
- plan optimize 성공
- 2-3개 alternatives 반환
- break_time_conflict warning 이 보인다
- 공유 링크에서 미리보기 가능
- import 후 내 일정으로 복제 가능

## 7. Phase 3 — 실행/기록

### 목표
계획 앱이 아니라 “실행 가능한 앱”으로 만든다.

### 작업 순서
1. start execution
2. execution detail 조회
3. stop actual state update
4. spend entry
5. spend summary
6. media upload
7. execution summary card
8. plan vs actual 비교 기본선

### 종료 조건
- confirmed plan 을 execution 으로 시작 가능
- stop visit/skipped 처리 가능
- spend 기록 가능
- execution summary 표시 가능

## 8. Phase 4 — 운영 고도화 (V1.5)

### 목표
실제 여행 사용성을 올린다.

### 작업
- local / push token registration
- smart alert rules
- execution reoptimize
- admin correction queue
- share polish
- stats polish

### 종료 조건
- leave_now / break_time_risk / closing_soon 알림 동작
- execution 재최적화 가능
- correction submit 흐름 가능

## 9. Phase 5 — AI 보강 (V2)

### 목표
차별화 기능을 기존 도메인 위에 얹는다.

### 작업
- gap suggest
- receipt OCR draft
- receipt confirm
- structured spend auto-fill
- personalization seed
- acceptance logging

### 종료 조건
- gap suggestion 카드 + 삽입 가능
- receipt draft -> review -> confirm 동작
- OCR 실패 시 수동 보정 UX 존재

## 10. 이번 버전에서 명시적으로 제외

- 전국 동시 대응
- 대중교통 정교 최적화
- 네이버 자동 크롤링
- 내장 turn-by-turn navigation
- 실시간 공동편집
- full content marketplace

## 11. 개발 순서에서 절대 지키는 규칙

- schema 없는 화면 구현 금지
- API 계약 없이 mock endpoint 확정 금지
- optimizer 없는 “가짜 결과 화면” 장기 유지 금지
- design tokens 이전에 arbitrary color 사용 금지
- seed data 품질 없는 상태에서 추천 품질 판단 금지

## 12. 첫 2주 실행안

### Week 1
- monorepo/bootstrap
- local Supabase
- canonical schema 적용
- shared packages 구조
- auth + places read + saved places

### Week 2
- plan CRUD
- stop reorder
- optimizer skeleton
- golden scenarios read page
- basic timeline UI

## 13. MVP 출하 게이트

아래 조건을 모두 만족할 때만 MVP로 본다.

- GS1 정상 통과
- GS2 warning/alternative 통과
- GS3 자정 넘김 통과
- 공유/복제 통과
- execution 시작/종료 통과
- 기본 지출 기록 통과
- 한 지역 / 자동차 기준에서 사용자가 실제로 쓸 수 있다
