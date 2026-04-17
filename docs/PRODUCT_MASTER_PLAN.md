# TripCart Product Master Plan v1.1
업데이트: 2026-04-15
상태: **Canonical**

## 1. 제품 한 줄 정의

TripCart는 국내 여행자가 저장한 식당/관광지/카페를 바탕으로,  
영업시간·브레이크타임·체류시간·이동수단을 고려해 **실제로 실행 가능한 일정** 을 만들어 주는 앱이다.

핵심은 검색이 아니라 **정렬과 실행** 이다.

## 2. 앱 이름 결정

- 최종 이름: **TripCart**
- 이유:
  - 사용자의 핵심 행위가 “장소를 담는다 → 일정으로 만든다” 이므로 `Cart` 메타포가 정확하다
  - `TravelCart` 보다 범위가 좁고 제품 구조와 더 밀접하다
  - “장바구니 기반 itinerary generation” 이라는 제품 설명과 직접 맞물린다

## 3. 해결하려는 문제

### 3.1 사용자 문제
- 저장해 둔 장소가 많아도 실제 방문 순서와 시간을 맞추기 어렵다
- 영업시간, 브레이크타임, 라스트오더, 이동시간을 수동으로 계산해야 한다
- 기존 지도 앱은 경유지 경로는 보여줘도 **하루 일정 전체** 를 시간 제약까지 반영해 설계해주지 못한다
- 실제 여행 중 일정이 밀리면 남은 코스를 다시 정렬하기 어렵다
- 여행이 끝난 뒤 계획과 실제 기록, 지출, 사진이 한곳에 남지 않는다

### 3.2 우리가 제공하는 가치
- 덜 헤매고
- 덜 놓치고
- 더 잘 기억하게 한다

## 4. 핵심 제품 원칙

### 4.1 Plan / Execution 분리
- Plan = 예정 일정
- Execution = 실제 여행 기록
- 이유: 재최적화, 지출 집계, 사진 기록, 회고 비교를 안정적으로 처리하기 위해서다

### 4.2 Shared Template / Scheduled Instance 분리
- 공유 가능한 코스 원본과 누군가 특정 날짜에 가져온 일정을 분리한다
- 원본을 수정해도 이미 가져간 사람의 일정이 바뀌면 안 된다

### 4.3 상대시간 / 절대시간 병용
- 공유용 코스: 상대 오프셋(`D1+90분`)
- 실제 일정: 절대 시간(`2026-05-02T11:30:00+09:00`)
- 자정 넘김 표현은 설계 초기부터 지원한다

### 4.4 제품 목표
TripCart는 “여행 콘텐츠 플랫폼”보다 “여행 운영 도구”에 가깝다.  
즉, 예쁜 카드 모음보다 **실제 실행 가능성** 이 더 중요하다.

### 4.5 로그인과 동기화 원칙
- 로그인은 시작 장벽이 아니라 동기화 시점이다.
- 비로그인 상태에서도 장소 담기와 초안 플랜 생성까지는 허용한다.
- 게스트 상태는 1차적으로 브라우저 로컬 저장소에 보관하고, 로그인 성공 후 계정으로 이관한다.
## 5. 대상 사용자

### 5.1 1차 대상
- 국내여행을 자주 다니는 20-30대
- 맛집/카페/관광지 저장 습관이 있는 사용자
- 당일치기, 1박2일 코스를 직접 짜는 사용자

### 5.2 2차 대상
- 커플/친구 단위 여행자
- 자동차 이동 중심 사용자
- 공유 받은 코스를 그대로 따라가고 싶은 사용자

### 5.3 후순위 대상
- 아이 동반/부모님 동반 가족 단위
- 대중교통 중심 장거리 다일정 사용자
- 제휴/큐레이션 중심 B2B/B2G 확장

## 6. 범위 정의

## 6.1 MVP (출시 컷)
- 한 지역만 지원 (권장: 부산)
- 이동수단은 **자동차 우선**
- 장소 담기
- 출발지 설정
- 최적화 1회 + 대안 일정안 2-3개 반환
- 일정 결과 타임라인/지도 표시
- 일정 공유 링크 생성
- 공유 일정 가져오기(import)
- 여행 시작 후 execution 생성
- 실제 방문 체크/건너뜀
- 간단한 지출 기록
- 외부 지도 앱 handoff

