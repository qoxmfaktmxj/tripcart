# TripCart Canonical Build Pack

Updated: 2026-04-08  
Status: Canonical

This is the entry note for TripCart development.
Read this file first, then move through the canonical docs in order.

Older source files such as `TripCart_Master_Plan.docx`, `TripCart_Roadmap.docx`,
`TripCart_Design_System.docx`, `TripCart_API_Contract.docx`,
`tripcart_schema_v0.1.sql`, `tripcart_schema_v0.2_migration.sql`, and earlier
PRD or addendum notes are archive material only. If they conflict with the files
listed here, the canonical docs win.

## Current status

- Product direction: `GO`
- Architecture and docs baseline: `GO`
- Repository bootstrap: `GO`
- If docs and code disagree, update the docs first, then align the code

## Canonical doc hierarchy

### Tier 1, build-blocking source of truth
1. `00_READ_THIS_FIRST.md`
2. `AGENTS.md`
3. `PRODUCT_MASTER_PLAN.md`
4. `ARCHITECTURE.md`
5. `API_CONTRACT_v0.2.md`
6. `tripcart_schema_canonical_v0.3.sql`
7. `DESIGN_SYSTEM.md`

### Tier 2, execution and operating rules
8. `ROADMAP.md`
9. `DEVELOPMENT_OPERATING_SYSTEM.md`
10. `TEST_STRATEGY.md`
11. `SECURITY.md`

### Tier 3, implementation support files
12. `tripcart-design-tokens.final.ts`
13. `tripcart_schema_v0.2_hardening_patch.sql`

## Recommended read order

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

## Locked decisions from this build pack

- Product name: `TripCart`
- Product focus: practical trip planning, not generic content browsing
- MVP shape: one region, car-first routing, plan generation, sharing, cloning, and execution basics
- Routing policy: `TMAP` backend routing plus `Naver Map` handoff
- Backend platform: `Supabase`
- Local baseline: local Supabase first, not plain PostgreSQL first
- Optimizer stack: `Python FastAPI + OR-Tools`
- Execution workflow baseline: `AGENTS.md + DEVELOPMENT_OPERATING_SYSTEM.md`
- gstack usage: optional helper, not a product dependency

## Quick bootstrap

```bash
# 1) install workspace dependencies
pnpm install

# 2) start local Supabase
supabase start --workdir infra/supabase

# 3) apply canonical schema
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql

# 4) optionally seed golden scenarios
psql "$SUPABASE_DB_URL" -c "select public.seed_golden_scenarios('<YOUR_USER_UUID>'::uuid);"

# 5) start web and mobile
pnpm --filter @tripcart/web dev
pnpm --filter @tripcart/mobile start

# 6) start optimizer
cd services/optimizer
uv sync
uv run uvicorn main:app --reload --port 8000
```

## Never do this

- Do not treat older archived docs as source of truth
- Do not invent endpoints before the API contract is updated
- Do not lock execution lifecycle behavior in app-only mock state
- Do not put automatic live navigation crawling into the MVP
- Do not standardize auth or storage flows around plain PostgreSQL without local Supabase
