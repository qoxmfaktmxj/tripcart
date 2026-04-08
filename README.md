# TripCart

TripCart turns destination candidates into travel plans you can actually run.
It is built around realistic planning constraints, then carried through to execution.

## What it is

TripCart is a Korea-first travel planning product with a split architecture:

- `web` for auth, management, public preview, and shared links
- `mobile` for real trip usage and execution flows
- `optimizer` for route planning and alternatives generation
- `Supabase` for auth, Postgres, RLS, and storage

The product principle is simple: planning and execution are not the same thing.

## Current status

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Monorepo, local Supabase, shared packages, web/mobile bootstrap | Complete |
| Phase 1 | Auth, Places, Saved Places, Plans CRUD | API scaffold in progress |
| Phase 2 | Optimizer integration, share/import, alternatives | Next |
| Phase 3 | Execution, spends, media | Planned |
| Phase 4 | Receipt OCR, gap suggest, smart alert | Planned |

## Latest verified state

- `2026-04-08`
- web home responds with HTTP `200`
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm build` passes in the pre-push gate
- Phase 0 bootstrap docs have been normalized for clean local rendering

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
| Node.js | Node.js LTS | 22.x |

## Repository layout

```text
tripcart/
  apps/
    web/
    mobile/
  services/
    optimizer/
  packages/
    design-tokens/
    types/
    ui/
    config/
  infra/
    supabase/
  docs/
  todo/
```

## Local development

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- Docker Desktop
- Python 3.14.x
- uv

### Install

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env.local
```

Fill the Supabase and optimizer values in `.env.local`.

### Start local Supabase

```bash
supabase start --workdir infra/supabase
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql
```

### Start the apps

```bash
pnpm --filter @tripcart/web dev
pnpm --filter @tripcart/mobile start
```

### Start the optimizer

```bash
cd services/optimizer
uv sync
uv run uvicorn main:app --reload --port 8000
```

## Common commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Key documents

| File | Purpose |
|---|---|
| [docs/00_READ_THIS_FIRST.md](docs/00_READ_THIS_FIRST.md) | Entry point |
| [docs/PRODUCT_MASTER_PLAN.md](docs/PRODUCT_MASTER_PLAN.md) | Product scope and milestones |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/API_CONTRACT_v0.2.md](docs/API_CONTRACT_v0.2.md) | API contract |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | UI tokens and component rules |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phase roadmap |
| [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) | Test expectations |
| [todo/PHASE_0_CHECKLIST.md](todo/PHASE_0_CHECKLIST.md) | Bootstrap exit checklist |
| [CLAUDE.md](CLAUDE.md) | Agent workflow rules |
