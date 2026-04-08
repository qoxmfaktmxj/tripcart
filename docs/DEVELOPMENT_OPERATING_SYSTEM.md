# TripCart Development Operating System

Updated: 2026-04-08
Status: Canonical

## Operating model

TripCart runs on canonical docs plus execution-oriented implementation work.
The repo is optimized for a small-team workflow with strong documentation discipline.

The current model is:

- docs define product, architecture, schema, API, and governance
- implementation follows those docs in small task packets
- local Supabase is the baseline development environment
- review, QA, and ship automation are useful, but they are not the source of truth

## Source of truth

The source of truth lives in `docs/`.

Priority order:

1. product and architecture docs
2. API contract and canonical schema
3. tests and validation rules
4. implementation code

If code and docs disagree, update the docs first, then update the code.

## Current required documents

- `docs/00_READ_THIS_FIRST.md`
- `docs/PRODUCT_MASTER_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACT_v0.2.md`
- `docs/tripcart_schema_canonical_v0.3.sql`
- `docs/DESIGN_SYSTEM.md`
- `docs/TEST_STRATEGY.md`
- `docs/SECURITY.md`
- `AGENTS.md`

## Bootstrap baseline

TripCart Phase 0 assumes:

- Node.js 22.x
- pnpm 10.x
- Docker Desktop
- Python 3.14.x
- uv
- local Supabase
- Expo SDK 54 for mobile
- Next.js 16 for web

## Build order

Every non-trivial feature should follow this order:

1. schema
2. API contract
3. server implementation
4. client consumption
5. tests
6. docs sync

Do not reverse this order.

## Recommended repo structure

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
  docs/
  todo/
```

## Minimum quality gates

Before calling work complete:

- `pnpm lint`
- `pnpm typecheck`
- relevant tests if they exist
- runtime validation for changed surfaces
- docs updated when behavior, contracts, schema, or process changed

## Task packet format

```md
# Task
- Purpose:
- Scope:
- Non-scope:
- Reference docs:
- Editable files:
- Validation criteria:
- Definition of done:
```

## Tooling policy

Useful supporting tools:

- QA and browse flows for browser validation
- review flows for pre-landing analysis
- ship flow for verification before push

Those tools are helpers.
They do not replace canonical docs or explicit repo governance.