/**
 * TripCart Design Tokens — Canonical Final
 *
 * 사용법 (TypeScript):
 *   import { tripcartColors, tripcartFonts } from '@tripcart/design-tokens'
 *
 * 사용법 (Tailwind CSS v4):
 *   CSS에서 `@import "@tripcart/design-tokens/tokens.css"` 사용
 *   tailwind.config.js 는 필요 없음
 */

export const tripcartColors = {
  // ─── Primary: Sunset Teal ───
  // CTA 버튼, 경로선, 마커, 활성 탭, 타임라인 커넥터
  // 사용 면적: 전체 화면의 10% 이하
  primary: {
    50: '#D5F2EE', // 활성 탭 배경, 필터 칩, 선택 카드
    100: '#A8E0D6', // 토글 ON 배경, 슬라이더 트랙, hover highlight
    300: '#4DBFAD', // 경로선(지도), 타임라인 커넥터, 아이콘 활성
    500: '#2A9D8F', // ★ PRIMARY CTA, 활성 탭 텍스트, 링크, 포커스 링
    700: '#1F7A6F', // CTA pressed/hover, 강조 보더
    900: '#264653', // ★ 기본 텍스트, 제목, 지도 마커 배경, 헤더
  },

  // ─── Plum Accent ───
  // 공유 버튼, 장바구니 배지, 선택 카드 테두리, hover 상태
  // 사용 면적: 전체 화면의 3% 이하
  plum: {
    50: '#F5EFF3', // 공유 버튼 배경, 선택 카드 surface, 프리미엄 배지 배경
    100: '#E5D5DF', // hover 배경, 플럼 칩 비활성
    300: '#D4A5C7', // 선택 카드 border-left, divider accent
    500: '#9B2D6B', // 공유 버튼 아이콘, 플럼 배지 텍스트
    700: '#641A41', // ★ 장바구니 count 배지, 공유 버튼 hover, 선택 강조
    900: '#3D0F28', // plum-50 배경 위 텍스트 (접근성 보장)
  },

  // ─── Coral: Warning Accent ───
  // BT 경고, 마감 임박, 지연 감지
  coral: {
    50: '#FEF2F2', // 경고 배지 배경, 위험 카드 배경
    300: '#F4A261', // 서브 경고, 골드 대체
    500: '#E76F51', // ★ 경고 border, 위험 마커, 타임라인 위험 구간
    700: '#C4563D', // 경고 pressed
    900: '#9A3412', // 경고 배지 텍스트
  },

  // ─── Gold: Risk (BT 임박) ───
  gold: {
    50: '#FEF9E7', // BT risk 배지 배경
    300: '#F0D78C', // risk 보더
    500: '#E9C46A', // risk 마커
    700: '#B8963A', // risk 강조
    900: '#78571E', // BT risk 배지 텍스트
  },

  // ─── Neutral ───
  neutral: {
    0: '#FFFFFF', // 카드, 바텀시트, 입력 필드, 모달
    50: '#F8FAFB', // 페이지 배경, 섹션 구분
    100: '#EEF1F3', // 비활성 탭, 칩, skeleton
    300: '#CBD5E1', // border, 구분선
    500: '#64748B', // 보조 텍스트, placeholder, 캡션
    700: '#374151', // 보조 본문
    900: '#264653', // ★ 기본 텍스트 (primary-900과 동일 = 통일감)
  },

  // ─── Semantic (상태) ───
  success: {
    light: '#F0FDF4',
    DEFAULT: '#16A34A',
    dark: '#166534',
  },
  danger: {
    light: '#FEE2E2',
    DEFAULT: '#DC2626',
    dark: '#991B1B',
  },
  info: {
    light: '#EFF6FF',
    DEFAULT: '#2563EB',
    dark: '#1E40AF',
  },
} as const

export const tripcartFonts = {
  sans: ['Pretendard', 'SUIT', 'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
} as const

// ─── Dark Mode 색상 매핑 ───
export const tripcartDarkColors = {
  background: '#1A1F2E',
  surface: '#242B3A',
  card: '#2D3548',
  textPrimary: '#F0F4F8',
  textMuted: '#94A3B8',
  border: '#3D4A5C',
  primaryCta: '#2A9D8F', // 동일
  primaryBg: '#1A3A35',
  plumAccent: '#D4A5C7', // plum-300으로 밝게
  plumBg: '#2E1F28',
  coralWarning: '#E76F51', // 동일
} as const

export type TripcartColors = typeof tripcartColors
export type TripcartFonts = typeof tripcartFonts
export type TripcartDarkColors = typeof tripcartDarkColors
