# TripCart Architecture v1.0
업데이트: 2026-03-24  
상태: **Canonical**

## 1. 아키텍처 목표

TripCart는 다음 조건을 만족해야 한다.

- 초기 비용이 낮아야 한다
- web / mobile / optimizer 가 분리되어야 한다
- Auth / RLS / Storage 는 일관되게 동작해야 한다
- AI 기능은 핵심 도메인 위에 얹혀야 한다
- solo founder + Codex 개발에 적합해야 한다

## 2. 최종 아키텍처

```text
apps/
  web/                Next.js
  mobile/             Expo React Native

services/
  optimizer/          FastAPI + OR-Tools

packages/
  ui/                 공유 UI 컴포넌트
  design-tokens/      색상/타입/spacing
  types/              도메인 타입 / 계약 타입
  config/             lint/tsconfig/env helpers

infra/
  supabase/           migrations / seeds / policies / edge helpers
  ci/                 workflow scripts
```

## 3. 런타임 경계

### 3.1 Web
- 공유 링크 웹 미리보기
- 운영/관리 UI
- 일부 서버 오케스트레이션
- SEO/public preview

### 3.2 Mobile
- 실제 사용자 앱
- 저장/최적화/실행/기록
- push/local alert
- receipt capture

### 3.3 Supabase
- Auth
- Postgres
- RLS
- Storage
- (선택) Edge Functions / Cron

### 3.4 Optimizer
- time window routing
- matrix orchestration
- alternatives generation
- reoptimize logic
- internal-only service

## 4. local Supabase first

### 왜 plain PostgreSQL first 가 아닌가
TripCart는 다음을 초반부터 같이 맞춰야 한다.

- `auth.users`
- row-level security
- storage upload path
- signed URL
- service role / anon role 구분

이 흐름은 plain PostgreSQL 만으로는 자연스럽게 재현되지 않는다.  
따라서 **앱 개발 기준 DB는 local Supabase** 로 고정한다.

### 언제 plain PostgreSQL 을 쓰는가
- optimizer 단독 실험
- SQL 알고리즘 검증
- 복잡한 쿼리 튜닝의 임시 sandbox

즉, 앱 기준은 Supabase, 보조 실험만 Postgres 단독 허용이다.

## 5. 데이터 접근 원칙

### 5.1 기본 CRUD
- web/mobile 에서는 Supabase client 로 직접 CRUD 가능
- 단, 사용자 소유 데이터는 전부 RLS 에 기대어 접근 제어

### 5.2 privileged orchestration
다음은 서버 측에서만 수행한다.

- optimizer 호출
- 공유 링크 snapshot 작성
- receipt OCR 외부 호출
- push token 관리/알림 발송 보조
- 관리자 승인/정정 처리

### 5.3 service role 사용 원칙
- service role key 는 서버/백그라운드 환경에서만
- web public bundle / mobile bundle 에 절대 넣지 않는다

## 6. 지도/경로 아키텍처

### 6.1 Primary routing backend
- TMAP
- 이유: 국내 자동차 기준 품질과 최적화 친화성

### 6.2 handoff 전략
- Naver Map 으로 handoff
- 직접 turn-by-turn 구현은 MVP 제외
- 구간별 “네이버 지도에서 열기” 를 기본 UX 로 둔다

### 6.3 multi-provider policy
- primary: TMAP
- secondary fallback: Naver / Kakao
- provider 추상화는 `route_provider` 기준으로 유지
- 캐시 테이블은 provider / mode / time band 를 key 로 포함한다

## 7. 데이터 품질 아키텍처

### 7.1 Places seed
- TourAPI / 수동 검증 / 공식 API 조합
- seed dataset 은 한 지역만 집중

### 7.2 correction loop
- 사용자 제보 -> 관리자 승인 -> place data 업데이트

### 7.3 quality score
- BT/영업시간/체류시간/연락처/좌표 검증도에 따라 계산

## 8. AI 기능 아키텍처

### 8.1 Gap Suggest
- 검색/필터/constraint scoring
- 필요 시 LLM 은 rank/summary 용도로만 사용
- 후보 장소 생성은 deterministic retrieval 기반

