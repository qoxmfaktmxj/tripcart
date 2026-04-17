import { describe, expect, it } from 'vitest'
import { validateCreateSpendRequest, validateSpendSummaryParams } from './spend-api'

describe('validateCreateSpendRequest', () => {
  it('contract request를 DB insert용 값으로 정규화한다', () => {
    const result = validateCreateSpendRequest({
      stop_id: '11111111-1111-4111-8111-111111111111',
      category: 'food',
      occurred_at: '2026-05-02T12:10:00+09:00',
      total_amount: 32000,
      items: [
        { name: ' 곰장어 ', qty: 2, unit_price: 11500, line_amount: 23000 },
        { name: '볶음밥', qty: 1, unit_price: 9000, line_amount: 9000 },
      ],
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        stop_id: '11111111-1111-4111-8111-111111111111',
        category: 'food',
        occurred_at: '2026-05-02T12:10:00+09:00',
        total_amount: 32000,
        items: [
          { name: '곰장어', qty: 2, unit_price: 11500, line_amount: 23000 },
          { name: '볶음밥', qty: 1, unit_price: 9000, line_amount: 9000 },
        ],
      })
    }
  })

  it.each([
    ['stop_id', { stop_id: 'bad', category: 'food', occurred_at: '2026-05-02T12:10:00+09:00', total_amount: 1, items: [] }],
    ['category', { stop_id: '11111111-1111-4111-8111-111111111111', category: 'bad', occurred_at: '2026-05-02T12:10:00+09:00', total_amount: 1, items: [] }],
    ['occurred_at', { stop_id: '11111111-1111-4111-8111-111111111111', category: 'food', occurred_at: '2026-05-02T12:10:00', total_amount: 1, items: [] }],
    ['total_amount', { stop_id: '11111111-1111-4111-8111-111111111111', category: 'food', occurred_at: '2026-05-02T12:10:00+09:00', total_amount: 0, items: [] }],
    ['items[0].name', { stop_id: '11111111-1111-4111-8111-111111111111', category: 'food', occurred_at: '2026-05-02T12:10:00+09:00', total_amount: 1, items: [{ name: '', qty: 1, unit_price: 1, line_amount: 1 }] }],
  ])('invalid %s를 INVALID_FIELD로 거절한다', (field, body) => {
    const result = validateCreateSpendRequest(body)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe(field)
    }
  })

  it('item line_amount와 total_amount 불일치를 거절한다', () => {
    const result = validateCreateSpendRequest({
      stop_id: '11111111-1111-4111-8111-111111111111',
      category: 'food',
      occurred_at: '2026-05-02T12:10:00+09:00',
      total_amount: 32000,
      items: [
        { name: '곰장어', qty: 2, unit_price: 11500, line_amount: 22000 },
        { name: '볶음밥', qty: 1, unit_price: 9000, line_amount: 9000 },
      ],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('items[0].line_amount')
    }
  })
})

describe('validateSpendSummaryParams', () => {
  it('period/from/to query를 정규화한다', () => {
    const params = new URLSearchParams({
      period: 'monthly',
      from: '2026-05-01T00:00:00+09:00',
      to: '2026-05-31T23:59:59+09:00',
    })

    expect(validateSpendSummaryParams(params)).toEqual({
      ok: true,
      value: {
        period: 'monthly',
        from: '2026-05-01T00:00:00+09:00',
        to: '2026-05-31T23:59:59+09:00',
      },
    })
  })

  it('지원하지 않는 period를 거절한다', () => {
    const result = validateSpendSummaryParams(new URLSearchParams({ period: 'daily' }))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('period')
    }
  })

  it('from이 to 이후면 거절한다', () => {
    const result = validateSpendSummaryParams(
      new URLSearchParams({
        from: '2026-05-31T00:00:00+09:00',
        to: '2026-05-01T00:00:00+09:00',
      }),
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('from')
    }
  })
})
