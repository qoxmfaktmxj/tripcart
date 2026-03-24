# 🛒 TripCart

> 저장한 장소를 실행 가능한 여행 일정으로 — 덜 헤매고, 덜 놓치고, 더 잘 기억하게

---

## 개요

TripCart는 국내 여행자가 저장한 식당 · 카페 · 관광지를 바탕으로,
영업시간 · 브레이크타임 · 체류시간 · 이동수단을 고려해 **실제로 실행 가능한 일정**을 만들어 주는 앱이다.

핵심은 검색이 아니라 **정렬과 실행**이다.

---

## 기술 스택

| 영역 | 기술 | 버전 |
|---|---|---|
| Web | Next.js + React | 16.x / 19.2.x |
| Web Styling | Tailwind CSS | 4.1.x (CSS-first) |
| Mobile | Expo (React Native) | SDK 54 / RN 0.81 |
| DB / Auth / Storage | Supabase | PostgreSQL 17 |
| Optimizer | FastAPI + OR-Tools | Python 3.14 |
| Monorepo | pnpm workspaces + Turborepo | 10.x / 2.x |
| Language | TypeScript | 5.8.x |
| Node.js | Node.js LTS | 22.x |

---

## 모노레포 구조

```
tripcart/
  apps/
    web/              # Next.js 16 — 공유 페이지, 웹앱
    mobile/           # Expo SDK 54 — iOS/Android 앱
  services/
    optimizer/        # FastAPI + OR-Tools — 일정 최적화 엔진
  packages/
    design-tokens/    # @tripcart/design-tokens — 색상/폰트/spacing
    types/            # @tripcart/types — 도메인 타입 / API DTO
    ui/               # @tripcart/ui — 공유 UI 컴포넌트
    config/           # @tripcart/config — ESLint / tsconfig / Prettier
  infra/
    supabase/         # DB 마이그레이션, 시드, 로컬 설정
    ci/               # CI 스크립트
  docs/               # 설계 문서 (Canonical)
  todo/               # 체크리스트 / 태스크 파일
```

---

## 로컬 개발 시작

### 전제 조건
- Node.js 22.x LTS
- pnpm 10.x (`npm install -g pnpm`)
- Docker Desktop (Supabase 로컬 스택)
- Python 3.14.x + uv (`pip install uv`)

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 에 Supabase 키 입력 (supabase start 후 출력값 사용)
```

### 3. Supabase 로컬 스택 시작

```bash
supabase start --workdir infra/supabase

# 스키마 적용
psql "$SUPABASE_DB_URL" -f docs/tripcart_schema_canonical_v0.3.sql
```

> 상세 가이드: [`infra/supabase/README.md`](infra/supabase/README.md)

### 4. 개발 서버 실행

```bash
# Web (Next.js 16 + Turbopack)
pnpm --filter @tripcart/web dev

# Optimizer (FastAPI)
cd services/optimizer
uv sync
uv run uvicorn main:app --reload --port 8000
```

---

## 개발 명령어

```bash
pnpm lint        # 전체 lint
pnpm typecheck   # 전체 타입 검사
pnpm test        # 전체 테스트
pnpm build       # 전체 빌드
```

---

## 문서

| 문서 | 설명 |
|---|---|
| [`docs/PRODUCT_MASTER_PLAN.md`](docs/PRODUCT_MASTER_PLAN.md) | 제품 비전, 범위, 도메인 모델 |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 시스템 아키텍처, 기술 스택 버전 |
| [`docs/API_CONTRACT_v0.2.md`](docs/API_CONTRACT_v0.2.md) | API 엔드포인트 명세 |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | 컬러 시스템, 타이포그래피, 컴포넌트 |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase별 로드맵 |
| [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md) | 테스트 전략, 골든 시나리오 |
| [`CLAUDE.md`](CLAUDE.md) | AI 에이전트 운영 규칙 |

---

## 현재 진행 상황

| Phase | 내용 | 상태 |
|---|---|---|
| **Phase 0** | 인프라 부트스트랩 (모노레포 · 스캐폴딩 · 문서) | ✅ **완료** |
| Phase 1 | Auth + Places / Saved Places / Plans CRUD | 🔜 다음 |
| Phase 2 | Optimizer 연동 · 대안 일정 · 공유/복제 | ⏳ |
| Phase 3 | Execution · 지출 · 미디어 | ⏳ |
| Phase 4 | Receipt OCR · Gap Suggest · Smart Alert | ⏳ |

> 상세 체크리스트: [`todo/PHASE_0_CHECKLIST.md`](todo/PHASE_0_CHECKLIST.md)
