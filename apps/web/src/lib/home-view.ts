import type { TravelMode } from '@tripcart/types'

export type HomeCategoryItem = {
  label: '카페' | '맛집' | '명소' | '숙소'
  href: string
  icon: 'cafe' | 'food' | 'landmark' | 'lodging'
}

export type HomeTripSource = {
  id: string
  title: string
  start_at: string | null
  transport_mode: TravelMode
  created_at?: string | null
  updated_at?: string | null
}

export type HomeTripCard =
  | {
      kind: 'plan'
      id: string
      title: string
      period: string
      href: string
      image: string
      statusLabel: string
    }
  | {
      kind: 'empty'
      id: string
      title: string
      href: '/plans'
    }

export const HOME_CATEGORIES: HomeCategoryItem[] = [
  { label: '카페', href: '/places?category=cafe', icon: 'cafe' },
  { label: '맛집', href: '/places?category=restaurant', icon: 'food' },
  { label: '명소', href: '/places?category=attraction', icon: 'landmark' },
  { label: '숙소', href: '/places?category=accommodation', icon: 'lodging' },
]

export const POPULAR_DESTINATIONS = [
  {
    id: 'popular-gamcheon',
    title: '감천문화마을',
    region: '부산',
    categoryLabel: '명소',
    href: '/places?q=%EA%B0%90%EC%B2%9C%EB%AC%B8%ED%99%94%EB%A7%88%EC%9D%84',
    image:
      'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'popular-haeundae',
    title: '해운대해수욕장',
    region: '부산',
    categoryLabel: '명소',
    href: '/places?q=%ED%95%B4%EC%9A%B4%EB%8C%80',
    image:
      'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'popular-momos',
    title: '모모스커피',
    region: '부산',
    categoryLabel: '카페',
    href: '/places?q=%EB%AA%A8%EB%AA%A8%EC%8A%A4%EC%BB%A4%ED%94%BC',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80',
  },
] as const

const HOME_PLAN_IMAGES = [
  'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1538485399081-7c89798d8b0c?auto=format&fit=crop&w=1600&q=80',
] as const

function formatPlanDateTime(value: string | null): string {
  if (!value) return '출발일 미정'

  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return value

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return formatter.format(start)
}

function getSortTime(item: HomeTripSource): number {
  const candidate = item.updated_at ?? item.created_at ?? item.start_at
  if (!candidate) return 0
  const parsed = new Date(candidate).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function normalizePlaceCategoryParam(value: string | null | undefined):
  | 'restaurant'
  | 'cafe'
  | 'attraction'
  | 'accommodation'
  | undefined {
  if (!value) return undefined
  if (value === 'lodging') return 'accommodation'
  if (
    value === 'restaurant' ||
    value === 'cafe' ||
    value === 'attraction' ||
    value === 'accommodation'
  ) {
    return value
  }
  return undefined
}

export function buildHomeTripCards(items: HomeTripSource[]): HomeTripCard[] {
  const plans: HomeTripCard[] = [...items]
    .sort((a, b) => getSortTime(b) - getSortTime(a))
    .slice(0, 3)
    .map((item, index) => ({
      kind: 'plan' as const,
      id: item.id,
      title: item.title,
      period: formatPlanDateTime(item.start_at),
      href: item.id.startsWith('guest_') ? '/plans' : `/plans/${item.id}`,
      image: HOME_PLAN_IMAGES[index % HOME_PLAN_IMAGES.length] ?? HOME_PLAN_IMAGES[0]!,
      statusLabel: item.id.startsWith('guest_') ? '브라우저 초안' : '예정',
    }))

  if (plans.length === 0) {
    return [
      {
        kind: 'empty',
        id: 'empty-1',
        title: '새 여행 만들기',
        href: '/plans',
      },
    ]
  }

  if (plans.length < 3) {
    return [
      ...plans,
      {
        kind: 'empty',
        id: `empty-${plans.length + 1}`,
        title: '새 여행 만들기',
        href: '/plans',
      },
    ]
  }

  return plans
}
