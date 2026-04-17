/**
 * GET    /api/v1/plans/:id — 상세 (stops 포함)
 * PATCH  /api/v1/plans/:id — 수정 (status→draft, version++)
 * DELETE /api/v1/plans/:id — soft delete (deleted_at 설정)
 *
 * 인증 필수. RLS + 명시적 user_id 필터 (defense in depth).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getPlanById,
  updatePlan,
  softDeletePlan,
  hasActiveExecution,
  verifyPlanOwnership,
} from '@/lib/supabase/queries/plans'
import { UUID_RE } from '@/lib/utils/validation'
import type { TravelMode } from '@tripcart/types'

const VALID_TRAVEL_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']

// ── GET ──────────────────────────────────────────────────────────

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

    const plan = await getPlanById(supabase, user.id, id)

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: plan })
  } catch (err) {
    console.error('[GET /plans/:id]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plan' } },
      { status: 500 },
    )
  }
}

// ── PATCH ────────────────────────────────────────────────────────

export async function PATCH(
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

    // active execution 체크
    if (await hasActiveExecution(supabase, id)) {
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

    const { title, start_at, transport_mode, origin_lat, origin_lng, origin_name } =
      body as Record<string, unknown>

    // 검증
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FIELD',
            message: 'title must be a non-empty string',
            details: { field: 'title' },
          },
        },
        { status: 400 },
      )
    }

    if (
      transport_mode !== undefined &&
      !VALID_TRAVEL_MODES.includes(transport_mode as TravelMode)
    ) {
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

    const updateInput: Parameters<typeof updatePlan>[3] = {}
    if (title !== undefined) updateInput.title = (title as string).trim()
    if (start_at !== undefined) updateInput.start_at = start_at as string | null
    if (transport_mode !== undefined) updateInput.transport_mode = transport_mode as TravelMode
    if (origin_lat !== undefined) updateInput.origin_lat = origin_lat as number
    if (origin_lng !== undefined) updateInput.origin_lng = origin_lng as number
    if (origin_name !== undefined) updateInput.origin_name = origin_name as string

    const plan = await updatePlan(supabase, user.id, id, updateInput)

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } },
        { status: 404 },
      )
    }

    // Contract 6.4: { id, status, version, updated_at }
    return NextResponse.json({
      id: plan.id,
      status: plan.status,
      version: plan.version,
      updated_at: plan.updated_at,
    })
  } catch (err) {
    console.error('[PATCH /plans/:id]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update plan' } },
      { status: 500 },
    )
  }
}

// ── DELETE ────────────────────────────────────────────────────────

export async function DELETE(
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

    const ownership = await verifyPlanOwnership(supabase, user.id, id)
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

    if (await hasActiveExecution(supabase, id)) {
      return NextResponse.json(
        { error: { code: 'PLAN_IN_PROGRESS', message: 'Cannot delete plan with active execution' } },
        { status: 409 },
      )
    }

    await softDeletePlan(supabase, user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /plans/:id]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete plan' } },
      { status: 500 },
    )
  }
}
