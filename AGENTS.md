# AGENTS.md — TripCart

이 파일은 Codex/에이전트가 TripCart에서 작업할 때 반드시 따라야 하는 운영 규칙이다.

## 0. 읽기 순서

작업 시작 전에 반드시 아래 순서로 읽는다.

1. `00_READ_THIS_FIRST.md`
2. `PRODUCT_MASTER_PLAN.md`
3. `ARCHITECTURE.md`
4. `API_CONTRACT_v0.2.md`
5. `tripcart_schema_canonical_v0.3.sql`
6. `DESIGN_SYSTEM.md`
7. 관련 작업이면 `ROADMAP.md`, `TEST_STRATEGY.md`, `SECURITY.md`

## 1. Source of Truth

- 이 폴더의 문서만 정본이다.
- 이전 업로드 문서는 읽지 않아도 된다.
- 코드가 문서와 충돌하면 **문서를 먼저 갱신**하고, 그다음 코드를 맞춘다.
- API / Schema / UX가 바뀌면 관련 문서까지 같이 수정해야 완료다.

## 2. 핵심 제품 원칙

- Plan 과 Execution 은 절대 섞지 않는다.
- Shared Template 과 Scheduled Instance 를 분리한다.
- 공유는 상대시간, 실행은 절대시간을 쓴다.
- MVP는 **한 지역 + 자동차 중심 + 일정 생성 + 공유/복제 + 실행 기록 기초** 까지다.
- 지도 내비게이션은 MVP에서 직접 구현하지 않고 **외부 앱 handoff** 를 우선한다.

## 3. 기술 원칙

- monorepo: `pnpm workspaces + turborepo`
- web: `Next.js`
- mobile: `Expo (Dev Client 기준)`
- backend core: `Supabase`
- optimizer: `Python FastAPI + OR-Tools`
- 로컬 개발 기준 DB는 **local Supabase**
- plain PostgreSQL 은 optimizer 실험용 보조로만 허용한다
- Supabase service role 은 서버/백그라운드 작업 전용이다

## 4. 작업 방식

### 작업 전
- 관련 문서 확인
- 영향 범위 파악
- 변경 대상 분류: `product / api / schema / ui / optimizer / infra / docs`

### 작업 중
- 작은 단위로 자른다
- speculative refactor 금지
- 스키마 변경이 있으면 migration or canonical schema 동기화
- API shape 변경이 있으면 `API_CONTRACT_v0.2.md` 갱신
- UX 변경이 있으면 `DESIGN_SYSTEM.md` 갱신

### 작업 후
- 최소한 아래 증거를 남긴다
  - 변경 파일 목록
  - 테스트/검증 결과
  - 남은 리스크
  - 문서 동기화 여부

## 5. 절대 금지

- 자동 네이버 크롤링 추가
- service role 키를 클라이언트에 노출
- travel plan 과 execution log 를 같은 테이블에 우겨넣기
- active execution uniqueness 를 앱 로직에만 의존
- `API_CONTRACT_v0.2.md` 를 무시한 채 endpoint 를 임의 생성
- `DESIGN_SYSTEM.md` 의 토큰을 무시한 임의 색상 사용
- receipt 원본 이미지를 무기한 저장하는 기본 정책

## 6. 변경 시 반드시 같이 수정해야 하는 문서

- Product 동작 변경 -> `PRODUCT_MASTER_PLAN.md`
- 화면/컬러/컴포넌트 변경 -> `DESIGN_SYSTEM.md`
- Endpoint 변경 -> `API_CONTRACT_v0.2.md`
- DB 구조/RLS/함수 변경 -> `tripcart_schema_canonical_v0.3.sql`
- 개발 프로세스/CI/도구 결정 변경 -> `DEVELOPMENT_OPERATING_SYSTEM.md`
- 테스트 기준 변경 -> `TEST_STRATEGY.md`
- 보안/데이터 보관 정책 변경 -> `SECURITY.md`

## 7. 품질 게이트

작업 완료 선언 전 최소 기준:

- 타입 에러 없음
- lint 통과
- 관련 테스트 통과
- 문서 동기화 완료
- breaking change가 있으면 README/AGENTS 수준에도 반영

## 8. 개발 우선순위

1. schema + auth + RLS
2. places / saved places / plans CRUD
3. optimizer integration
4. alternatives / share / import
5. execution / spends / media
6. receipt OCR / gap suggest / smart alerts

## 9. 운영체계 선택

- 현재 프로젝트의 기본 운영체계는 **trimmed harness**
- gstack은 나중에 Claude Code를 주력으로 쓸 때 선택적으로 붙인다
- gstack을 붙여도 source of truth는 이 폴더의 문서다
