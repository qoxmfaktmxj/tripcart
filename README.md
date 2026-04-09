# TripCart

TripCart는 여행 장소를 장바구니처럼 담고, 실행 가능한 일정으로 정리하는 guest-first 여행 계획 제품입니다.

The product principle is simple: planning and execution are not the same thing.

## What it is

- 여행 장소 후보를 먼저 모읍니다.
- 저장한 후보를 초안 플랜으로 정리합니다.
- 필요할 때 로그인해 브라우저에 담아둔 데이터를 계정으로 이어서 관리합니다.

## Current status

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Monorepo, local Supabase, shared packages, web/mobile bootstrap | Complete |
| Phase 1 | Auth, Places, Saved Places, Plans CRUD | In progress |
| Phase 1.5 | Guest-first trial, login migration, public landing | In progress |
| Phase 2 | Optimizer integration, share/import, alternatives | Next |
| Phase 3 | Execution, spends, media | Planned |
| Phase 4 | Receipt OCR, gap suggest, smart alert | Planned |

### Product interaction model

- `/`는 공개 앱스토어형 랜딩입니다.
- `/places`, `/saved-places`, `/plans`는 비로그인에서도 먼저 써볼 수 있는 guest-first surface입니다.
- 로그인 후에는 브라우저 guest 상태를 기존 authenticated API를 통해 계정으로 이관합니다.
- `/plans/[id]` 같은 운영형 상세 화면은 로그인 이후의 planning surface로 유지합니다.

## Guest-first trial state

### 2026-04-09

- 홈 랜딩을 공개 앱스토어형 메시지로 정렬
- 비로그인 상태에서 장소 담기, 저장한 장소 확인, 초안 플랜 생성 가능
- 로그인/회원가입 후 guest saved places, guest draft plans를 계정으로 이관
- 문서 기준도 client-side migration + existing authenticated APIs로 정렬

### Previously verified state

- `2026-04-09`
- web home responds with HTTP `200`
- web `/places` responds with HTTP `200`
- web `/saved-places` responds with HTTP `200` for guest users
- web `/plans` responds with HTTP `200` for guest users
- web `/plans/[id]` responds with HTTP `200` for authenticated users
- guest save -> guest plan create -> login migration flow passes in browser QA
- `pnpm --filter @tripcart/web e2e` passes
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm build` passes

## Current implemented slice

- 공개 랜딩과 운영 화면 분리
- 홈 화면을 공개 앱스토어형 랜딩으로 전환
- guest saved places and guest draft plans backed by browser localStorage
- login/signup migration orchestrated on the web client
- `GET /api/v1/places`
- `GET /api/v1/places/[id]`
- `GET /api/v1/me/saved-places`
- `POST /api/v1/me/saved-places`
- `DELETE /api/v1/me/saved-places/[placeId]`
- `GET /api/v1/plans`
- `POST /api/v1/plans`
- `GET /api/v1/plans/[id]`
- `PATCH /api/v1/plans/[id]`
- `DELETE /api/v1/plans/[id]`
- web browse page at `/places`
- web detail page at `/places/[id]`
- web saved places page at `/saved-places`
- web plans page at `/plans`
- web plan detail page at `/plans/[id]`

## Tech stack

| Area | Stack | Version |
|---|---|---|
| Web | Next.js + React | 16.x / 19.2.x |
| Web styling | Tailwind CSS | 4.1.x |
| Mobile | Expo + React Native | SDK 54 / RN 0.81 |
| Backend platform | Supabase | PostgreSQL 17 |
| Optimizer | FastAPI + OR-Tools | Python 3.14 |
| Monorepo | pnpm workspaces + Turborepo | 10.x / 2.x |
| Language | TypeScript | 5.9.x |

## Repository layout

- `apps/web`: public landing and authenticated planning web surface
- `apps/mobile`: Expo mobile app
- `services/optimizer`: FastAPI optimizer service
- `packages/types`: shared domain and API contracts
- `packages/design-tokens`: design token source of truth
- `infra/supabase`: local Supabase config and migrations
- `docs`: canonical product, architecture, API, schema, design docs

## Local development

### Prerequisites

- `Node.js 24.x`
- `pnpm 10.x`
- `Supabase CLI`
- `Python 3.14`

### Install

```bash
pnpm install
```

### Environment

- `apps/web/.env.local`
- `apps/mobile/.env`
- local Supabase credentials from `supabase status`

### Start local Supabase

```bash
supabase start
supabase db reset
```

### Start the apps

```bash
pnpm dev
```

### Current local URLs

- web: [http://localhost:3000](http://localhost:3000)
- mobile Metro: [http://localhost:8082](http://localhost:8082)
- Supabase Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323)
- Supabase API: [http://127.0.0.1:54321](http://127.0.0.1:54321)

### Start the optimizer

```bash
cd services/optimizer
uv sync
uv run uvicorn main:app --reload --port 8100
```

## Common commands

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @tripcart/web test
pnpm --filter @tripcart/web e2e
pnpm --filter @tripcart/web dev
pnpm --filter @tripcart/mobile dev
```

## Key documents

- [docs/00_READ_THIS_FIRST.md](docs/00_READ_THIS_FIRST.md)
- [docs/PRODUCT_MASTER_PLAN.md](docs/PRODUCT_MASTER_PLAN.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/API_CONTRACT_v0.2.md](docs/API_CONTRACT_v0.2.md)
- [docs/tripcart_schema_canonical_v0.3.sql](docs/tripcart_schema_canonical_v0.3.sql)
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
