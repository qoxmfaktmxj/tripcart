import { describe, expect, it } from 'vitest'
import { validateCreatePlanRequest } from './plan-api'

describe('validateCreatePlanRequest', () => {
  it('인증 계정 plan 생성에는 start_at을 요구한다', () => {
    const result = validateCreatePlanRequest({
      title: '부산 당일치기',
      region: 'busan',
      transport_mode: 'car',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('start_at')
    }
  })

  it('timezone이 없는 start_at은 contract 위반으로 막는다', () => {
    const result = validateCreatePlanRequest({
      title: '부산 당일치기',
      region: 'busan',
      transport_mode: 'car',
      start_at: '2026-05-02T09:00:00',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('start_at')
    }
  })

  it('contract shape의 plan 생성 요청을 정규화한다', () => {
    const result = validateCreatePlanRequest({
      title: '  부산 당일치기  ',
      region: 'busan',
      transport_mode: 'car',
      start_at: '2026-05-02T09:00:00+09:00',
      origin_name: null,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toMatchObject({
        title: '부산 당일치기',
        region: 'busan',
        transport_mode: 'car',
        start_at: '2026-05-02T09:00:00+09:00',
      })
      expect(result.value.origin_name).toBeUndefined()
    }
  })
})
