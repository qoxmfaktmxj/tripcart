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
- public landing page surfaces (anonymous-first onboarding)

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

### Guest trial + migration boundary

- 비로그인 상태에서는 브라우저 로컬 상태(`localStorage`)를 기준으로 장소 담기와 초안 플랜 생성이 가능해야 한다.
- `/`는 공개 랜딩이고, `/places`, `/saved-places`, `/plans`는 guest-first 체험 surface다.
- 로그인 성공 후에는 웹 클라이언트가 기존 authenticated API를 사용해 guest 상태를 계정으로 이관한다.
  - 저장 장소: `POST /api/v1/me/saved-places`
  - 초안 플랜: `POST /api/v1/plans`
- 별도의 `guest-migrate` 서버 엔드포인트는 두지 않는다. 이관 오케스트레이션은 웹 클라이언트가 담당한다.
- 이관 성공 후에는 성공한 항목만 브라우저 로컬 상태에서 제거하고, 실패한 항목은 남겨 재시도 가능하게 유지한다.
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
