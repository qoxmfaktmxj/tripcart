/**
 * GET  /api/v1/me/saved-places — 내 저장 장소 목록
 * POST /api/v1/me/saved-places — 장소 저장 추가
 *
 * 인증 필수 (/me/ prefix는 middleware에서 보호).
 * RLS + 명시적 user_id 필터 (defense in depth).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSavedPlaces, addSavedPlace } from '@/lib/supabase/queries/saved-places'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── GET ──────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const savedPlaces = await getSavedPlaces(supabase, user.id)

    return NextResponse.json({
      data: savedPlaces,
      meta: { cursor: null, has_more: false },
    })
  } catch (err) {
    console.error('[GET /me/saved-places]', err)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch saved places',
        },
      },
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
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    // body 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid JSON body',
          },
        },
        { status: 400 },
      )
    }

    const { place_id, note } = body as { place_id?: string; note?: string }

    if (!place_id || !UUID_RE.test(place_id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'place_id is required and must be a valid UUID',
            details: { field: 'place_id' },
          },
        },
        { status: 400 },
      )
    }

    const savedPlace = await addSavedPlace(supabase, user.id, place_id, note)

    return NextResponse.json({ data: savedPlace }, { status: 201 })
  } catch (err) {
    // unique constraint violation (이미 저장된 place) -> 409
    const pgError = err as { code?: string }
    if (pgError.code === '23505') {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_SAVED',
            message: 'Place is already saved',
          },
        },
        { status: 409 },
      )
    }

    // FK violation (존재하지 않는 place_id) -> 400
    if (pgError.code === '23503') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Place not found',
            details: { field: 'place_id' },
          },
        },
        { status: 400 },
      )
    }

    console.error('[POST /me/saved-places]', err)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save place',
        },
      },
      { status: 500 },
    )
  }
}
