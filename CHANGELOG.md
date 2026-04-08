# CHANGELOG

All notable changes to this project will be documented in this file.

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