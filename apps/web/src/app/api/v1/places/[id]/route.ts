/**
 * GET /api/v1/places/:id — 장소 상세 조회
 *
 * Public read (인증 불필요). RLS: deleted_at is null.
 * Response: PlaceDetail (hours, break_windows, visit_profile 포함)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlaceById } from '@/lib/supabase/queries/places'

// UUID v4 형식 검사
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid place id format',
            details: { field: 'id' },
          },
        },
        { status: 400 },
      )
    }

    const supabase = await createClient(request)
    const place = await getPlaceById(supabase, id)

    if (!place) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Place not found',
          },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: place })
  } catch (err) {
    console.error('[GET /places/:id]', err)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch place',
        },
      },
      { status: 500 },
    )
  }
}
