# CHANGELOG

All notable changes to this project will be documented in this file.

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
