# TripCart — Supabase 로컬 개발 가이드

## 전제 조건
- Docker Desktop 실행 중
- Supabase CLI 2.83.x 이상 설치

## 초기 셋업 (최초 1회)

```bash
# 프로젝트 루트에서 실행
supabase init --workdir infra/supabase

# 로컬 Supabase 스택 시작 (PostgreSQL 17)
supabase start --workdir infra/supabase
```

## 스키마 적용

```bash
# .env.local의 SUPABASE_DB_URL 또는 아래 기본값 사용
export SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# 최초 canonical schema 적용
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql

# 이후 incremental patch 적용 (있는 경우)
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_v0.2_hardening_patch.sql
```

## 골든 시나리오 시드 로딩

```bash
# TEST_USER_UUID: Supabase Auth에 생성한 테스트 유저 UUID로 교체
psql "$SUPABASE_DB_URL" -c "select public.seed_golden_scenarios('<TEST_USER_UUID>'::uuid);"
```

## 마이그레이션 관리

초기 부트스트랩 이후 DB 변경은 반드시 migration 파일로 관리한다.

```
infra/supabase/migrations/
  20250001_initial_schema.sql    ← canonical schema v0.3 사본
  20250002_hardening_patch.sql   ← hardening patch (RLS 강화)
  YYYYMMDD_description.sql       ← 이후 변경사항
```

새 마이그레이션 생성:
```bash
supabase migration new --workdir infra/supabase <description>
```

## 로컬 Supabase 접속 정보

`supabase start` 실행 후 출력되는 정보:

| 항목 | 값 |
|---|---|
| API URL | http://127.0.0.1:54321 |
| DB URL | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio | http://127.0.0.1:54323 |
| Inbucket (메일) | http://127.0.0.1:54324 |
| anon key | (출력 확인) |
| service_role key | (출력 확인, 절대 클라이언트에 노출 금지) |
