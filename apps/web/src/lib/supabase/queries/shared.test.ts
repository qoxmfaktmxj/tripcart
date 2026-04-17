import { describe, expect, it, vi } from 'vitest'

import {
  createSharedItinerary,
  getSharedItineraryPreview,
  importSharedItinerary,
} from './shared'

type Call = {
  table?: string
  method: string
  args: unknown[]
}

function createShareSupabase() {
  const calls: Call[] = []
  const plan = {
    id: 'plan-1',
    user_id: 'user-1',
    title: 'Original title',
    start_at: '2026-06-14T09:00:00+09:00',
    region: 'busan',
    transport_mode: 'car',
    version: 3,
    optimization_meta: { total_travel_minutes: 45 },
  }
  const stops = [
    {
      id: 'stop-1',
      place_id: 'place-1',
      stop_order: 1,
      dwell_minutes: 90,
      arrive_at: '2026-06-14T09:00:00+09:00',
      travel_from_prev_minutes: null,
    },
    {
      id: 'stop-2',
      place_id: 'place-2',
      stop_order: 2,
      dwell_minutes: 60,
      arrive_at: '2026-06-14T11:30:00+09:00',
      travel_from_prev_minutes: 30,
    },
  ]
  const inserted = {
    id: 'shared-1',
    share_code: 'abcdef123456',
    expires_at: null,
  }

  function builder(table: string) {
    return {
      select(...args: unknown[]) {
        calls.push({ table, method: 'select', args })
        return this
      },
      insert(...args: unknown[]) {
        calls.push({ table, method: 'insert', args })
        return this
      },
      eq(...args: unknown[]) {
        calls.push({ table, method: 'eq', args })
        return this
      },
      is(...args: unknown[]) {
        calls.push({ table, method: 'is', args })
        return this
      },
      order(...args: unknown[]) {
        calls.push({ table, method: 'order', args })
        return this
      },
      single() {
        calls.push({ table, method: 'single', args: [] })
        if (table === 'trip_plans') return Promise.resolve({ data: plan, error: null })
        if (table === 'shared_itineraries') {
          return Promise.resolve({ data: inserted, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      },
      then(resolve: (value: unknown) => unknown) {
        if (table === 'trip_plan_stops') {
          return Promise.resolve({ data: stops, error: null }).then(resolve)
        }
        return Promise.resolve({ data: [], error: null }).then(resolve)
      },
    }
  }

  return {
    calls,
    client: {
      from(table: string) {
        return builder(table)
      },
    },
  }
}

describe('shared itinerary queries', () => {
  it('creates a shared_itineraries row from plan and stop snapshot', async () => {
    const supabase = createShareSupabase()

    const result = await createSharedItinerary(
      supabase.client as unknown as Parameters<typeof createSharedItinerary>[0],
      'plan-1',
      'user-1',
      {
        visibility: 'link_only',
        title: 'Shared title',
        description: 'Saturday',
      },
    )

    expect(result).toEqual({
      shared_id: 'shared-1',
      share_code: 'abcdef123456',
      expires_at: null,
    })

    const insert = supabase.calls.find(
      (call) => call.table === 'shared_itineraries' && call.method === 'insert',
    )
    expect(insert?.args[0]).toMatchObject({
      source_plan_id: 'plan-1',
      created_by: 'user-1',
      visibility: 'link_only',
      source_plan_version: 3,
      title: 'Shared title',
      description: 'Saturday',
      region: 'busan',
      transport_mode: 'car',
      total_stops: 2,
      estimated_hours: 3.3,
    })
    expect((insert?.args[0] as { relative_stops: unknown }).relative_stops).toEqual([
      {
        place_id: 'place-1',
        day_index: 1,
        offset_minutes: 0,
        dwell_minutes: 90,
        order: 1,
      },
      {
        place_id: 'place-2',
        day_index: 1,
        offset_minutes: 150,
        dwell_minutes: 60,
        order: 2,
      },
    ])
  })

  it('maps get_shared_itinerary RPC relative stops to place names', async () => {
    const calls: Call[] = []
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            share_code: 'abcdef123456',
            title: 'Shared title',
            region: 'busan',
            transport_mode: 'car',
            total_stops: 2,
            estimated_hours: 3.5,
            relative_stops: [
              { place_id: 'place-2', day_index: 1, offset_minutes: 120, order: 2 },
              { place_id: 'place-1', day_index: 1, offset_minutes: 0, order: 1 },
            ],
          },
        ],
        error: null,
      }),
      from(table: string) {
        return {
          select(...args: unknown[]) {
            calls.push({ table, method: 'select', args })
            return this
          },
          in(...args: unknown[]) {
            calls.push({ table, method: 'in', args })
            return Promise.resolve({
              data: [
                { id: 'place-1', name: 'Gamcheon Culture Village' },
                { id: 'place-2', name: 'Momos Coffee Jeonpo' },
              ],
              error: null,
            })
          },
        }
      },
    }

    const result = await getSharedItineraryPreview(
      client as unknown as Parameters<typeof getSharedItineraryPreview>[0],
      'abcdef123456',
    )

    expect(client.rpc).toHaveBeenCalledWith('get_shared_itinerary', {
      p_share_code: 'abcdef123456',
    })
    expect(result.stops).toEqual([
      { place_name: 'Gamcheon Culture Village', day_index: 1, offset_minutes: 0 },
      { place_name: 'Momos Coffee Jeonpo', day_index: 1, offset_minutes: 120 },
    ])
  })

  it('calls import_shared_itinerary RPC with authenticated user id', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: 'result-plan-1',
        error: null,
      }),
    }

    const result = await importSharedItinerary(
      client as unknown as Parameters<typeof importSharedItinerary>[0],
      'abcdef123456',
      'user-1',
      {
        start_at: '2026-06-14T09:00:00+09:00',
        transport_mode: 'car',
        origin_lat: 35.1152,
        origin_lng: 129.0422,
        origin_name: 'Busan Station',
      },
    )

    expect(client.rpc).toHaveBeenCalledWith('import_shared_itinerary', {
      p_share_code: 'abcdef123456',
      p_user_id: 'user-1',
      p_start_at: '2026-06-14T09:00:00+09:00',
      p_transport_mode: 'car',
      p_origin_lat: 35.1152,
      p_origin_lng: 129.0422,
      p_origin_name: 'Busan Station',
    })
    expect(result).toBe('result-plan-1')
  })
})
