import { describe, expect, it } from 'vitest'

import { validatePlaceCorrectionRequest } from './place-corrections-api'

describe('validatePlaceCorrectionRequest', () => {
  it('trims and accepts a valid place correction request', () => {
    const result = validatePlaceCorrectionRequest({
      field_name: ' break_start ',
      old_value: ' 14:30 ',
      new_value: ' 15:00 ',
      reason: ' Saturday hours changed ',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        field_name: 'break_start',
        old_value: '14:30',
        new_value: '15:00',
        reason: 'Saturday hours changed',
      })
    }
  })

  it.each([
    ['field_name', { field_name: '', new_value: '15:00', reason: 'changed' }],
    ['new_value', { field_name: 'break_start', new_value: '', reason: 'changed' }],
    ['reason', { field_name: 'break_start', new_value: '15:00', reason: '' }],
  ])('rejects missing or empty %s', (field, body) => {
    const result = validatePlaceCorrectionRequest(body)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: 'INVALID_FIELD',
        details: { field },
      })
    }
  })

  it('rejects unsafe field names', () => {
    const result = validatePlaceCorrectionRequest({
      field_name: 'break-start',
      new_value: '15:00',
      reason: 'changed',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.details?.field).toBe('field_name')
    }
  })
})
