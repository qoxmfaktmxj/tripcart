# TripCart Development Operating System v1.0
업데이트: 2026-03-24  
상태: **Canonical**

## 1. 운영 모델

TripCart의 기본 운영 모델은 **trimmed harness + Codex pair development** 다.

의미:
- 문서 정본은 분명하게 유지한다
- 과한 절차는 줄인다
- 작업 수행 규약은 엄격히 둔다
- gstack 같은 tool pack 은 나중에 선택적으로 붙인다

## 2. 왜 gstack을 지금 기본으로 쓰지 않는가

현재 단계의 핵심은:
- 제품 범위 고정
- API/Schema 정합성 확보
- local Supabase 기반 초기 인프라 세팅
- monorepo 부팅
- optimizer / web / mobile 경계 확정

즉, 지금 필요한 것은 **governance + canonical docs + execution protocol** 이다.  
gstack은 이후 Claude Code를 주력으로 사용할 때 review/qa/browse/ship 를 보조하는 생산성 layer 로 도입하는 편이 맞다.

## 3. 현재 채택하는 운영 구성

### 지금 즉시 채택
- `AGENTS.md`
- `PRODUCT_MASTER_PLAN.md`
- `ARCHITECTURE.md`
- `API_CONTRACT_v0.2.md`
- `tripcart_schema_canonical_v0.3.sql`
- `DESIGN_SYSTEM.md`
- `TEST_STRATEGY.md`
- `SECURITY.md`

### 선택적/후순위
- gstack (`/review`, `/qa`, `/browse`)
- 추가 sub-agent tree
- 복잡한 CODEOWNERS

## 4. Sprint 0 목표

코드 생성 전에 아래를 끝낸다.

1. monorepo bootstrap
2. local Supabase bootstrap
3. canonical schema 적용
4. seed + golden scenario 로딩
5. web/mobile/optimizer skeleton
6. CI 최소 게이트
7. shared package skeleton
8. 문서 위치 고정 (`docs/canonical` 추천)

## 5. 권장 repo 구조

```text
tripcart/
  apps/
    web/
    mobile/
  services/
    optimizer/
  packages/
    ui/
    types/
    design-tokens/
    config/
  infra/
    supabase/
    ci/
  docs/
    canonical/
    archive/
    decisions/
```

## 6. 부트스트랩 순서

> **전제 조건**: Node.js 22.x LTS, pnpm 10.x, Docker Desktop (Supabase 로컬 스택용), Python 3.14.x, uv 설치 완료

### 6.1 Monorepo
```bash
# 프로젝트 루트에서 (pnpm-workspace.yaml / turbo.json 수동 생성 권장)
# Turborepo 2.x 기반
pnpm dlx create-turbo@latest
```

### 6.2 Web (Next.js 16 + TypeScript 5.8 + Tailwind CSS 4)
```bash
pnpm create next-app apps/web --ts --app --eslint --tailwind --src-dir --import-alias "@/*"
```

> **Tailwind CSS v4 주의**: v4는 `tailwind.config.js`가 없다. `globals.css`에서 `@import "tailwindcss"` + `@theme { ... }` 블록으로 토큰을 직접 정의한다.
> **ESLint 9 주의**: Next.js 16은 `eslint.config.js` (flat config)를 기본으로 사용한다. `.eslintrc.*` 파일은 생성하지 않는다.

### 6.3 Mobile (Expo SDK 54, RN 0.76)
```bash
pnpm create expo-app apps/mobile --template blank-typescript
```

> maps / push / native module 대응 때문에 **Expo Go 가 아니라 Dev Client 기준** 으로 생각한다.
> `app.json`에 `expo-dev-client` 플러그인 추가 필요.

### 6.4 Optimizer (Python 3.14 + FastAPI + OR-Tools)
```bash
mkdir -p services/optimizer
cd services/optimizer
uv init
uv add "fastapi[standard]" uvicorn ortools pydantic
```

> `pyproject.toml`에 `requires-python = ">=3.14"` 명시.
> `.python-version` 파일에 `3.14` 기재.

### 6.5 Local Supabase (PostgreSQL 17)
```bash
# Docker Desktop 실행 후
supabase init --workdir infra/supabase
supabase start --workdir infra/supabase
```

> Supabase CLI 2.83.x 기준 로컬 스택은 **PostgreSQL 17**을 기본으로 사용한다.

### 6.6 Schema
```bash
# 스키마 적용
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql

# 골든 시나리오 시드
psql "$SUPABASE_DB_URL" -c "select public.seed_golden_scenarios('<TEST_USER_UUID>'::uuid);"
```

- `infra/supabase/migrations/` 에 canonical schema 저장 (파일명: `20250001_initial_schema.sql`)
- 이후 증분 변경은 migration 파일로 누적

## 7. 문서/코드 동기화 규칙

### 7.1 변경 매트릭스
| 변경 종류 | 반드시 같이 갱신할 문서 |
|---|---|
| endpoint 추가/shape 변경 | API_CONTRACT_v0.2.md |
| DB 테이블/RLS/함수 변경 | schema SQL |
| 화면 구조/색상/컴포넌트 변경 | DESIGN_SYSTEM.md |
| 범위/우선순위 변경 | PRODUCT_MASTER_PLAN.md / ROADMAP.md |
| 테스트 기준 변경 | TEST_STRATEGY.md |
| 데이터 보안/보관 정책 변경 | SECURITY.md |

### 7.2 완료 선언 조건
- 코드 변경
- 테스트 결과
- 문서 동기화
- 남은 리스크
- 다음 작업 제안

## 8. Codex 작업 프로토콜

### 8.1 한 번에 큰 일을 시키지 않는다
좋음:
- “Plan detail 조회 API 구현”
- “Execution 시작 함수와 endpoint 연결”
- “Saved places 화면 skeleton 구현”

나쁨:
- “앱 전체를 완성해줘”
- “모든 AI 기능까지 한 번에 구현해줘”

### 8.2 Task packet format
Codex 에게 작업을 줄 때 아래 형식을 권장한다.

```md
# Task
- 목적:
- 범위:
- 비범위:
- 참고 문서:
- 수정 가능 파일:
- 검증 기준:
- 완료 정의:
```

### 8.3 금지
- schema 없는 UI 확정
- mock contract 를 정본처럼 굳히기
- design token 무시
- service role 오남용
- migration 없이 DB 구조 직접 수정

## 9. CI 최소 게이트

초기 기준:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (web/packages)
- optimizer unit test
- SQL check or migration apply smoke test

추가로 권장:
- seed + golden scenario smoke test
- API contract drift check
- generated types drift check

## 10. 브랜치/커밋 원칙

### 브랜치
- `feat/...`
- `fix/...`
- `chore/...`
- `docs/...`

### 커밋
- `feat(plan): add plan detail query`
- `fix(execution): enforce single active execution`
- `docs(api): close v0.2 execution contract`

## 11. 구현 순서 규칙

1. schema
2. API contract
3. server implementation
4. client consumption
5. tests
6. docs sync

> 반대로 하지 않는다.

## 12. gstack 도입 시점

아래 조건이 되면 gstack 도입을 검토한다.

- Claude Code 를 실제 주력 개발 도구로 쓰고 있다
- UI 브라우저 QA 루프가 잦다
- review / qa / browse / ship 자동화 체감효용이 있다
- canonical docs 는 이미 안정화돼 있다

초기 추천:
- keep: `review`, `qa`, `browse`
- later: `ship`
- do not use as source of truth

## 13. 운영 모드 결론

- 지금은 **trimmed harness**
- 정본 문서와 작은 단위 task 기반 개발
- local Supabase first
- gstack optional later
