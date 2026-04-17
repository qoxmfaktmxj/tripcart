import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { POST } from './route'

const USER_ID = '22222222-2222-4222-8222-222222222222'
const PLACE_ID = '11111111-1111-4111-8111-111111111111'
const CORRECTION_ID = '33333333-3333-4333-8333-333333333333'

type QueryResult<T> = Promise<{ data: T; error: null }>

function createSupabaseMock(options: {
  user?: { id: string } | null | undefined
  place?: { id: string } | null
  insertError?: { code?: string; message?: string } | null
}) {
  const maybeSingle = vi.fn(async (): QueryResult<{ id: string } | null> => ({
    data: options.place ?? null,
    error: null,
  }))
  const placeIs = vi.fn(() => ({ maybeSingle }))
  const placeEq = vi.fn(() => ({ is: placeIs }))
  const placeSelect = vi.fn(() => ({ eq: placeEq }))

  const single = vi.fn(async () => {
    if (options.insertError) {
      return { data: null, error: options.insertError }
    }

    return {
      data: { id: CORRECTION_ID, status: 'pending' },
      error: null,
    }
  })
  const correctionSelect = vi.fn(() => ({ single }))
  const correctionInsert = vi.fn(() => ({ select: correctionSelect }))

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options.user ?? null },
        error: options.user === undefined ? { message: 'missing token' } : null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'places') {
        return { select: placeSelect }
      }
      if (table === 'place_data_corrections') {
        return { insert: correctionInsert }
      }
      throw new Error(`unexpected table ${table}`)
    }),
  }

  return {
    supabase,
    placeSelect,
    placeEq,
    placeIs,
    maybeSingle,
    correctionInsert,
    correctionSelect,
    single,
  }
}

async function json(response: Response) {
  return response.json() as Promise<unknown>
}

describe('POST /api/v1/places/:id/corrections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires authentication before writing a correction', async () => {
    const db = createSupabaseMock({ user: undefined })
    mocks.createClient.mockResolvedValue(db.supabase)

    const response = await POST(
      new Request(`https://tripcart.test/api/v1/places/${PLACE_ID}/corrections`, {
        method: 'POST',
        body: JSON.stringify({
          field_name: 'break_start',
          new_value: '15:00',
          reason: 'changed',
        }),
      }),
      { params: Promise.resolve({ id: PLACE_ID }) },
    )

    expect(response.status).toBe(401)
    expect(await json(response)).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
    expect(db.correctionInsert).not.toHaveBeenCalled()
  })

  it('rejects an invalid place id UUID before checking persistence', async () => {
    const db = createSupabaseMock({ user: { id: USER_ID } })
    mocks.createClient.mockResolvedValue(db.supabase)

    const response = await POST(
      new Request('https://tripcart.test/api/v1/places/not-a-uuid/corrections', {
        method: 'POST',
        body: JSON.stringify({
          field_name: 'break_start',
          new_value: '15:00',
          reason: 'changed',
        }),
      }),
      { params: Promise.resolve({ id: 'not-a-uuid' }) },
    )

    expect(response.status).toBe(400)
    expect(await json(response)).toMatchObject({
      error: {
        code: 'INVALID_FIELD',
        details: { field: 'id' },
      },
    })
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('returns PLACE_NOT_FOUND when the target place does not exist', async () => {
    const db = createSupabaseMock({ user: { id: USER_ID }, place: null })
    mocks.createClient.mockResolvedValue(db.supabase)

    const response = await POST(
      new Request(`https://tripcart.test/api/v1/places/${PLACE_ID}/corrections`, {
        method: 'POST',
        body: JSON.stringify({
          field_name: 'break_start',
          new_value: '15:00',
          reason: 'changed',
        }),
      }),
      { params: Promise.resolve({ id: PLACE_ID }) },
    )

    expect(response.status).toBe(404)
    expect(await json(response)).toEqual({
      error: {
        code: 'PLACE_NOT_FOUND',
        message: 'Place not found',
      },
    })
    expect(db.correctionInsert).not.toHaveBeenCalled()
  })

  it('inserts a pending correction for the authenticated user', async () => {
    const db = createSupabaseMock({ user: { id: USER_ID }, place: { id: PLACE_ID } })
    mocks.createClient.mockResolvedValue(db.supabase)

    const response = await POST(
      new Request(`https://tripcart.test/api/v1/places/${PLACE_ID}/corrections`, {
        method: 'POST',
        body: JSON.stringify({
          field_name: ' break_start ',
          old_value: ' 14:30 ',
          new_value: ' 15:00 ',
          reason: ' Saturday hours changed ',
        }),
      }),
      { params: Promise.resolve({ id: PLACE_ID }) },
    )

    expect(response.status).toBe(201)
    expect(await json(response)).toEqual({
      id: CORRECTION_ID,
      status: 'pending',
    })
    expect(db.correctionInsert).toHaveBeenCalledWith({
      user_id: USER_ID,
      place_id: PLACE_ID,
      field_name: 'break_start',
      old_value: '14:30',
      new_value: '15:00',
      reason: 'Saturday hours changed',
    })
  })
})
