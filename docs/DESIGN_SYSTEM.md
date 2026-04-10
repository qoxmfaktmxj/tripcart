# TripCart Design System v1.1
업데이트: 2026-04-09
상태: **Canonical (visual refresh in progress)**

## 1. 디자인 방향

TripCart는 공개 랜딩에서는 `여행 장소를 담아 일정으로 만드는 서비스`로 보이고,
로그인 이후 운영면에서는 `실제 실행 가능한 여행 운영 도구`로 보이게 설계한다.

즉, 시각 방향을 두 층으로 나눈다.

- 공개면: 앱스토어형 랜딩, 감성 사진, 큰 탐색 입력, 카드형 탐색 유도
- 운영면: 지도, 타임라인, 상태 배지, 일정 카드 중심의 실행 UI

### 톤
- 믿을 수 있는
- 또렷한
- 과장되지 않은
- 실제 실행에 도움이 되는
- 따뜻한 해안과 도시 여행 감성
- 깔끔한 편집형 카드 레이아웃

### 1.1 2026-04 리프레시 결정

- `/`는 개발 링크 허브가 아니라 공개 랜딩이다.
- 랜딩은 부산 해안, 도시 야경, 산/관광지 사진을 활용한 앱스토어형 편집 UI로 간다.
- `/places`는 탐색형 split view를 유지하되, 좌측 카드와 우측 지도 표현을 더 정리된 편집 화면처럼 보이게 한다.
- `/plans`와 `/plans/[id]`는 운영 화면이지만, 카드 비율과 색면은 공개 랜딩과 같은 계열로 맞춘다.
- 기존 브랜드 민트/청록 계열은 유지하되, 화면 전체는 더 밝고 부드러운 배경 wash를 사용한다.

### 1.2 공개면과 운영면의 차이

- 공개면에서는 사진, 넓은 여백, 유리 질감 입력창, 큰 CTA를 허용한다.
- 운영면에서는 데이터 밀도와 시인성을 우선한다.
- 공개면의 감성은 유지하되, 운영면에서는 장식보다 정보 우선 구조를 지킨다.

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
- 공개 랜딩의 hero 사진 위에는 유리 질감(frosted) 레이어와 밝은 haze를 허용한다

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
- label: `이 구간에 끼워 넣기 좋은 장소`
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

## 7.1 Home / Landing (public)
- `/`는 앱스토어형 랜딩으로 설계한다.
- 상단 hero에 제품 가치와 전환 동선을 먼저 제시한다.
- 주요 요소: 가치 메시지, 큰 검색 입력, 카테고리 바, 대표 카드 3장, CTA (`바로 담아보기`, `플랜 보기`)
- 메인 카피: `여행 장소를 장바구니에 담고, 실행 가능한 일정으로 정리하세요.`
- 보조 카피: `로그인 없이 먼저 담아보고, 원하면 계정으로 이어서 관리할 수 있습니다.`
- 로그인 유도는 기능 보존 보장(게스트 데이터 이관 보장) 언어로 구성한다.
- CTA 이후 진입 시 저장/플랜은 인증 전환 유도 또는 게스트 임시 상태와 연동되는 안내 배너를 보여준다.
- hero 우측 상단에는 `담은 여행지` 진입 버튼을 두고, 현재 담은 개수를 작게 보여준다.
- hero 이미지는 `도시 해변 + 석양` 또는 `여행 감성 해안` 계열을 우선한다.
- 검색 입력은 폭이 넓고, pill radius와 frosted background를 사용한다.
- 카테고리 바는 굵은 아이콘 + 짧은 라벨 조합으로 정리한다.
- 카테고리 아이콘은 모두 동일한 optical box(24x24 기준)와 유사한 시각 무게를 유지한다.
- 홈 카테고리 바는 `카페 / 맛집 / 명소 / 숙소` 4개만 유지한다.
- 홈 카테고리 아이콘은 단순 선형 스타일을 쓰되, `카페`, `맛집`, `명소`, `숙소` 의미가 즉시 읽혀야 한다.
- 각 카테고리 클릭은 실제 `/places?category=...` 필터 화면으로 이어져야 한다.
- 홈 본문은 `내 여행 3개`와 `인기 여행지 3개`의 2단 구조를 기본으로 한다.
- 모바일에서는 카테고리 바를 한 줄 수평 스크롤로 유지한다.
- 모바일 카드 영역은 미니 3열 그리드 대신 가로 스와이프 rail을 우선한다.
- 대표 카드는 제목, 날짜, 상태 배지를 한 장면 안에서 바로 읽을 수 있어야 한다.