### 8.2 Receipt OCR
- 사진 업로드 -> OCR draft -> review -> confirm -> spend 생성
- 자동 저장 금지
- confidence 기반 수정 UX 필요

### 8.3 Smart Alert
- V1: 로컬 스케줄 우선
- V1.5+: push token registration + 서버 보조
- V2: 실행 ETA 변경 기반 재스케줄 확장

## 9. Monorepo 규칙

### 9.1 Package ownership
- `packages/design-tokens`: 색/폰트/spacing 정본
- `packages/types`: API/DB DTO / shared enums
- `packages/ui`: pure presentational components
- `services/optimizer`: TS 앱에서 import 하지 않는 별도 서비스

### 9.2 공유 코드 원칙
- web/mobile 공통 도메인 타입은 `packages/types`
- UI 토큰과 primitive 는 `packages/ui`
- optimizer 로직은 Python 에만 둔다
- Supabase access helper 는 app-level 에 둔다 (과도한 shared abstraction 금지)

## 10. 배포 구조

### 10.1 초기 권장
- web: Vercel
- mobile: Expo EAS
- optimizer: Linux server / Docker
- db/auth/storage: Supabase hosted
- local dev: local Supabase CLI + local optimizer

### 10.2 이유
- web/mobile 은 빠른 배포가 필요
- optimizer 는 serverless duration 제약에서 벗어나야 한다
- Supabase 가 Auth/RLS/Storage 통합에 유리하다

## 11. 환경 변수 정책

### 11.1 public
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 11.2 server only
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `OPTIMIZER_INTERNAL_TOKEN`
- `TMAP_API_KEY`
- `NAVER_MAP_CLIENT_ID`
- `OCR_PROVIDER_KEY`

### 11.3 mobile
- public 값만 embed
- privileged key 는 절대 mobile 에 넣지 않음

## 12. 확정 기술 스택 버전

| 기술 | 확정 버전 | 비고 |
|---|---|---|
| Node.js | **22.x LTS** | Next.js 16 권장 최소 |
| pnpm | **10.x** | 모노레포 패키지 매니저 |
| Turborepo | **2.x** | 빌드 캐시/파이프라인 |
| TypeScript | **5.8.x** | 생태계 호환성 최적 |
| Next.js | **16.x** | App Router, Turbopack 기본 |
| React | **19.2.x** | Next.js 16 내장 |
| Tailwind CSS | **4.1.x** | CSS-first; `@theme` 방식 (tailwind.config.js 없음) |
| ESLint | **9.x** | flat config (`eslint.config.js`) |
| Prettier | **3.5.x+** | |
| Vitest | **3.x** | 단위/통합 테스트 |
| Playwright | **1.57.x+** | E2E 테스트 |
| @supabase/supabase-js | **2.80.x** | |
| Supabase CLI | **2.83.x** | 로컬 PostgreSQL 17 기본 제공 |
| PostgreSQL | **17** | Supabase CLI 기본값; 스키마 `PostgreSQL 17+` 기준 |
| Expo | **SDK 54** (RN 0.81) | Dev Client 기준, Expo Go 아님 |
| Python | **3.14.x** | optimizer 전용 |
| uv | 최신 stable | Python 패키지 매니저 |
| FastAPI | **0.115.x+** | `fastapi[standard]` 설치 |
| uvicorn | **0.34.x+** | |
| Pydantic | **2.12.x** | |
| OR-Tools | **9.12.x+** | CP-SAT solver |

## 12. 관찰/운영

### 로그
- optimize duration
- matrix cache hit ratio
- share import success rate
- receipt parse success/fail
- alert scheduled / delivered

### 반드시 계측할 것
- optimize p50 / p95
- warning_count
- execution start rate
- reopt_count
- OCR review completion rate

## 13. 현재 아키텍처 결정 요약

- local Supabase first
- routing backend = TMAP
- handoff = Naver
- optimizer = separate Python service
- direct Supabase CRUD + privileged server orchestration 혼합
- gstack 은 아키텍처 기반이 아니라 부가 productivity layer
