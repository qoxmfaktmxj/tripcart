# CLAUDE.md — TripCart (Claude 분석 진입점)

이 파일은 canonical docs의 **projection**이다. 정본은 `docs/` 폴더다.
Claude의 역할은 **분석/설계/리뷰**다. 구현은 Codex가 한다.

## 역할 분업

- **Claude**: 문서 분석, 위험도 판정, 설계 검토, 코드 리뷰, Execution Packet 생성
- **Codex**: 기능 구현, migration 작성, API 구현, UI 구현, 테스트 작성/실행

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

## 위험도 분류 (GOVERNANCE.md §4)

- **R0**: 문서, 토큰 미세 조정 → 자동 허용
- **R1**: UI 컴포넌트, 내부 리팩터링, 테스트 → 자동 + 검증 필수
- **R2**: API endpoint, optimizer API, CI/CD → Claude 분석 필요
- **R3**: migration, RLS, auth, secret, prod → 사용자 승인 필수

## 현재 품질 Band: D (6/15)

자동화 범위: R0/R1만. R2+ 분석 필수. R3 사용자 승인 필수.

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
