# TripCart Design System v1.0 FINAL
업데이트: 2026-03-24  
상태: **Canonical**

## 1. 디자인 방향

TripCart는 “관광 앱”보다 “여행 운영 도구”로 보이게 설계한다.  
사진 피드형 홈보다 **지도 + 바텀시트 + 타임라인 + 상태 배지** 구조가 기본이다.

### 톤
- 믿을 수 있는
- 또렷한
- 과장되지 않은
- 실제 실행에 도움이 되는

## 2. 최종 컬러 시스템

## 2.1 Brand / Utility Palette

| Token | Hex | 역할 |
|---|---:|---|
| primary-50 | `#D5F2EE` | 선택 배경, 필터 칩, 약한 active 배경 |
| primary-100 | `#A8E0D6` | 토글 ON 배경, hover highlight |
| primary-300 | `#4DBFAD` | 경로선, 타임라인 커넥터, active icon |
| primary-500 | `#2A9D8F` | **기본 CTA / 활성 탭 / 링크** |
| primary-700 | `#1F7A6F` | pressed / strong border |
| primary-900 | `#264653` | 기본 제목/텍스트/지도 마커 베이스 |
| plum-50 | `#F5EFF3` | 공유/선택 surface |
| plum-100 | `#E5D5DF` | plum hover background |
| plum-300 | `#D4A5C7` | 선택 강조 border |
| plum-500 | `#9B2D6B` | 공유 아이콘, accent text |
| plum-700 | `#641A41` | **장바구니 count / 공유 강조** |
| coral-500 | `#E76F51` | **브레이크타임/마감 경고** |
| gold-500 | `#E9C46A` | risk / 주의 배지 |
| neutral-0 | `#FFFFFF` | card, modal, input |
| neutral-50 | `#F8FAFB` | page background |
| neutral-100 | `#EEF1F3` | muted surface |
| neutral-300 | `#CBD5E1` | divider / border |
| neutral-500 | `#64748B` | 보조 텍스트 |
| neutral-900 | `#264653` | 본문/제목 |

## 2.2 사용 비율 규칙
- Primary: 화면 전체의 10% 이하
- Plum: 화면 전체의 3% 이하
- Coral / Gold: 상태 표현 전용
- 지도 화면에서는 브랜드 색을 최소한으로만 사용

## 2.3 Semantic
- success: `#16A34A`
- danger: `#DC2626`
- info: `#2563EB`

> 상태는 항상 **색 + 텍스트** 로 같이 표현한다. 색만으로 구분하지 않는다.

## 3. 타이포그래피

### 3.1 기본 폰트
- sans: `Pretendard / SUIT / system-ui`
- mono: `JetBrains Mono / SF Mono / Menlo`

### 3.2 타입 스케일 (mobile first)

| Role | Size | Weight | 용도 |
|---|---:|---:|---|
| hero-title | 28 | 700 | 핵심 화면 타이틀 |
| h1 | 24 | 700 | 주요 제목 |
| h2 | 20 | 700 | 섹션 제목 |
| h3 | 18 | 600 | 카드/시트 제목 |
| body-lg | 16 | 600 | 장소명, 버튼 라벨 |
| body | 15 | 400 | 본문 |
| body-sm | 14 | 400 | 보조 본문 |
| caption | 13 | 500 | 배지, 메타 |
| number-md | 16 | 600 mono | 시간/거리/금액 |
| number-lg | 20 | 700 mono | 핵심 수치 |

## 4. 레이아웃 토큰

