# CHANGELOG

All notable changes to this project will be documented in this file.

## [0.0.1.9] - 2026-04-09

### Changed
- Updated the canonical design guide to reflect the 2026-04 visual refresh direction, separating the public app-store-style landing from the logged-in operational planning surfaces.
- Added explicit visual rules for the landing hero, browse split view, plans dashboard, and plan detail screens so the redesign work has a stable source of truth.

### Noted
- Recorded that the landing and browse surfaces are close enough to keep, while the plans dashboard and plan detail surfaces still need one more polish pass before they should be treated as fully reference-aligned.

## [0.0.1.8] - 2026-04-09

### Added
- Added a guest-first public landing flow so `/`, `/places`, `/saved-places`, and `/plans` can be used before authentication.
- Added browser-backed guest state for saved places and draft plans using localStorage.
- Added authenticated migration from guest saved places and guest draft plans into the existing saved places and plans APIs after login or signup.
- Added Playwright E2E coverage for the guest save -> guest plan -> auth migration flow and for guest-state persistence across reloads.

### Changed
- Updated the canonical docs and roadmap to describe the guest-first trial model, client-side migration boundary, and public landing direction.
- Updated the web README status to reflect the guest-first surface and current E2E verification.
- Simplified the saved places client hook to use a view model instead of pretending guest-local items are full server records.

### Fixed
- Fixed broken Korean text and metadata around the new landing and guest migration surfaces.
- Fixed guest plan creation so whitespace-only titles are rejected before writing browser draft data.
- Fixed auth `next` propagation across login and signup pages, and wrapped search-param reads in Suspense so production builds succeed.
- Fixed guest migration locking so aborted renders do not leave a stale session lock behind.

### Verified
- Verified guest save, guest draft creation, reload persistence, login/signup migration, saved places, and plan detail flows in browser E2E.
- Verified `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter @tripcart/web e2e`, and `pnpm build`.

## [0.0.1.7] - 2026-04-09

### Changed
- Localized the current web and mobile placeholder UI copy into Korean across the home, auth, places, saved places, and plans flows.
- Mapped raw region and transport values into Korean labels so the interface no longer exposes internal codes such as `busan` and `car`.
- Updated the plans create surface to use a Korean region selector instead of raw text entry.

### Fixed
- Cleaned broken Korean text rendering and mojibake in the places detail, saved places, plans, and mobile placeholder screens.

### Verified
- Verified the signup, places browse, save/remove, saved places, plans create, and plan detail flows in the local browser on both desktop and mobile-sized viewports.

## [0.0.1.6] - 2026-04-09

### Added
- Added a `/plans/[id]` web detail screen that consumes the existing authenticated plan detail API and exposes minimal draft edit and delete actions.
- Added direct navigation from the plans list into the new web detail screen.

### Changed
- Allowed `127.0.0.1` as a local Next.js dev origin so browser QA can use either localhost form consistently during development.

### Verified
- Verified the plans create, detail, edit, delete, and unauthenticated redirect flow against the local web server and authenticated plans API.

## [0.0.1.5] - 2026-04-09

### Fixed
- Stabilized the login and signup submit paths so Playwright and browser clicks both reach the Supabase auth flow reliably.
- Fixed the web auth proxy matcher so `/_next` dev resources are no longer intercepted by the application proxy.
- Added a web favicon and cleaned the remaining broken auth-related code comments in the web client layer.

### Verified
- Re-ran the saved places flow in a real browser on a production `next start` server and on the local dev server via `http://localhost:3000`.
- Confirmed login, save, saved list render, remove, and unauthenticated redirect behavior all work in the browser.

## [0.0.1.4] - 2026-04-09

### Added
- Added authenticated saved places UI flow on web, including save and remove actions from the places list and detail pages.
- Added a `/saved-places` page backed by the existing saved places API.

### Fixed
- Fixed auth proxy behavior so protected API routes return `401` JSON instead of redirecting to the login page.
- Cleaned up the login and signup pages so their user-facing text renders correctly.
- Updated the README to reflect the saved places slice and the latest verified QA state.

## [0.0.1.3] - 2026-04-09

### Added
- Added a first Phase 1 web slice with `/places` browse and `/places/[id]` detail pages backed by the existing places read API.
- Added home page entry points for the places browse surface and the local places API.

### Fixed
- Re-saved the canonical Korean docs with Windows-friendly UTF-8 BOM so local PowerShell reads them cleanly.
- Updated the README to reflect the current verified local routes and Phase 1 progress.

## [0.0.1.2] - 2026-04-08

### Fixed
- Rebuilt `docs/00_READ_THIS_FIRST.md` into clean UTF-8 text so the canonical entry doc is readable again.
- Updated the README with the latest verified repository state and linked the Phase 0 bootstrap checklist.

## [0.0.1.1] - 2026-04-08

### Fixed
- Fixed the Phase 0 checklist document so Korean text renders cleanly in the local Windows editing flow.
- Tightened checklist wording for the current local Supabase, web, mobile, optimizer, and CI bootstrap steps.

## [0.0.1.0] - 2026-04-08

### Added
- Added placeholder mobile assets and a flat ESLint config so the Expo workspace boots and lints cleanly.
- Added a Next.js `proxy.ts` auth boundary and expanded shared API/domain types for the local Supabase scaffold.

### Changed
- Updated the mobile workspace to Expo SDK 54 compatible package versions.
- Aligned the web workspace with Next.js 16 and ESLint 9 conventions.
- Refined the Phase 0 placeholder screens and metadata copy for stable rendering across web and mobile.

### Fixed
- Fixed CSS and static asset requests being redirected by the auth proxy, which caused the web home page to render without styles.
- Fixed the web home page mobile layout overflow and removed broken encoded UI strings from web and mobile placeholder screens.