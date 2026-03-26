/**
 * POST /api/v1/plans/:id/stops — stop 추가
 *
 * 인증 필수. Plan 소유권 + active execution 체크.
 * stop_order = max(stop_order) + 1
 * plan status → draft, version++
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPlanOwnership, hasActiveExecution, resetPlanToDraft } from '@/lib/supabase/queries/plans'
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

    const { place_id, dwell_minutes, locked } = body as Record<string, unknown>

    if (!place_id || typeof place_id !== 'string' || !UUID_RE.test(place_id)) {
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

    if (dwell_minutes !== undefined && (typeof dwell_minutes !== 'number' || dwell_minutes < 1)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'dwell_minutes must be a positive number',
            details: { field: 'dwell_minutes' },
          },
        },
        { status: 400 },
      )
    }

    const addInput: Parameters<typeof addStop>[2] = {
      place_id: place_id as string,
    }
    if (dwell_minutes !== undefined) addInput.dwell_minutes = dwell_minutes as number
    if (locked !== undefined) addInput.locked = locked as boolean

    const stop = await addStop(supabase, planId, addInput)

    // plan status → draft, version++
    await resetPlanToDraft(supabase, planId)

    return NextResponse.json({ data: stop }, { status: 201 })
  } catch (err) {
    // FK violation (존재하지 않는 place_id)
    const pgError = err as { code?: string }
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