### 4.1 Spacing (4px base)
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`

### 4.2 Radius
- xs: 6
- sm: 8
- md: 12
- lg: 16
- xl: 20
- full: 999

### 4.3 Shadow
- shadow-sm: card base
- shadow-md: bottom sheet / modal
- 지도 화면에서는 shadow 사용을 과하지 않게 유지

## 5. 핵심 레이아웃 패턴

## 5.1 Map + Bottom Sheet
- 기본 구조: full-screen map + bottom sheet
- Sheet snap: `peek / half / full`
- Peek 높이: 헤더 + 첫 카드가 보일 정도
- Half: 비교/리스트 조작
- Full: 상세 검토 / 수정

## 5.2 Timeline
- 좌측: 시간 컬럼 (mono)
- 중앙: 장소명 + 카테고리 + 상태 배지
- 하단: 체류시간 + 이동정보
- 카드 사이: 커넥터 + 이동시간

## 5.3 Status-first UI
- “지금 갈 수 있는지 / 곧 닫는지 / BT에 걸리는지”가 항상 눈에 먼저 들어와야 한다

## 6. 컴포넌트 스펙

## 6.1 Primary CTA Button
- background: primary-500
- text: white
- hover/pressed: primary-700
- disabled: neutral-300 / neutral-500
- plum 계열을 primary CTA 배경으로 쓰지 않는다

## 6.2 Secondary Button
- outline: neutral-300
- text: neutral-900
- hover bg: neutral-50

## 6.3 Share Button
- background: plum-50
- text/icon: plum-700
- hover: plum-100
- primary 행동을 넘어서지 않게 보조 강조로 유지

## 6.4 Status Badge
- padding: `4 x 8`
- radius: sm
- font: caption
- 예시:
  - 영업중 -> success.light / success.dark
  - BT 위험 -> gold-50 / gold-900
  - 마감 임박 -> coral-50 / coral-900
  - 잠금 순서 -> plum-50 / plum-700

## 6.5 Timeline Card
- 시간 컬럼은 mono
- 장소명은 body-lg 600
- 경고 상태면 왼쪽 3px border(coral or gold)
- locked stop은 plum 보더 + lock icon
- adhoc stop 은 subtle info badge

## 6.6 Bottom Sheet
- 상단 grip
- 헤더: title + summary badge
- list/card 간격 12~16
- full 상태에서는 검색/필터/정렬 컨트롤 표시 가능

## 6.7 Gap Suggest Card
- label: “이 구간에 끼워 넣기 좋은 장소”
- 반드시 아래 4요소 포함
  - 제안 이유
  - 예상 체류시간
  - 우회/이동 추가시간
  - 제약 충족 상태(open/break/travel)
- CTA: `추가 후 재정렬`

## 6.8 Receipt Review Card
- 원본 이미지 썸네일
- merchant / date / total amount
- 항목별 confidence 표시
- 낮은 confidence 는 coral/light border
- 저장 전 수정 가능한 form

## 6.9 Smart Alert Banner
- leave_now: primary-50 / primary-900
- break_time_risk: gold-50 / gold-900
- closing_soon: coral-50 / coral-900
- CTA: `지금 출발`, `다른 안 보기`, `재정렬`

## 7. 화면 스펙

## 7.1 Home / Search
- 상단 지역 선택
- 검색바
- 카테고리 필터
- 추천보다 저장 진입이 우선
- place card 는 장바구니 담기 action 강조

## 7.2 Cart / Draft Plan
- 저장한 장소 목록
- plan group title
- stop 잠금, 삭제, reorder
- 출발지 / 시작시각 입력
- optimize CTA 는 primary

## 7.3 Optimization Result
- map + bottom sheet
- alternatives selector
- warning summary
- timeline cards
- `이 안으로 확정` CTA

## 7.4 Shared Preview
- 공개 링크에서 web first
- 일정 요약
- 지역 / 총 시간 / 총 stop
- `내 일정에 추가`

## 7.5 Execution Screen
- 지금 stop / 다음 stop
- leave_now 안내
- skip / visit complete
- spend quick add
- reroute CTA

## 7.6 Spend / Receipt
- quick add from stop
- receipt scan entry
- confirm save
- monthly summary card

## 7.7 Stats
- 이번 주 / 이번 달
- category breakdown
- visit count
- most visited region/place

## 8. 접근성 규칙

- 색만으로 상태 구분 금지
- text contrast 최소 WCAG AA 목표
- touch target 44x44 이상
- map overlay 위 텍스트는 충분한 배경 대비 제공
- 모든 경고 배지는 아이콘 또는 텍스트 동반
- 숫자 정보는 mono + 충분한 크기

## 9. 구현 규칙

- 모든 화면은 `packages/design-tokens` (`@tripcart/design-tokens`) 기준으로 구현
- token 없는 임의 hex 사용 금지
- primary CTA 색상은 항상 `primary-500`
- 공유 관련 강조는 plum 계열만 허용
- warning/risk 는 coral/gold만 사용
- semantic 색상은 상태 전용

## 11. Tailwind CSS v4 적용 방식

> **확정 버전: Tailwind CSS 4.1.x**

### v4 핵심 변경사항
- `tailwind.config.js` / `tailwind.config.ts` **없음**
- 토큰은 `globals.css`의 `@theme` 블록에서 CSS 변수로 정의
- `@import "tailwindcss"` 한 줄로 전체 기능 로드

### `packages/design-tokens` 구조
```
packages/design-tokens/
  src/
    index.ts          ← 전체 export (TypeScript 사용 시)
    tokens.css        ← @theme 블록 CSS (Tailwind v4 직접 import용)
  package.json        ← name: "@tripcart/design-tokens"
```

### `apps/web/src/app/globals.css` 예시
```css
@import "tailwindcss";
@import "@tripcart/design-tokens/tokens.css";
```

### `packages/design-tokens/src/tokens.css` 예시
```css
@theme {
  --color-primary-50: #D5F2EE;
  --color-primary-100: #A8E0D6;
  --color-primary-300: #4DBFAD;
  --color-primary-500: #2A9D8F;
  --color-primary-700: #1F7A6F;
  --color-primary-900: #264653;
  --color-plum-500: #9B2D6B;
  --color-plum-700: #641A41;
  --color-coral-500: #E76F51;
  --color-gold-500: #E9C46A;
  --color-neutral-0: #FFFFFF;
  --color-neutral-50: #F8FAFB;
  --color-neutral-100: #EEF1F3;
  --color-neutral-300: #CBD5E1;
  --color-neutral-500: #64748B;
  --color-neutral-900: #264653;
  /* 폰트 */
  --font-sans: 'Pretendard', 'SUIT', 'Apple SD Gothic Neo', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
}
```

### TypeScript import (비-CSS 사용처)
```ts
import { tripcartColors, tripcartFonts } from '@tripcart/design-tokens'
```

## 10. 디자이너/개발자 handoff 규칙

- 디자인 툴 시안보다 이 문서와 토큰 파일이 우선
- Stitch / Pencil 시안 생성 시 이 문서를 prompt source로 사용
- 구현 후 시안이 바뀌면 문서와 토큰부터 갱신
