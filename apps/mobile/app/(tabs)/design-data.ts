import { tripcartColors } from '@tripcart/design-tokens'

export const COLORS = {
  primary50: tripcartColors.primary[50],
  primary100: tripcartColors.primary[100],
  primary300: tripcartColors.primary[300],
  primary500: tripcartColors.primary[500],
  primary700: tripcartColors.primary[700],
  primary900: tripcartColors.primary[900],
  plum50: tripcartColors.plum[50],
  plum100: tripcartColors.plum[100],
  plum700: tripcartColors.plum[700],
  neutral0: tripcartColors.neutral[0],
  neutral50: tripcartColors.neutral[50],
  neutral100: tripcartColors.neutral[100],
  neutral300: tripcartColors.neutral[300],
  neutral500: tripcartColors.neutral[500],
  neutral700: tripcartColors.neutral[700],
  neutral900: tripcartColors.neutral[900],
} as const

export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'

export const PLAN_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80',
] as const

export const PLACE_CARDS = [
  {
    name: '감천문화마을',
    region: '부산 사하구',
    tags: ['관광지', '포토존'],
    image: 'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: '해운대곰장어',
    region: '부산 해운대구 중동',
    tags: ['맛집', '해물'],
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: '광안리해변',
    region: '부산 수영구',
    tags: ['뷰맛집', '야경'],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: '자갈치시장',
    region: '부산 중구',
    tags: ['맛집', '시장'],
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: '해운대해수욕장',
    region: '부산 해운대구',
    tags: ['해변', '산책'],
    image: 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2e?auto=format&fit=crop&w=900&q=80',
  },
] as const

export const FEATURED_PLANS = [
  {
    title: '부산 주말 드라이브',
    date: '2026. 4. 14 - 2026. 4. 16',
    badge: '초안',
    image: PLAN_IMAGES[0],
  },
  {
    title: '설악산 단풍 여행',
    date: '2026. 10. 25 - 2026. 10. 27',
    badge: '예정',
    image: PLAN_IMAGES[1],
  },
  {
    title: '서울 시티 투어',
    date: '2026. 12. 20 - 2026. 12. 22',
    badge: '예정',
    image: PLAN_IMAGES[2],
  },
] as const

export const TIMELINE_ITEMS = [
  { time: '오전 10:00', title: '감천문화마을' },
  { time: '오후 1:30', title: '해운대해수욕장' },
  { time: '오후 3:45', title: '모모스커피 전포' },
  { time: '오후 5:20', title: '모모스커피안' },
] as const
