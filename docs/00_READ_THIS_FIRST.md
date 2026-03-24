# TripCart Canonical Build Pack

이 폴더는 **TripCart 개발 착수용 정본 세트**다.  
이 폴더의 문서만 읽고 개발을 시작하도록 설계했다.  
이전 업로드 문서(`TripCart_Master_Plan.docx`, `TripCart_Roadmap.docx`, `TripCart_Design_System.docx`, `TripCart_API_Contract.docx`, `tripcart_schema_v0.1.sql`, `tripcart_schema_v0.2_migration.sql`, 기타 PRD/Addendum 문서)는 모두 **참고/아카이브**로 간주하고, 충돌 시 이 폴더의 문서가 무조건 우선한다.

## 현재 상태

- 제품 방향: **GO**
- 설계/문서 상태: **GO**
- 코드 착수: **GO**
- 단, 이 폴더의 문서와 실제 코드가 충돌하면 **문서를 먼저 갱신**하고 코드를 맞춘다.

## 정본 문서 계층

### Tier 1 — 반드시 따라야 하는 정본
1. `00_READ_THIS_FIRST.md`
2. `AGENTS.md`
3. `PRODUCT_MASTER_PLAN.md`
4. `ARCHITECTURE.md`
5. `API_CONTRACT_v0.2.md`
6. `tripcart_schema_canonical_v0.3.sql`
7. `DESIGN_SYSTEM.md`

### Tier 2 — 실행/운영 정본
8. `ROADMAP.md`
9. `DEVELOPMENT_OPERATING_SYSTEM.md`
10. `TEST_STRATEGY.md`
11. `SECURITY.md`

### Tier 3 — 구현 보조 파일
12. `tripcart-design-tokens.final.ts`
13. `tripcart_schema_v0.2_hardening_patch.sql`

## 권장 읽기 순서

1. `00_READ_THIS_FIRST.md`
2. `AGENTS.md`
3. `PRODUCT_MASTER_PLAN.md`
4. `ARCHITECTURE.md`
5. `API_CONTRACT_v0.2.md`
6. `tripcart_schema_canonical_v0.3.sql`
7. `DESIGN_SYSTEM.md`
8. `ROADMAP.md`
9. `DEVELOPMENT_OPERATING_SYSTEM.md`
10. `TEST_STRATEGY.md`
11. `SECURITY.md`

## 이번 정본 세트에서 해결된 문제

- 디자인 컬러 정본을 **Primary #2A9D8F / Plum Accent / Coral Warning** 으로 통일했다.
- 로드맵을 **Next.js + Expo + Supabase + FastAPI/OR-Tools** 구조에 맞게 재정렬했다.
- API 계약을 **v0.2** 수준으로 닫았다.
- 스키마를 **canonical v0.3** 로 재구성하고, active execution uniqueness / idempotent golden seed / RLS style hardening 을 반영했다.
- 초기 개발 운영 방식은 **trimmed harness(가벼운 운영체계)** 로 고정했고, gstack은 **선택적 후순위 도입**으로 정리했다.

## 이 폴더만 기준으로 개발할 때의 핵심 결정

- 앱 이름은 **TripCart**
- 제품 핵심은 **장소 저장 앱**이 아니라 **시간 제약이 있는 동선 최적화 + 실행 기록 앱**
- MVP는 **한 지역 + 자동차 중심 + 공유/복제까지**
- 지도/경로는 **TMAP backend routing + Naver handoff**
- DB/Auth/Storage 는 **Supabase**
- 로컬 개발도 **plain PostgreSQL first가 아니라 local Supabase first**
- Optimizer는 **Python FastAPI + OR-Tools**
- 초기 개발 운영체계는 **AGENTS.md + DEVELOPMENT_OPERATING_SYSTEM.md**
- gstack은 **필수 기반이 아니라 선택적 보조 툴**

## 빠른 착수 순서

```bash
# 1) monorepo 생성
mkdir tripcart && cd tripcart

# 2) local supabase 준비
supabase init
supabase start

# 3) canonical schema 적용
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql

# 4) seed / golden scenarios 적용
psql "$SUPABASE_DB_URL" -c "select public.seed_golden_scenarios('<YOUR_USER_UUID>'::uuid);"

# 5) web/mobile/optimizer 스캐폴딩
# 자세한 순서는 DEVELOPMENT_OPERATING_SYSTEM.md 참고
```

## 절대 금지

- 이 폴더 바깥의 이전 문서를 source of truth로 쓰지 말 것
- API 계약보다 먼저 프론트 화면을 임의 구현하지 말 것
- schema 없이 mock state만으로 execution lifecycle을 확정하지 말 것
- 자동 네이버 크롤링을 MVP 계획에 넣지 말 것
- local Supabase 없이 plain PostgreSQL 기준으로 auth/storage 흐름을 고정하지 말 것
