import { describe, expect, it } from 'vitest'
import {
  HOME_CATEGORIES,
  buildHomeTripCards,
  normalizePlaceCategoryParam,
} from './home-view'

describe('home-view', () => {
  it('홈 카테고리는 4개만 노출한다', () => {
    expect(HOME_CATEGORIES.map((item) => item.label)).toEqual([
      '카페',
      '맛집',
      '명소',
      '숙소',
    ])
  })

  it('홈 숙소 카테고리 링크는 accommodation 값을 사용한다', () => {
    expect(HOME_CATEGORIES.find((item) => item.label === '숙소')?.href).toBe(
      '/places?category=accommodation',
    )
  })

  it('숙소 카테고리 파라미터를 accommodation으로 정규화한다', () => {
    expect(normalizePlaceCategoryParam('lodging')).toBe('accommodation')
    expect(normalizePlaceCategoryParam('accommodation')).toBe('accommodation')
    expect(normalizePlaceCategoryParam('restaurant')).toBe('restaurant')
    expect(normalizePlaceCategoryParam('unknown')).toBeUndefined()
  })

  it('플랜이 없으면 새 여행 만들기 카드 한 장만 보여준다', () => {
    const cards = buildHomeTripCards([])

    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({
      kind: 'empty',
      title: '새 여행 만들기',
      href: '/plans',
    })
  })

  it('플랜이 하나면 기존 여행 하나와 새 여행 만들기 하나를 보여준다', () => {
    const cards = buildHomeTripCards([
      {
        id: 'plan-1',
        title: '부산 주말 여행',
        start_at: '2024-06-14T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-10T09:00:00.000Z',
      },
    ])

    expect(cards).toHaveLength(2)
    expect(cards[0]).toMatchObject({
      kind: 'plan',
      title: '부산 주말 여행',
      href: '/plans/plan-1',
    })
    expect(cards[0]?.kind).toBe('plan')
    if (cards[0]?.kind === 'plan') {
      expect(cards[0].period).toContain('2024. 6. 14.')
      expect(cards[0].period).toContain('오후 6:00')
    }
    expect(cards[1]).toMatchObject({
      kind: 'empty',
      title: '새 여행 만들기',
    })
  })

  it('플랜이 두 개면 최신순 두 장과 새 여행 만들기 한 장을 보여준다', () => {
    const cards = buildHomeTripCards([
      {
        id: 'plan-1',
        title: '첫 번째 여행',
        start_at: '2024-06-14T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-09T09:00:00.000Z',
      },
      {
        id: 'plan-2',
        title: '두 번째 여행',
        start_at: '2024-06-21T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-10T09:00:00.000Z',
      },
    ])

    expect(cards).toHaveLength(3)
    expect(cards[0]).toMatchObject({
      kind: 'plan',
      title: '두 번째 여행',
    })
    expect(cards[1]).toMatchObject({
      kind: 'plan',
      title: '첫 번째 여행',
    })
    expect(cards[2]).toMatchObject({
      kind: 'empty',
      title: '새 여행 만들기',
    })
  })

  it('플랜이 세 개 이상이면 최신 순 세 장만 보여준다', () => {
    const cards = buildHomeTripCards([
      {
        id: 'plan-1',
        title: '첫 번째 여행',
        start_at: '2024-06-14T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-09T09:00:00.000Z',
      },
      {
        id: 'plan-2',
        title: '두 번째 여행',
        start_at: '2024-06-21T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-10T09:00:00.000Z',
      },
      {
        id: 'plan-3',
        title: '세 번째 여행',
        start_at: '2024-06-28T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-11T09:00:00.000Z',
      },
      {
        id: 'plan-4',
        title: '네 번째 여행',
        start_at: '2024-07-05T09:00:00.000Z',
        transport_mode: 'car',
        updated_at: '2024-06-12T09:00:00.000Z',
      },
    ])

    expect(cards).toHaveLength(3)
    expect(cards.map((card) => card.kind)).toEqual(['plan', 'plan', 'plan'])
    expect(cards.map((card) => card.id)).toEqual(['plan-4', 'plan-3', 'plan-2'])
  })
})
