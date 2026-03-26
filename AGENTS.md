# AGENTS.md — TripCart (Codex 실행 진입점)

이 파일은 canonical docs의 **projection**이다. 정본은 `docs/` 폴더다.
Codex의 역할은 **구현/수정/테스트**다. 분석/리뷰는 Claude가 한다.

## 0. 읽기 순서

작업 시작 전에 반드시 아래 순서로 읽는다.

1. `docs/00_READ_THIS_FIRST.md`
2. `docs/PRODUCT_MASTER_PLAN.md`
3. `docs/ARCHITECTURE.md`
4. `docs/API_CONTRACT_v0.2.md`
5. `docs/tripcart_schema_canonical_v0.3.sql`
6. `docs/DESIGN_SYSTEM.md`
7. 관련 작업이면 `docs/GOVERNANCE.md`, `docs/TEST_STRATEGY.md`, `docs/SECURITY.md`

## 1. Source of Truth

- `docs/` 폴더의 문서만 정본이다.
- 코드가 문서와 충돌하면 **문서를 먼저 갱신**하고, 그다음 코드를 맞춘다.
- API / Schema / UX가 바뀌면 관련 문서까지 같이 수정해야 완료다.

## 2. 위험도와 자율성 (GOVERNANCE.md §4~§7)

| 위험도 | 대상 예시 | Codex 자율성 |
|---|---|---|
| R0 | docs, 토큰 미세 조정 | 자유 실행 |
| R1 | UI 컴포넌트, 테스트, 내부 리팩터링 | 자유 실행 + 검증 필수 |
| R2 | API endpoint, optimizer API, CI/CD | Claude 분석 승인 후 실행 |
| R3 | migration, RLS, auth, secret, prod | 사용자 명시 승인 후 실행 |

### R3 민감 경로

```
infra/supabase/migrations/**
**/auth/**
**/.env*
**/service-role*
```

이 경로 변경 시 반드시 멈추고 승인 요청.

## 3. 핵심 제품 원칙

- Plan과 Execution은 절대 섞지 않는다
- Shared Template과 Scheduled Instance를 분리한다
- 공유는 상대시간, 실행은 절대시간
- MVP: 한 지역 + 자동차 + 일정 생성 + 공유/복제 + 실행 기록 기초
- 지도 내비: 외부 앱 handoff

## 4. 기술 원칙

- monorepo: `pnpm workspaces + turborepo`
- web: `Next.js 16`
- mobile: `Expo SDK 54 (Dev Client)`
- backend: `Supabase`
- optimizer: `Python FastAPI + OR-Tools`
- 로컬 DB: `local Supabase` (plain PostgreSQL은 optimizer 실험용만)
- service role: 서버/백그라운드 전용

## 5. 구현 순서 규칙

반드시 이 순서를 따른다:
1. schema (migration)
2. API contract (docs/API_CONTRACT 동기화)
3. server implementation
4. client consumption
5. tests
6. docs sync

반대로 하지 않는다.

## 6. 작업 방식

### Task Packet (Claude가 생성, Codex가 실행)

```md
# Task: [작업명]
- 목적:
- 범위:
- 비범위:
- 참고 문서:
- 수정 가능 파일:
- 검증 기준:
- 완료 정의:
```

### 작업 중
- 작은 단위로 자른다
- speculative refactor 금지
- 스키마 변경 → migration + canonical schema 동기화
- API shape 변경 → `API_CONTRACT_v0.2.md` 갱신
- UX 변경 → `DESIGN_SYSTEM.md` 갱신

### 작업 후 증거
- 변경 파일 목록
- 테스트/검증 결과
- 남은 리스크
- 문서 동기화 여부

## 7. 절대 금지

- 자동 네이버 크롤링 추가
- service role 키를 클라이언트에 노출
- Plan과 Execution을 같은 테이블에 넣기
- active execution uniqueness를 앱 로직에만 의존
- `API_CONTRACT_v0.2.md` 무시하고 endpoint 임의 생성
- `DESIGN_SYSTEM.md` 토큰 무시한 임의 색상 사용
- receipt 원본 이미지 무기한 저장
- R3 경로를 승인 없이 변경

## 8. 문서 동기화 매트릭스

| 변경 종류 | 반드시 같이 갱신 |
|---|---|
| Product 동작 변경 | `PRODUCT_MASTER_PLAN.md` |
| 화면/색상/컴포넌트 변경 | `DESIGN_SYSTEM.md` |
| Endpoint 변경 | `API_CONTRACT_v0.2.md` |
| DB 구조/RLS/함수 변경 | `tripcart_schema_canonical_v0.3.sql` |
| 개발 프로세스/도구 변경 | `DEVELOPMENT_OPERATING_SYSTEM.md` |
| 테스트 기준 변경 | `TEST_STRATEGY.md` |
| 보안/보관 정책 변경 | `SECURITY.md` |
| 위험도/승인 정책 변경 | `GOVERNANCE.md` |

## 9. 품질 게이트

작업 완료 선언 전 최소 기준:
- 타입 에러 없음
- lint 통과
- 관련 테스트 통과 (또는 추가)
- GS1/GS2/GS3 미파괴
- 문서 동기화 완료

## 10. 개발 우선순위

1. schema + auth + RLS
2. places / saved places / plans CRUD
3. optimizer integration
4. alternatives / share / import
5. execution / spends / media
6. receipt OCR / gap suggest / smart alerts
