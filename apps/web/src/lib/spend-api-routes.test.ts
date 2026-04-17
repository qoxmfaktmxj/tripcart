import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as createSpend } from '../app/api/v1/executions/[id]/spends/route'
import { GET as getSpendSummary } from '../app/api/v1/me/spends/summary/route'
import { createClient } from './supabase/server'

vi.mock('./supabase/server', () => ({
  createClient: vi.fn(),
}))

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EXECUTION_ID = '11111111-1111-4111-8111-111111111111'
const STOP_ID = '22222222-2222-4222-8222-222222222222'
const PLACE_ID = '33333333-3333-4333-8333-333333333333'
const SPEND_ID = '44444444-4444-4444-8444-444444444444'

type InsertCall = {
  table: string
  payload: unknown
}

class FakeSpendSupabase {
  readonly inserts: InsertCall[] = []

  readonly auth = {
    getUser: async () => ({
      data: { user: { id: USER_ID } },
      error: null,
    }),
  }

  from(table: string) {
    const inserts = this.inserts
    return {
      select() {
        return this
      },
      insert(payload: unknown) {
        inserts.push({ table, payload })
        return this
      },
      eq() {
        return this
      },
      is() {
        return this
      },
      gte() {
        return this
      },
      lte() {
        return this
      },
      single() {
        if (table === 'trip_executions') {
          return Promise.resolve({ data: { id: EXECUTION_ID, user_id: USER_ID }, error: null })
        }
        if (table === 'trip_execution_stops') {
          return Promise.resolve({
            data: { id: STOP_ID, execution_id: EXECUTION_ID, place_id: PLACE_ID },
            error: null,
          })
        }
        if (table === 'trip_spends') {
          return Promise.resolve({ data: { id: SPEND_ID, amount: 32000 }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      },
      then(resolve: (value: unknown) => unknown) {
        if (table === 'trip_spends') {
          return Promise.resolve({
            data: [
              { amount: 32000, category: 'food', spent_at: '2026-05-02T12:10:00+09:00' },
              { amount: 9000, category: 'cafe', spent_at: '2026-05-03T12:10:00+09:00' },
              { amount: 1000, category: 'food', spent_at: '2026-05-04T12:10:00+09:00' },
            ],
            error: null,
          }).then(resolve)
        }
        return Promise.resolve({ data: [], error: null }).then(resolve)
      },
    }
  }
}

describe('spend API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /executions/:id/spends creates spend and item rows for the owner', async () => {
    const supabase = new FakeSpendSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const response = await createSpend(
      new Request(`https://tripcart.test/api/v1/executions/${EXECUTION_ID}/spends`, {
        method: 'POST',
        body: JSON.stringify({
          stop_id: STOP_ID,
          category: 'food',
          occurred_at: '2026-05-02T12:10:00+09:00',
          total_amount: 32000,
          items: [{ name: '곰장어', qty: 2, unit_price: 11500, line_amount: 23000 }],
        }),
      }),
      { params: Promise.resolve({ id: EXECUTION_ID }) },
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: SPEND_ID, total_amount: 32000 })
    expect(supabase.inserts).toContainEqual({
      table: 'trip_spends',
      payload: {
        execution_id: EXECUTION_ID,
        exec_stop_id: STOP_ID,
        place_id: PLACE_ID,
        user_id: USER_ID,
        amount: 32000,
        category: 'food',
        spent_at: '2026-05-02T12:10:00+09:00',
      },
    })
    expect(supabase.inserts).toContainEqual({
      table: 'trip_spend_items',
      payload: [
        {
          spend_id: SPEND_ID,
          menu_name: '곰장어',
          quantity: 2,
          unit_price: 11500,
        },
      ],
    })
  })

  it('GET /me/spends/summary aggregates by category', async () => {
    vi.mocked(createClient).mockResolvedValue(new FakeSpendSupabase() as never)

    const response = await getSpendSummary(
      new Request('https://tripcart.test/api/v1/me/spends/summary?period=monthly'),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      period: 'monthly',
      total_amount: 42000,
      by_category: {
        food: 33000,
        cafe: 9000,
      },
    })
  })
})
