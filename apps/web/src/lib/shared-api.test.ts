import { describe, expect, it, vi, beforeEach } from 'vitest'

import { POST as postSharePlan } from '../app/api/v1/plans/[id]/share/route'
import { GET as getSharedItinerary } from '../app/api/v1/shared/[code]/route'
import { POST as postImportSharedItinerary } from '../app/api/v1/shared/[code]/import/route'
import { createClient } from './supabase/server'
import { verifyPlanOwnership } from './supabase/queries/plans'
import {
  createSharedItinerary,
  getSharedItineraryPreview,
  importSharedItinerary,
} from './supabase/queries/shared'

vi.mock('./supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('./supabase/queries/plans', () => ({
  verifyPlanOwnership: vi.fn(),
}))

vi.mock('./supabase/queries/shared', () => ({
  createSharedItinerary: vi.fn(),
  getSharedItineraryPreview: vi.fn(),
  importSharedItinerary: vi.fn(),
}))

const PLAN_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) }
}

function authenticatedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
  }
}

function unauthenticatedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  }
}

describe('share API routes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('POST /plans/:id/share authenticates owner and returns share URL', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(verifyPlanOwnership).mockResolvedValue({ exists: true, owned: true })
    vi.mocked(createSharedItinerary).mockResolvedValue({
      shared_id: '33333333-3333-4333-8333-333333333333',
      share_code: 'a1b2c3d4e5f6',
      expires_at: null,
    })

    const response = await postSharePlan(
      new Request(`https://tripcart.test/api/v1/plans/${PLAN_ID}/share`, {
        method: 'POST',
        body: JSON.stringify({
          visibility: 'link_only',
          title: 'Busan food route',
          description: 'Saturday route',
        }),
      }),
      params({ id: PLAN_ID }),
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(createSharedItinerary).toHaveBeenCalledWith(supabase, PLAN_ID, USER_ID, {
      visibility: 'link_only',
      title: 'Busan food route',
      description: 'Saturday route',
    })
    expect(body).toEqual({
      shared_id: '33333333-3333-4333-8333-333333333333',
      share_code: 'a1b2c3d4e5f6',
      share_url: 'https://tripcart.test/trip/a1b2c3d4e5f6',
      expires_at: null,
    })
  })

  it('POST /plans/:id/share rejects non-owners without creating a snapshot', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(verifyPlanOwnership).mockResolvedValue({ exists: true, owned: false })

    const response = await postSharePlan(
      new Request(`https://tripcart.test/api/v1/plans/${PLAN_ID}/share`, {
        method: 'POST',
        body: JSON.stringify({ visibility: 'link_only' }),
      }),
      params({ id: PLAN_ID }),
    )
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('NOT_OWNER')
    expect(createSharedItinerary).not.toHaveBeenCalled()
  })

  it('GET /shared/:code returns RPC preview with place names', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(getSharedItineraryPreview).mockResolvedValue({
      share_code: 'a1b2c3d4e5f6',
      title: 'Busan food route',
      region: 'busan',
      transport_mode: 'car',
      total_stops: 2,
      estimated_hours: 4.5,
      stops: [
        { place_name: 'Gamcheon Culture Village', day_index: 1, offset_minutes: 0 },
        { place_name: 'Momos Coffee Jeonpo', day_index: 1, offset_minutes: 120 },
      ],
    })

    const response = await getSharedItinerary(
      new Request('https://tripcart.test/api/v1/shared/a1b2c3d4e5f6'),
      params({ code: 'a1b2c3d4e5f6' }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(getSharedItineraryPreview).toHaveBeenCalledWith(supabase, 'a1b2c3d4e5f6')
    expect(body.stops[0]).toEqual({
      place_name: 'Gamcheon Culture Village',
      day_index: 1,
      offset_minutes: 0,
    })
  })

  it('GET /shared/:code maps SHARED_PRIVATE to contract error', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(getSharedItineraryPreview).mockRejectedValue(new Error('SHARED_PRIVATE'))

    const response = await getSharedItinerary(
      new Request('https://tripcart.test/api/v1/shared/privatecode'),
      params({ code: 'privatecode' }),
    )
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('SHARED_PRIVATE')
  })

  it('POST /shared/:code/import requires auth', async () => {
    vi.mocked(createClient).mockResolvedValue(unauthenticatedSupabase() as never)

    const response = await postImportSharedItinerary(
      new Request('https://tripcart.test/api/v1/shared/a1b2c3d4e5f6/import', {
        method: 'POST',
        body: JSON.stringify({
          start_at: '2026-06-14T09:00:00+09:00',
          transport_mode: 'car',
          origin_lat: 35.1152,
          origin_lng: 129.0422,
          origin_name: 'Busan Station',
        }),
      }),
      params({ code: 'a1b2c3d4e5f6' }),
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(importSharedItinerary).not.toHaveBeenCalled()
  })

  it('POST /shared/:code/import validates request fields before RPC', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const response = await postImportSharedItinerary(
      new Request('https://tripcart.test/api/v1/shared/a1b2c3d4e5f6/import', {
        method: 'POST',
        body: JSON.stringify({
          start_at: '2026-06-14T09:00:00',
          transport_mode: 'car',
          origin_lat: 35.1152,
          origin_lng: 129.0422,
          origin_name: 'Busan Station',
        }),
      }),
      params({ code: 'a1b2c3d4e5f6' }),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_FIELD')
    expect(body.error.details.field).toBe('start_at')
    expect(importSharedItinerary).not.toHaveBeenCalled()
  })

  it('POST /shared/:code/import calls import RPC and returns draft plan id', async () => {
    const supabase = authenticatedSupabase()
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.mocked(importSharedItinerary).mockResolvedValue('44444444-4444-4444-8444-444444444444')

    const requestBody = {
      start_at: '2026-06-14T09:00:00+09:00',
      transport_mode: 'car',
      origin_lat: 35.1152,
      origin_lng: 129.0422,
      origin_name: 'Busan Station',
    }

    const response = await postImportSharedItinerary(
      new Request('https://tripcart.test/api/v1/shared/a1b2c3d4e5f6/import', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
      params({ code: 'a1b2c3d4e5f6' }),
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(importSharedItinerary).toHaveBeenCalledWith(
      supabase,
      'a1b2c3d4e5f6',
      USER_ID,
      requestBody,
    )
    expect(body).toEqual({
      result_plan_id: '44444444-4444-4444-8444-444444444444',
      status: 'draft',
    })
  })
})
