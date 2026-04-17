/**
 * DELETE /api/v1/me/saved-places/:placeId — 저장 해제
 *
 * 인증 필수 (/me/ prefix는 middleware에서 보호).
 * Idempotent: 이미 없는 place를 삭제해도 204.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { removeSavedPlace } from '@/lib/supabase/queries/saved-places'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  try {
    const { placeId } = await params

    if (!UUID_RE.test(placeId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid placeId format',
            details: { field: 'placeId' },
          },
        },
        { status: 400 },
      )
    }

    const supabase = await createClient(request)
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

    await removeSavedPlace(supabase, user.id, placeId)

    // 204 No Content — idempotent (존재하지 않아도 성공)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /me/saved-places/:placeId]', err)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove saved place',
        },
      },
      { status: 500 },
    )
  }
}
