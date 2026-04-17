import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getExecution } from '../app/api/v1/executions/[id]/route'
import { PATCH as patchExecutionStop } from '../app/api/v1/executions/[id]/stops/[stopId]/route'
import { POST as startPlan } from '../app/api/v1/plans/[id]/start/route'
import { createClient } from './supabase/server'

vi.mock('./supabase/server', () => ({
  createClient: vi.fn(),
}))

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER_USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const PLAN_ID = '11111111-1111-4111-8111-111111111111'
const EXECUTION_ID = '22222222-2222-4222-8222-222222222222'
const STOP_ID = '33333333-3333-4333-8333-333333333333'
const PLACE_ID = '44444444-4444-4444-8444-444444444444'
const STARTED_AT = '2026-05-02T09:00:00+09:00'

type QueryOp = {
  table: string
  action: 'select' | 'update'
  filters: Array<[string, unknown]>
  patch?: Record<string, unknown> | undefined
}

type FakeSupabaseOptions = {
  user?: { id: string } | null
  authError?: unknown
  rpcResult?: { data: unknown; error: unknown }
  execution?: Record<string, unknown> | null
  stops?: Array<Record<string, unknown>>
  updateStopResult?: Record<string, unknown> | null
}

class QueryBuilder {
  private action: 'select' | 'update' = 'select'
  private filters: Array<[string, unknown]> = []
  private patch?: Record<string, unknown>

  constructor(
    private readonly client: FakeSupabase,
    private readonly table: string,
  ) {}

  select() {
    this.action = this.patch ? 'update' : 'select'
    return this
  }

  update(patch: Record<string, unknown>) {
    this.action = 'update'
    this.patch = patch
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push([field, value])
    return this
  }

  order() {
    return this
  }

  single() {
    return Promise.resolve(this.client.resolve(this.snapshot(), true))
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.client.resolve(this.snapshot(), false)).then(onfulfilled, onrejected)
  }

  private snapshot(): QueryOp {
    return {
      table: this.table,
      action: this.action,
      filters: this.filters,
      patch: this.patch,
    }
  }
}

class FakeSupabase {
  readonly rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = []
  readonly queryOps: QueryOp[] = []

  readonly auth = {
    getUser: async () => ({
      data: { user: this.options.user ?? { id: USER_ID } },
      error: this.options.authError ?? null,
    }),
  }

  constructor(private readonly options: FakeSupabaseOptions = {}) {}

  rpc(name: string, args: Record<string, unknown>) {
    this.rpcCalls.push({ name, args })
    return Promise.resolve(this.options.rpcResult ?? { data: EXECUTION_ID, error: null })
  }

  from(table: string) {
    return new QueryBuilder(this, table)
  }

  resolve(op: QueryOp, single: boolean) {
    this.queryOps.push(op)

    if (op.table === 'trip_executions') {
      const data = this.options.execution ?? {
        id: EXECUTION_ID,
        plan_id: PLAN_ID,
        user_id: USER_ID,
        status: 'active',
        started_at: STARTED_AT,
        finished_at: null,
        delay_minutes: 10,
        reopt_count: 1,
      }
      if (!data) {
        return { data: null, error: single ? { code: 'PGRST116', message: 'not found' } : null }
      }
      return { data, error: null }
    }

    if (op.table === 'trip_execution_stops' && op.action === 'update') {
      const data =
        this.options.updateStopResult === undefined
          ? {
              id: STOP_ID,
              execution_id: EXECUTION_ID,
              place_id: PLACE_ID,
              stop_order: 1,
              planned_arrive_at: '2026-05-02T09:30:00+09:00',
              planned_leave_at: '2026-05-02T11:00:00+09:00',
              arrive_at: STARTED_AT,
              leave_at: null,
              skipped: false,
              skip_reason: null,
              is_adhoc: false,
              places: { name: 'Gamcheon' },
            }
          : this.options.updateStopResult

      if (!data) {
        return { data: null, error: single ? { code: 'PGRST116', message: 'not found' } : null }
      }
      return { data, error: null }
    }

    if (op.table === 'trip_execution_stops') {
      return {
        data:
          this.options.stops ?? [
            {
              id: STOP_ID,
              execution_id: EXECUTION_ID,
              place_id: PLACE_ID,
              stop_order: 1,
              planned_arrive_at: '2026-05-02T09:30:00+09:00',
              planned_leave_at: '2026-05-02T11:00:00+09:00',
              arrive_at: STARTED_AT,
              leave_at: null,
              skipped: false,
              skip_reason: null,
              is_adhoc: false,
              places: { name: 'Gamcheon' },
            },
          ],
        error: null,
      }
    }

    return { data: null, error: null }
  }
}

