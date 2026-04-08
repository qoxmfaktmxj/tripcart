/**
 * GET  /api/v1/me/saved-places: 내 저장 장소 목록
 * POST /api/v1/me/saved-places: 장소 저장 추가
 *
 * 인증은 /me prefix를 보호하는 proxy에서 선행된다.
 * 여기서는 RLS와 명시적 user_id 필터로 한 번 더 방어한다.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSavedPlaces, addSavedPlace } from '@/lib/supabase/queries/saved-places'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET() {
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

export async function POST(request: Request) {
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