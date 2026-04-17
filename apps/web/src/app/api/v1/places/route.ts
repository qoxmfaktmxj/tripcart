/**
 * GET /api/v1/places — 장소 목록 조회
 *
 * Public read (인증 불필요). RLS: deleted_at is null.
 * Query: region, category, q, tags, limit, cursor
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlaces } from '@/lib/supabase/queries/places'
import type { PlaceCategory, GetPlacesParams } from '@tripcart/types'

const VALID_CATEGORIES: PlaceCategory[] = [
  'restaurant',
  'cafe',
  'attraction',
  'accommodation',
  'activity',
  'shopping',
  'other',
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const region = searchParams.get('region') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const q = searchParams.get('q') ?? undefined
    const tags = searchParams.get('tags') ?? undefined
    const cursor = searchParams.get('cursor') ?? undefined
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined

    // category 유효성 검사
    if (category && !VALID_CATEGORIES.includes(category as PlaceCategory)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: `Invalid category: ${category}`,
            details: { field: 'category', allowed: VALID_CATEGORIES },
          },
        },
        { status: 400 },
      )
    }

    // limit 유효성 검사
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

    const supabase = await createClient(request)

    const queryParams: Record<string, string | number> = {}
    if (region) queryParams.region = region
    if (category) queryParams.category = category
    if (q) queryParams.q = q
    if (tags) queryParams.tags = tags
    if (limit) queryParams.limit = limit
    if (cursor) queryParams.cursor = cursor

    const result = await getPlaces(supabase, queryParams as GetPlacesParams)

    return NextResponse.json({
      data: result.data,
      meta: {
        cursor: result.cursor,
        has_more: result.hasMore,
      },
    })
  } catch (err) {
    console.error('[GET /places]', err)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch places',
        },
      },
      { status: 500 },
    )
  }
}
