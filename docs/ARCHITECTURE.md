# TripCart Architecture

Updated: 2026-04-08
Status: Canonical

## Goals

TripCart is designed to stay practical for a solo-founder workflow while keeping product boundaries clean.

The architecture must satisfy these constraints:

- web, mobile, and optimizer are separate runtime boundaries
- auth, RLS, and storage are handled by Supabase
- planning and execution stay separated in both product and data model
- local development starts from local Supabase, not plain PostgreSQL alone
- AI-style features stay downstream of deterministic product flows

## Top-level architecture

```text
apps/
  web/                Next.js 16
  mobile/             Expo SDK 54 / React Native 0.81

services/
  optimizer/          FastAPI + OR-Tools

packages/
  ui/                 shared UI primitives
  design-tokens/      colors, spacing, typography tokens
  types/              shared domain and API types
  config/             shared lint and TypeScript configuration

infra/
  supabase/           migrations, local stack config, bootstrap scripts
```

## Runtime responsibilities

### Web

- auth entry points
- management UI
- public preview and shared links
- server-side orchestration for privileged operations

### Mobile

- trip usage during execution
- alerts and recording flows
- camera and device-adjacent capabilities later in the roadmap

### Supabase

- auth
- Postgres
- RLS
- storage
- server-only privileged access via service role

### Optimizer

- time-window routing
- alternatives generation
- re-optimization
- internal-only API surface

## Data access model

### Direct CRUD

Web and mobile may use Supabase clients directly for user-owned CRUD paths that are protected by RLS.

### Privileged orchestration

The following flows remain server-side only:

- optimizer calls
- shared snapshot generation
- OCR or background processing later in the roadmap
- push token and notification support

## Local Supabase first

TripCart depends on `auth.users`, RLS, storage paths, signed URLs, and role separation.
That makes local Supabase the correct development baseline.

Plain PostgreSQL still has value for optimizer-only experiments and SQL sandboxing, but it is not the product development baseline.

## Navigation provider policy

- Primary route backend: TMAP
- Handoff target for navigation UX: Naver Map
- Multi-provider fallback can be added behind a provider abstraction later

## Monorepo rules

- `packages/design-tokens` is the UI token source of truth
- `packages/types` owns shared API and domain contracts
- `packages/ui` should stay presentational
- optimizer logic stays in Python and does not get re-implemented in TypeScript

## Deployment shape

- web: Vercel
- mobile: Expo EAS / dev client workflow
- optimizer: Linux or containerized service
- auth/db/storage: Supabase
- local development: local Supabase CLI + local optimizer

## Environment boundaries

### Public

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server only

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `OPTIMIZER_INTERNAL_TOKEN`
- provider and OCR secrets

## Locked stack versions

| Technology | Version |
|---|---|
| Node.js | 22.x |
| pnpm | 10.x |
| Turborepo | 2.x |
| TypeScript | 5.9.x |
| Next.js | 16.x |
| React (web) | 19.2.x |
| Expo | SDK 54 |
| React Native | 0.81.x |
| Tailwind CSS | 4.1.x |
| Supabase CLI | 2.8x |
| PostgreSQL | 17 |
| Python | 3.14.x |
| FastAPI | 0.115.x+ |
| OR-Tools | 9.12.x+ |