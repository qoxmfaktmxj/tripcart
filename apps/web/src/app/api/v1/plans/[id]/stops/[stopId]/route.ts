/**
 * PATCH  /api/v1/plans/:id/stops/:stopId — stop 수정 (dwell_minutes, locked, user_note)
 * DELETE /api/v1/plans/:id/stops/:stopId — stop 제거
 *
 * 인증 필수. Plan 소유권 + active execution 체크.
 * stop 변경 → plan status → draft, version++
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPlanOwnership, hasActiveExecution, resetPlanToDraft } from '@/lib/supabase/queries/plans'
import { updateStop, removeStop } from '@/lib/supabase/queries/plan-stops'
import { UUID_RE } from '@/lib/utils/validation'

// ── PATCH ────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> },
) {
  try {
    const { id: planId, stopId } = await params

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

    if (!UUID_RE.test(stopId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid stop id format',
            details: { field: 'stopId' },
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

    const { dwell_minutes, locked, user_note } = body as Record<string, unknown>

    // 검증
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

    if (locked !== undefined && typeof locked !== 'boolean') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'locked must be a boolean',
            details: { field: 'locked' },
          },
        },
        { status: 400 },
      )
    }

    if (user_note !== undefined && user_note !== null && typeof user_note !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'user_note must be a string or null',
            details: { field: 'user_note' },
          },
        },
        { status: 400 },
      )
    }

    const updateInput: Parameters<typeof updateStop>[3] = {}
    if (dwell_minutes !== undefined) updateInput.dwell_minutes = dwell_minutes as number
    if (locked !== undefined) updateInput.locked = locked as boolean
    if (user_note !== undefined) updateInput.user_note = user_note as string | null

    const stop = await updateStop(supabase, planId, stopId, updateInput)

    if (!stop) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Stop not found' } },
        { status: 404 },
      )
    }

    // plan status → draft, version++
    await resetPlanToDraft(supabase, user.id, planId)

    return NextResponse.json({ data: stop })
  } catch (err) {
    console.error('[PATCH /plans/:id/stops/:stopId]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update stop' } },
      { status: 500 },
    )
  }
}

// ── DELETE ────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> },
) {
  try {
    const { id: planId, stopId } = await params

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

    if (!UUID_RE.test(stopId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'Invalid stop id format',
            details: { field: 'stopId' },
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

    // remove_plan_stop RPC가 소유권 확인 + stop 삭제 + order 재정렬 + draft reset을 원자적으로 처리
    const removed = await removeStop(supabase, planId, stopId)

    if (!removed) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Stop not found' } },
        { status: 404 },
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /plans/:id/stops/:stopId]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove stop' } },
      { status: 500 },
    )
  }
}