### 6.1.1 게스트 우선 실행 모델
- 공개 랜딩에서 장소 탐색, 담기, 초안 플랜 생성이 가능해야 한다.
- 로그인 전에도 장소를 장바구니처럼 임시 저장하고 일정 초안을 만들어두는 사용자를 허용한다.
- 로그인 시점에 로컬 게스트 데이터(저장 장소, 초안 플랜, 초안 stop)를 인증 계정으로 이관한다.
- 이관 실패/부분 이관은 사용자에게 투명하게 표시하고 재시도할 수 있어야 한다.

### 6.1.2 홈 랜딩과 운영면 분리
- `/`는 공개 앱스토어형 랜딩으로 두고, 전환 유도를 위해 기능 데모 + 신뢰 메시지로 구성한다.
- 운영 핵심면(저장 목록, 플랜 목록/상세)은 로그인 이후 접근하는 운영 화면으로 분리한다.
- 게스트 동작은 브라우저 로컬 상태에서 관리하고, 로그인은 병합만 수행한다.

## 6.2 V1.5
- 주간/월간 지출 통계
- 사진 기록
- 실행 중 재최적화
- 로컬/푸시 기반 스마트 알림
- 공유 카드 강화
- 지역 2곳 이상 확장

## 6.3 V2
- 빈틈 채우기 AI 추천
- 영수증 OCR 자동 입력
- 대중교통 모드 고도화
- 정교한 메뉴 자동완성
- 개인화 추천
- 혼잡도/날씨 기반 fallback

## 6.4 의도적으로 미루는 것
- 네이티브 턴바이턴 내비게이션 직접 구현
- 전국 동시 런칭
- 실시간 공동편집
- 자동 네이버 크롤링
- 과도한 콘텐츠 큐레이션/피드형 홈

## 7. 최종 기술 스택 결정

| 영역 | 최종 선택 | 확정 버전 | 이유 |
|---|---|---|---|
| Web | Next.js | **16.x** | 공유 페이지, 웹앱, 운영/관리도구 |
| Web Runtime | React | **19.2.x** | Next.js 16 내장 |
| Web Styling | Tailwind CSS | **4.1.x** | CSS-first @theme 방식 |
| Mobile | Expo (React Native) | **SDK 54** (RN 0.81.x) | iOS/Android 동시 대응, 빠른 반복 |
| DB/Auth/Storage | Supabase | PostgreSQL **17** | Auth + RLS + Storage + local stack 일체화 |
| Supabase JS | @supabase/supabase-js | **2.80.x** | 공식 JS 클라이언트 |
| Optimizer | Python FastAPI + OR-Tools | FastAPI **0.115.x+** / OR-Tools **9.12.x+** | time-window routing / scheduling 핵심 |
| Optimizer Runtime | Python | **3.14.x** | 최신 안정 버전 |
| Optimizer Deps | Pydantic / uvicorn | **2.12.x** / **0.34.x+** | FastAPI 권장 조합 |
| Monorepo | pnpm workspaces + Turborepo | pnpm **10.x** / Turborepo **2.x** | web/mobile/shared package 동시 관리 |
| TypeScript | TypeScript | **5.8.x** | 가장 안정적인 최신 버전 |
| Node.js | Node.js | **22.x LTS** | Next.js 16 권장 |
| Linter | ESLint | **9.x** (flat config) | eslint.config.js 방식 |
| Formatter | Prettier | **3.5.x+** | 코드 포맷 일관성 |
| Test (Unit/통합) | Vitest | **3.x** | 빠른 단위/통합 테스트 |
| Test (E2E) | Playwright | **1.59.x+** | 핵심 사용자 흐름 E2E |
| Shared UI | packages/ui | - | 디자인 토큰/컴포넌트 재사용 |
| Shared Types | packages/types | - | API/DB 도메인 타입 일치 |
| Background Jobs | 초기엔 최소화 | - | 과도한 서버복잡도 방지 |

## 8. 지도/경로/데이터 전략