## 7.2 Browse / Search
- 상단 제목 + 검색바 + 필터 row
- 좌측은 장소 카드 리스트, 우측은 지도 또는 지도풍 summary panel
- 추천보다 `저장`과 `플랜에 추가` 진입이 우선
- place card 는 작은 썸네일 + 큰 제목 + 짧은 메타 + 주요 CTA 조합
- 비로그인 상태에서는 guest 저장 안내를 부드러운 notice banner로 노출한다.
- 우측 패널은 완전한 GIS 표현보다도, 보기 쉬운 정적 지도풍 summary라도 허용한다.

## 7.3 Cart / Draft Plan
- 저장한 장소 목록
- plan group title
- stop 잠금, 삭제, reorder
- 출발지 / 시작시각 입력
- optimize CTA 는 primary

## 7.4 Plans Dashboard
- 첫 줄은 `3개의 대표 플랜 카드 + 1개의 생성 카드`를 기본 패턴으로 한다.
- 카드 높이와 radius는 랜딩의 대표 카드와 같은 계열로 맞춘다.
- 카드 텍스트는 3줄 이내에서 읽혀야 하며, 긴 실제 데이터는 그대로 흘려보내지 않는다.
- 상태 배지(`초안`, `예정`)는 우측 상단 작은 pill로 고정한다.
- 생성 카드는 단색 배경 + 큰 `+` 아이콘 + 짧은 문구 조합으로 유지한다.

## 7.5 Plan Detail
- 기본 구조는 `좌측 타임라인 / 중앙 대표 카드 / 우측 경로 요약` 3단 레이아웃이다.
- 좌측은 시간, 아이콘, stop 이름이 수직 리듬을 가지도록 정렬한다.
- 중앙은 대표 이미지, 제목, 날짜, 설명, 주 행동 버튼 2~3개를 포함한다.
- 우측은 경로 요약, 정적 지도풍 미리보기, 상태/지역/이동수단 메타를 묶는다.
- 공개 랜딩보다 정보 밀도가 높아도 되지만, 카드별 역할은 명확해야 한다.

## 7.6 Optimization Result
- map + bottom sheet
- alternatives selector
- warning summary
- timeline cards
- `이 안으로 확정` CTA

## 7.7 Shared Preview
- 공개 링크에서 web first
- 일정 요약
- 지역 / 총 시간 / 총 stop
- `내 일정에 추가`

## 7.8 Execution Screen
- 지금 stop / 다음 stop
- leave_now 안내
- skip / visit complete
- spend quick add
- reroute CTA

## 7.9 Spend / Receipt
- quick add from stop
- receipt scan entry
- confirm save
- monthly summary card

## 7.10 Stats
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

## 10. 디자이너/개발자 handoff 규칙

- 디자인 툴 시안보다 이 문서와 토큰 파일이 우선이다.
- Stitch / Pencil 시안 생성 시 이 문서를 prompt source로 사용한다.
- 구현 후 시안이 바뀌면 문서와 토큰부터 갱신한다.

## 11. 2026-04 시각 정렬 기준

### 11.1 바로 채택 가능한 방향
- 홈 랜딩은 앱스토어형 hero + 카테고리 strip + 대표 카드 레이아웃을 기본으로 유지한다.
- 장소 둘러보기는 split view와 민트/청록 CTA 방향을 유지한다.

### 11.2 아직 한 번 더 보완이 필요한 부분
- 플랜 대시보드는 카드 제목 길이, 날짜 줄바꿈, 카드 간격을 더 정리해야 한다.
- 플랜 상세는 중앙 설명 영역과 우측 경로 카드의 밀도를 더 높여야 한다.
- 지도풍 패널은 실제 지도처럼 보이되 과도하게 복잡하지 않게 정리해야 한다.

### 11.3 금지
- 공개 랜딩을 다시 개발자용 링크 허브로 되돌리지 않는다.
- 운영 화면에서 사진 장식을 정보보다 앞세우지 않는다.
- 브랜드 청록 계열을 버리고 전혀 다른 색 체계로 바꾸지 않는다.

## 12. Tailwind CSS v4 적용 방식

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
