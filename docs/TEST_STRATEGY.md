# TripCart Test Strategy v1.0
업데이트: 2026-03-24  
상태: **Canonical**

## 1. 목적

TripCart 테스트는 “기능이 있나?”보다 “실제 여행에서 깨지지 않나?”를 검증해야 한다.  
따라서 기능 테스트보다 **시나리오 회귀**가 중요하다.

## 2. 테스트 계층

| Layer | 내용 |
|---|---|
| Unit | 도메인 함수, optimizer scoring, DTO validation |
| Integration | Supabase RLS, API handlers, optimizer integration |
| E2E | web/mobile 핵심 사용자 흐름 |
| Golden Scenario | GS1 / GS2 / GS3 end-to-end 회귀 |
| Visual | 핵심 화면 토큰/레이아웃 확인 |

## 3. Golden Scenarios

## GS1 — 정상 당일치기
- 토요일 09:00 부산역 출발
- 감천 -> 곰장어 -> 해운대 -> 모모스
- 기대:
  - warning_count = 0
  - 모든 time window 충족
  - alternatives 최소 1개 반환
  - share/import 가능

## GS2 — 브레이크타임 충돌
- 토요일 12:00 출발
- 기존 순서로 가면 곰장어 BT 또는 LO 충돌
- 기대:
  - warning 배열 존재
  - 대안 일정안 또는 infeasible stop 표시
  - FE 경고 표시

## GS3 — 자정 넘김
- 금요일 오후 출발
- 야간 코스 + 자갈치 01:00 영업
- 기대:
  - 자정 넘김 일정이 collapse 되지 않음
  - 절대시간/상대시간 모두 일관
  - 공유/실행에서 날짜 경계가 유지됨

## 4. 필수 테스트 항목

### 4.1 Schema / DB
- active execution uniqueness
- RLS owner enforcement
- shared itinerary visibility
- seed_golden_scenarios idempotency
- users bootstrap trigger

### 4.2 API
- plans CRUD
- optimize
- alternatives read/select
- share/import
- execution start/detail/update
- spend create/summary
- receipt draft/confirm
- push token upsert

### 4.3 FE
- cart -> optimize -> confirm
- share preview -> import
- execution timeline
- warning badge/render
- spend quick add
- receipt review form

### 4.4 Optimizer
- matrix cache use
- locked stop respect
- break time conflict warning
- no impossible alternative selected by default

## 5. 테스트 데이터 전략

- canonical schema 의 `seed_golden_scenarios()` 사용
- 지역 seed dataset 은 별도 fixture 로 관리
- receipt OCR 은 mock provider + sample images 로 회귀
- gap suggest 는 deterministic candidate set 을 사용

## 6. CI 기준

### required
- lint
- typecheck
- unit tests
- integration tests
- schema apply smoke test

### recommended
- golden scenario smoke test
- share/import e2e
- execution lifecycle e2e

## 7. done definition

어떤 작업이든 아래를 만족해야 done 이다.

- 관련 테스트 추가 또는 기존 테스트 갱신
- 회귀 없음
- 문서 동기화됨
- GS1/GS2/GS3 를 깨지 않음

## 8. 장애 징후

아래는 즉시 수정 우선순위 상향.

- optimize 는 되는데 execution 이 시작 안 됨
- share preview 와 import 결과가 다름
- receipt confirm 후 spend 총액 불일치
- active execution 이 중복 생성됨
- 자정 넘김 일정이 날짜상 말려 들어감