function installSupabase(client: FakeSupabase) {
  vi.mocked(createClient).mockResolvedValue(client as never)
  return client
}

describe('execution API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /plans/:id/start starts via RPC and returns started_at from execution lookup', async () => {
    const supabase = installSupabase(new FakeSupabase())

    const response = await startPlan(new Request(`https://tripcart.test/api/v1/plans/${PLAN_ID}/start`, {
      method: 'POST',
    }), {
      params: Promise.resolve({ id: PLAN_ID }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      execution_id: EXECUTION_ID,
      status: 'active',
      started_at: STARTED_AT,
    })
    expect(supabase.rpcCalls).toEqual([
      { name: 'start_trip_execution', args: { p_plan_id: PLAN_ID } },
    ])
  })

  it('POST /plans/:id/start maps PLAN_NOT_CONFIRMED to a contract error', async () => {
    installSupabase(
      new FakeSupabase({
        rpcResult: {
          data: null,
          error: { message: 'PLAN_NOT_CONFIRMED: status is draft' },
        },
      }),
    )

    const response = await startPlan(new Request(`https://tripcart.test/api/v1/plans/${PLAN_ID}/start`, {
      method: 'POST',
    }), {
      params: Promise.resolve({ id: PLAN_ID }),
    })

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      error: { code: 'PLAN_NOT_CONFIRMED' },
    })
  })

  it('GET /executions/:id returns owner-protected detail with stops and next_alert null', async () => {
    installSupabase(new FakeSupabase())

    const response = await getExecution(new Request(`https://tripcart.test/api/v1/executions/${EXECUTION_ID}`), {
      params: Promise.resolve({ id: EXECUTION_ID }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: EXECUTION_ID,
      plan_id: PLAN_ID,
      status: 'active',
      delay_minutes: 10,
      reopt_count: 1,
      stops: [
        {
          id: STOP_ID,
          stop_order: 1,
          place_id: PLACE_ID,
          place_name: 'Gamcheon',
          planned_arrive_at: '2026-05-02T09:30:00+09:00',
          planned_leave_at: '2026-05-02T11:00:00+09:00',
          arrive_at: STARTED_AT,
          leave_at: null,
          skipped: false,
          is_adhoc: false,
        },
      ],
      next_alert: null,
    })
  })

  it('GET /executions/:id maps visible non-owner rows to NOT_OWNER', async () => {
    installSupabase(
      new FakeSupabase({
        execution: {
          id: EXECUTION_ID,
          plan_id: PLAN_ID,
          user_id: OTHER_USER_ID,
          status: 'active',
          started_at: STARTED_AT,
          finished_at: null,
          delay_minutes: 0,
          reopt_count: 0,
        },
      }),
    )

    const response = await getExecution(new Request(`https://tripcart.test/api/v1/executions/${EXECUTION_ID}`), {
      params: Promise.resolve({ id: EXECUTION_ID }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      error: { code: 'NOT_OWNER' },
    })
  })

  it('PATCH /executions/:id/stops/:stopId rejects invalid fields before persistence', async () => {
    installSupabase(new FakeSupabase())

    const response = await patchExecutionStop(
      new Request(`https://tripcart.test/api/v1/executions/${EXECUTION_ID}/stops/${STOP_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ skipped: 'yes' }),
      }),
      { params: Promise.resolve({ id: EXECUTION_ID, stopId: STOP_ID }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: 'INVALID_FIELD', details: { field: 'skipped' } },
    })
  })

  it('PATCH /executions/:id/stops/:stopId updates only the requested execution stop', async () => {
    const supabase = installSupabase(new FakeSupabase())

    const response = await patchExecutionStop(
      new Request(`https://tripcart.test/api/v1/executions/${EXECUTION_ID}/stops/${STOP_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ arrive_at: STARTED_AT }),
      }),
      { params: Promise.resolve({ id: EXECUTION_ID, stopId: STOP_ID }) },
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      data: {
        id: STOP_ID,
        arrive_at: STARTED_AT,
        skipped: false,
      },
    })
    expect(supabase.queryOps).toContainEqual({
      table: 'trip_execution_stops',
      action: 'update',
      filters: [
        ['id', STOP_ID],
        ['execution_id', EXECUTION_ID],
      ],
      patch: { arrive_at: STARTED_AT },
    })
  })
})
