/**
 * PATCH /api/v1/plans/:id/stops/reorder — 순서 변경
 *
 * 인증 필수. Plan 소유권 + active execution 체크.
 * RPC reorder_plan_stops 호출 (원자적, status→draft, version++).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPlanOwnership, hasActiveExecution, getPlanById } from '@/lib/supabase/queries/plans'
import { reorderStops } from '@/lib/supabase/queries/plan-stops'
import { UUID_RE } from '@/lib/utils/validation'

// ── PATCH ────────────────────────────────────────────────────────

export async function PATCH(
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

    const { ordered_stop_ids } = body as Record<string, unknown>

    if (
      !Array.isArray(ordered_stop_ids) ||
      ordered_stop_ids.length === 0 ||
      !ordered_stop_ids.every((id) => typeof id === 'string' && UUID_RE.test(id))
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'ordered_stop_ids must be a non-empty array of valid UUIDs',
            details: { field: 'ordered_stop_ids' },
          },
        },
        { status: 400 },
      )
    }

    await reorderStops(supabase, planId, ordered_stop_ids as string[])

    // Contract 6.5: { id, status, version, stops }
    const updatedPlan = await getPlanById(supabase, user.id, planId)
    if (!updatedPlan) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found after reorder' } },
        { status: 404 },
      )
    }
    return NextResponse.json({
      id: updatedPlan.id,
      status: updatedPlan.status,
      version: updatedPlan.version,
      stops: updatedPlan.stops,
    })
  } catch (err) {
    // RPC에서 던지는 예외 매핑
    const pgError = err as { message?: string }
    const msg = pgError.message ?? ''

    if (msg.includes('NOT_OWNER')) {
      return NextResponse.json(
        { error: { code: 'NOT_OWNER', message: 'Not the plan owner' } },
        { status: 403 },
      )
    }
    if (msg.includes('INVALID_STOP_IDS')) {
      return NextResponse.json(
        { error: { code: 'INVALID_STOP_IDS', message: 'Provided stop IDs do not match existing stops' } },
        { status: 400 },
      )
    }
    if (msg.includes('LOCKED_POSITION_VIOLATED')) {
      return NextResponse.json(
        { error: { code: 'LOCKED_POSITION_VIOLATED', message: 'Locked stop position constraint violated' } },
        { status: 400 },
      )
    }

    console.error('[PATCH /plans/:id/stops/reorder]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder stops' } },
      { status: 500 },
    )
  }
}
