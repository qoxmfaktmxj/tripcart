/**
 * TripCart Design Tokens — Canonical Final
 * 
 * 사용법: tailwind.config.ts의 theme.extend에 spread
 * import { tripcartColors, tripcartFonts } from '@tripcart/design-tokens'
 */

export const tripcartColors = {
  // ─── Primary: Sunset Teal ───
  // CTA 버튼, 경로선, 마커, 활성 탭, 타임라인 커넥터
  // 사용 면적: 전체 화면의 10% 이하
  primary: {
    50:  '#D5F2EE', // 활성 탭 배경, 필터 칩, 선택 카드
    100: '#A8E0D6', // 토글 ON 배경, 슬라이더 트랙, hover highlight
    300: '#4DBFAD', // 경로선(지도), 타임라인 커넥터, 아이콘 활성
    500: '#2A9D8F', // ★ PRIMARY CTA, 활성 탭 텍스트, 링크, 포커스 링
    700: '#1F7A6F', // CTA pressed/hover, 강조 보더
    900: '#264653', // ★ 기본 텍스트, 제목, 지도 마커 배경, 헤더
  },

  // ─── Plum Accent ───
  // 공유 버튼, 장바구니 배지, 선택 카드 테두리, hover 상태
  // 사용 면적: 전체 화면의 3% 이하 ("발견하는 즐거움")
  plum: {
    50:  '#F5EFF3', // 공유 버튼 배경, 선택 카드 surface, 프리미엄 배지 배경
    100: '#E5D5DF', // hover 배경, 플럼 칩 비활성
    300: '#D4A5C7', // 선택 카드 border-left, divider accent
    500: '#9B2D6B', // 공유 버튼 아이콘, 플럼 배지 텍스트
    700: '#641A41', // ★ 장바구니 count 배지, 공유 버튼 hover, 선택 강조
    900: '#3D0F28', // plum-50 배경 위 텍스트 (접근성 보장)
  },

  // ─── Coral: Warning Accent ───
  // BT 경고, 마감 임박, 지연 감지. 빨강보다 부드러운 경고
  coral: {
    50:  '#FEF2F2', // 경고 배지 배경, 위험 카드 배경
    300: '#F4A261', // 서브 경고, 골드 대체
    500: '#E76F51', // ★ 경고 border, 위험 마커, 타임라인 위험 구간
    700: '#C4563D', // 경고 pressed
    900: '#9A3412', // 경고 배지 텍스트
  },

  // ─── Gold: Risk (BT 임박) ───
  gold: {
    50:  '#FEF9E7', // BT risk 배지 배경
    300: '#F0D78C', // risk 보더
    500: '#E9C46A', // risk 마커
    700: '#B8963A', // risk 강조
    900: '#78571E', // BT risk 배지 텍스트
  },

  // ─── Neutral ───
  neutral: {
    0:   '#FFFFFF', // 카드, 바텀시트, 입력 필드, 모달
    50:  '#F8FAFB', // 페이지 배경, 섹션 구분
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
} as const;

export const tripcartFonts = {
  sans: ['Pretendard', 'SUIT', 'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
} as const;

// ─── Dark Mode 매핑 ───
export const tripcartDarkColors = {
  background:      '#1A1F2E',
  surface:         '#242B3A',
  card:            '#2D3548',
  textPrimary:     '#F0F4F8',
  textMuted:       '#94A3B8',
  border:          '#3D4A5C',
  primaryCta:      '#2A9D8F', // 동일
  primaryBg:       '#1A3A35',
  plumAccent:      '#D4A5C7', // plum-300으로 밝게
  plumBg:          '#2E1F28',
  coralWarning:    '#E76F51', // 동일
} as const;

// ─── CSS Custom Properties (선택적 사용) ───
export const tripcartCSSVars = `
:root {
  /* Primary */
  --color-primary-50: #D5F2EE;
  --color-primary-100: #A8E0D6;
  --color-primary-300: #4DBFAD;
  --color-primary-500: #2A9D8F;
  --color-primary-700: #1F7A6F;
  --color-primary-900: #264653;

  /* Plum */
  --color-plum-50: #F5EFF3;
  --color-plum-100: #E5D5DF;
  --color-plum-300: #D4A5C7;
  --color-plum-500: #9B2D6B;
  --color-plum-700: #641A41;
  --color-plum-900: #3D0F28;

  /* Coral */
  --color-coral-50: #FEF2F2;
  --color-coral-500: #E76F51;
  --color-coral-900: #9A3412;

  /* Gold */
  --color-gold-50: #FEF9E7;
  --color-gold-500: #E9C46A;
  --color-gold-900: #78571E;

  /* Neutral */
  --color-surface: #F8FAFB;
  --color-border: #CBD5E1;
  --color-text: #264653;
  --color-text-muted: #64748B;

  /* Semantic */
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-danger: #DC2626;
  --color-danger-bg: #FEE2E2;
  --color-info: #2563EB;
  --color-info-bg: #EFF6FF;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #242B3A;
    --color-border: #3D4A5C;
    --color-text: #F0F4F8;
    --color-text-muted: #94A3B8;
    --color-plum-700: #D4A5C7;
    --color-plum-50: #2E1F28;
  }
}
`;