### 8.1 Routing
- 1차 backend provider: **TMAP**
- 이유:
  - 국내 경로 품질
  - 경유지/경로 최적화 관점에서 유리
  - 자동차 중심 MVP와 잘 맞음

### 8.2 Navigation Handoff
- 1차 handoff: **Naver Map**
- 이유:
  - 사용자가 실제로 많이 쓰는 지도 앱
  - MVP에서 네이티브 내비 직접 구현보다 handoff가 현실적

### 8.3 Places / 운영정보
- 관광지 기본 데이터: TourAPI / 공공데이터
- 식당/카페 운영정보: 수동 검증 + 공식 API + 사용자 수정 제보
- 자동 크롤링은 MVP에서 제외

### 8.4 데이터 품질 전략
- 출시 전 seed dataset 수동 검증
- `data_quality_score` 를 도입해 신뢰도 표기
- 제보 기반 정정 플로우 운영

## 9. 도메인 모델

### 9.1 핵심 엔티티
- User
- Place
- PlaceHours / BreakWindows / Exceptions / VisitProfile
- TripPlan
- TripPlanStop
- TripPlanAlternative
- TripExecution
- TripExecutionStop
- SharedItinerary / SharedImport
- TripSpend / TripSpendItem
- ReceiptScan
- ItineraryGapSuggestion
- NotificationRule / ScheduledAlert

### 9.2 설계 핵심
- 공유는 snapshot
- 실행은 plan 복제본
- 지출/사진은 execution 중심
- AI 기능도 기존 도메인 위에 얹는다 (새 앱이 아님)

## 10. 디자인 방향

### 10.1 제품 톤
- “관광 앱”보다 “여행 운영 도구”
- 지도 + 바텀시트 + 타임라인 + 상태 배지 중심
- 시각적으로 화려하기보다 **실행 가능한 정보 전달** 이 우선

### 10.2 최종 컬러 결정
- Primary: **#2A9D8F**
- Accent: **#641A41**
- Warning Accent: **#E76F51**
- Risk Gold: **#E9C46A**
- Base Text: **#264653**

### 10.3 색 사용 원칙
- Primary는 CTA / 활성 탭 / 경로선 중심
- Plum은 공유/장바구니/선택 강조만 사용
- Coral/Gold는 상태 경고 전용
- 지도 화면은 브랜드 색 사용 면적을 제한한다

## 11. 수익화와 성공 지표

### 11.1 초기 KPI
- plan 생성 수
- optimize 성공률
- 공유 링크 생성률
- 공유 import 전환율
- execution 시작률
- 월간 지출 기록 유지율

### 11.2 중기 KPI
- 계획 대비 실제 실행률
- 재최적화 사용률
- gap suggest 수락률
- OCR 확정률
- 리텐션(주간/월간)

### 11.3 수익화 후보
- 프리미엄 코스 저장/공유 기능
- 제휴 예약/광고
- 지역 큐레이션/제휴 콘텐츠
- B2B/B2G white-label or partnership

## 12. 비기능 요구사항

- 모든 사용자 소유 데이터는 RLS로 보호
- receipt 원본은 기본 장기보관 금지
- active execution은 한 plan당 하나만 허용
- golden scenarios는 언제나 회귀 테스트에 포함
- 고비용 AI 기능은 비동기/검수 UX 전제

## 13. 최종 결정 요약

### 지금 바로 고정하는 결정
- 이름: TripCart
- 로컬 개발 기준: local Supabase first
- MVP 지도 전략: TMAP backend routing + Naver handoff
- 실행 구조: Plan/Execution 분리
- 개발 운영체계: trimmed harness
- gstack: 초기 필수 아님, 선택적 후순위

### UX 정책 (강제 반영)
- `/`는 공개형 랜딩으로 메시지/CTA를 재설계한다.
- 랜딩은 로그인 없이도 가치를 느끼게 하고, 로그인은 진행 상태 보존형으로 유도한다.
- 인증 전/후 화면 분리와 데이터 마이그레이션 흐름은 제품의 기본 동선으로 유지한다.

### 개발 착수 조건
- API v0.2 기준으로 FE/BE 동기화
- canonical schema v0.3 사용
- Design System 기준으로 토큰 고정
- AGENTS.md 읽고 작업 시작
