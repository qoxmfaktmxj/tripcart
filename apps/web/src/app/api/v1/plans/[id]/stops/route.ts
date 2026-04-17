/**
 * POST /api/v1/plans/:id/stops — stop 추가
 *
 * 인증 필수. Plan 소유권 + active execution 체크.
 * add_plan_stop RPC가 stop_order 계산, active execution 검사,
 * plan draft reset을 한 트랜잭션에서 처리한다.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAddStopRequest } from '@/lib/plan-api'
import { createClient } from '@/lib/supabase/server'
import { verifyPlanOwnership, hasActiveExecution } from '@/lib/supabase/queries/plans'
import { addStop } from '@/lib/supabase/queries/plan-stops'
import { UUID_RE } from '@/lib/utils/validation'

// ── POST ─────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: planId } = await params

    if (!UUID_RE.test(planId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid plan id format',
            details: { field: 'id' },
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
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    // 소유권 확인
    const ownership = await verifyPlanOwnership(supabase, user.id, planId)
    if (!ownership.exists) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } },
        { status: 404 },
      )
    }
    if (!ownership.owned) {
      return NextResponse.json(
        { error: { code: 'NOT_OWNER', message: 'Not the plan owner' } },
        { status: 403 },
      )
    }

    // active execution 체크
    if (await hasActiveExecution(supabase, planId)) {
      return NextResponse.json(
        { error: { code: 'PLAN_IN_PROGRESS', message: 'Cannot modify plan with active execution' } },
        { status: 409 },
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

    const validation = validateAddStopRequest(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const stop = await addStop(supabase, planId, validation.value)

    return NextResponse.json({ data: stop }, { status: 201 })
  } catch (err) {
    // FK violation (존재하지 않는 place_id)
    const pgError = err as { code?: string }
    const message = err instanceof Error ? err.message : ''

    if (message.includes('PLAN_IN_PROGRESS')) {
      return NextResponse.json(
        { error: { code: 'PLAN_IN_PROGRESS', message: 'Cannot modify plan with active execution' } },
        { status: 409 },
      )
    }

    if (message.includes('PLACE_NOT_FOUND')) {
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

    console.error('[POST /plans/:id/stops]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add stop' } },
      { status: 500 },
    )
  }
}
