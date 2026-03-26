/**
 * GET  /api/v1/plans — 내 계획 목록 (cursor pagination)
 * POST /api/v1/plans — draft 생성
 *
 * 인증 필수. RLS + 명시적 user_id 필터 (defense in depth).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlans, createPlan } from '@/lib/supabase/queries/plans'
import type { TravelMode } from '@tripcart/types'

const VALID_TRAVEL_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']

// ── GET ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const { searchParams } = request.nextUrl
    const cursor = searchParams.get('cursor') ?? undefined
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined

    if (rawLimit !== null && (isNaN(limit!) || limit! < 1)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'limit must be a positive integer',
            details: { field: 'limit' },
          },
        },
        { status: 400 },
      )
    }

    const queryParams: { cursor?: string; limit?: number } = {}
    if (cursor !== undefined) queryParams.cursor = cursor
    if (limit !== undefined) queryParams.limit = limit

    const result = await getPlans(supabase, user.id, queryParams)

    return NextResponse.json({
      data: result.data,
      meta: { cursor: result.cursor, has_more: result.hasMore },
    })
  } catch (err) {
    console.error('[GET /plans]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plans' } },
      { status: 500 },
    )
  }
}

// ── POST ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_FIELD', message: 'Invalid JSON body' } },
        { status: 400 },
      )
    }

    const {
      title,
      start_at,
      region,
      transport_mode,
      origin_lat,
      origin_lng,
      origin_name,
    } = body as Record<string, unknown>

    // 필수 필드 검증
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'title is required',
            details: { field: 'title' },
          },
        },
        { status: 400 },
      )
    }

    if (!region || typeof region !== 'string' || region.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'region is required',
            details: { field: 'region' },
          },
        },
        { status: 400 },
      )
    }

    // 선택 필드 검증
    if (transport_mode !== undefined && !VALID_TRAVEL_MODES.includes(transport_mode as TravelMode)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: `Invalid transport_mode. Allowed: ${VALID_TRAVEL_MODES.join(', ')}`,
            details: { field: 'transport_mode' },
          },
        },
        { status: 400 },
      )
    }

    if (origin_lat !== undefined && (typeof origin_lat !== 'number' || isNaN(origin_lat as number))) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'origin_lat must be a number',
            details: { field: 'origin_lat' },
          },
        },
        { status: 400 },
      )
    }

    if (origin_lng !== undefined && (typeof origin_lng !== 'number' || isNaN(origin_lng as number))) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'origin_lng must be a number',
            details: { field: 'origin_lng' },
          },
        },
        { status: 400 },
      )
    }

    const createInput: Parameters<typeof createPlan>[2] = {
      title: (title as string).trim(),
      region: (region as string).trim(),
    }
    if (start_at !== undefined) createInput.start_at = start_at as string
    if (transport_mode !== undefined) createInput.transport_mode = transport_mode as TravelMode
    if (origin_lat !== undefined) createInput.origin_lat = origin_lat as number
    if (origin_lng !== undefined) createInput.origin_lng = origin_lng as number
    if (origin_name !== undefined) createInput.origin_name = origin_name as string

    const plan = await createPlan(supabase, user.id, createInput)

    // Contract 6.1: { id, status, version }
    return NextResponse.json(
      { id: plan.id, status: plan.status, version: plan.version },
      { status: 201 },
    )
  } catch (err) {
    console.error('[POST /plans]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create plan' } },
      { status: 500 },
    )
  }
}
