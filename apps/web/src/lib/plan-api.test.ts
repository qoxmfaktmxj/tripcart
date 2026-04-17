import { describe, expect, it } from 'vitest'
import {
  validateAddStopRequest,
  validateCreatePlanRequest,
  validateUpdatePlanRequest,
} from './plan-api'

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

describe('validateUpdatePlanRequest', () => {
  it('timezone이 없는 start_at 업데이트를 막는다', () => {
    const result = validateUpdatePlanRequest({
      start_at: '2026-05-02T09:00:00',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('start_at')
    }
  })

  it('좌표 범위를 검증한다', () => {
    const result = validateUpdatePlanRequest({
      origin_lat: 91,
      origin_lng: 129,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('origin_lat')
    }
  })

  it('contract shape의 plan 수정 요청을 정규화한다', () => {
    const result = validateUpdatePlanRequest({
      title: '  부산 야경  ',
      start_at: null,
      transport_mode: 'car',
      origin_lat: 35.1152,
      origin_lng: 129.0422,
      origin_name: '  부산역  ',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toMatchObject({
        title: '부산 야경',
        start_at: null,
        transport_mode: 'car',
        origin_lat: 35.1152,
        origin_lng: 129.0422,
        origin_name: '부산역',
      })
    }
  })

  it('origin_name null은 출발지 이름을 비우는 요청으로 유지한다', () => {
    const result = validateUpdatePlanRequest({
      origin_name: null,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.origin_name).toBeNull()
    }
  })
})

describe('validateAddStopRequest', () => {
  it('locked가 boolean이 아니면 막는다', () => {
    const result = validateAddStopRequest({
      place_id: '11111111-1111-4111-8111-111111111111',
      locked: 'yes',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('locked')
    }
  })

  it('dwell_minutes가 하루를 넘으면 막는다', () => {
    const result = validateAddStopRequest({
      place_id: '11111111-1111-4111-8111-111111111111',
      dwell_minutes: 1441,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('dwell_minutes')
    }
  })

  it('contract shape의 stop 추가 요청을 정규화한다', () => {
    const result = validateAddStopRequest({
      place_id: '11111111-1111-4111-8111-111111111111',
      dwell_minutes: 75,
      locked: true,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        place_id: '11111111-1111-4111-8111-111111111111',
        dwell_minutes: 75,
        locked: true,
      })
    }
  })
})
