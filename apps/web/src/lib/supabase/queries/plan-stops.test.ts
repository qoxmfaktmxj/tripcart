import { describe, expect, it } from 'vitest'
import { addStop, updateStop } from './plan-stops'

type RpcCall = {
  name: string
  args: Record<string, unknown>
}

function createRpcSupabase(response: { data: unknown; error: unknown }) {
  const calls: RpcCall[] = []
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        calls.push({ name, args })
        return response
      },
    },
  }
}

describe('plan stop queries', () => {
  it('stop 추가는 DB RPC에 위임해 order 계산과 draft reset을 원자화한다', async () => {
    const supabase = createRpcSupabase({
      data: {
        id: 'stop-1',
        plan_id: 'plan-1',
        place_id: 'place-1',
        stop_order: 1,
        locked: true,
        locked_position: 1,
        dwell_minutes: 75,
        arrive_at: null,
        leave_at: null,
        travel_from_prev_minutes: null,
        travel_from_prev_meters: null,
        warnings: [],
        user_note: null,
        places: {
          id: 'place-1',
          name: '감천문화마을',
          category: 'attraction',
          lat: 35.0975,
          lng: 129.0107,
          region: 'busan',
          images: [],
        },
      },
      error: null,
    })

    await addStop(
      supabase.client as unknown as Parameters<typeof addStop>[0],
      'plan-1',
      {
        place_id: 'place-1',
        dwell_minutes: 75,
        locked: true,
      },
    )

    expect(supabase.calls).toEqual([
      {
        name: 'add_plan_stop',
        args: {
          p_plan_id: 'plan-1',
          p_place_id: 'place-1',
          p_dwell_minutes: 75,
          p_locked: true,
        },
      },
    ])
  })

  it('add_plan_stop RPC 에러를 상위로 전달한다', async () => {
    const error = new Error('PLAN_IN_PROGRESS')
    const supabase = createRpcSupabase({ data: null, error })

    await expect(
      addStop(
        supabase.client as unknown as Parameters<typeof addStop>[0],
        'plan-1',
        { place_id: 'place-1' },
      ),
    ).rejects.toBe(error)
  })

  it('stop 수정은 DB RPC에 위임해 active execution 검사를 원자화한다', async () => {
    const supabase = createRpcSupabase({
      data: {
        id: 'stop-1',
        plan_id: 'plan-1',
        place_id: 'place-1',
        stop_order: 1,
        locked: true,
        locked_position: 1,
        dwell_minutes: 90,
        arrive_at: null,
        leave_at: null,
        travel_from_prev_minutes: null,
        travel_from_prev_meters: null,
        warnings: [],
        user_note: '점심 고정',
        places: {
          id: 'place-1',
          name: '감천문화마을',
          category: 'attraction',
          lat: 35.0975,
          lng: 129.0107,
          region: 'busan',
          images: [],
        },
      },
      error: null,
    })

    await updateStop(
      supabase.client as unknown as Parameters<typeof updateStop>[0],
      'plan-1',
      'stop-1',
      {
        dwell_minutes: 90,
        locked: true,
        user_note: '점심 고정',
      },
    )

    expect(supabase.calls).toEqual([
      {
        name: 'update_plan_stop',
        args: {
          p_plan_id: 'plan-1',
          p_stop_id: 'stop-1',
          p_patch: {
            dwell_minutes: 90,
            locked: true,
            user_note: '점심 고정',
          },
        },
      },
    ])
  })
})
