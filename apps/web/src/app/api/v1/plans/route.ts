import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateCreatePlanRequest } from '@/lib/plan-api'
import { getPlans, createPlan } from '@/lib/supabase/queries/plans'
import { createClient } from '@/lib/supabase/server'
import type { CreatePlanResponse } from '@tripcart/types'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = request.nextUrl
    const cursor = searchParams.get('cursor') ?? undefined
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit === null ? undefined : parseInt(rawLimit, 10)

    if (limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
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

    const queryParams: { cursor?: string; limit?: number } = {}
    if (cursor !== undefined) queryParams.cursor = cursor
    if (limit !== undefined) queryParams.limit = limit

    const result = await getPlans(supabase, user.id, queryParams)

    return NextResponse.json({
      data: result.data,
      meta: { cursor: result.cursor, has_more: result.hasMore },
    })
  } catch (err) {
    console.error('[GET /plans]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plans' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_FIELD', message: 'Invalid JSON body' } },
        { status: 400 },
      )
    }

    const validation = validateCreatePlanRequest(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const plan = await createPlan(supabase, user.id, validation.value)
    const response: CreatePlanResponse = {
      data: {
        id: plan.id,
        title: plan.title,
        region: plan.region,
        transport_mode: plan.transport_mode,
        start_at: plan.start_at,
        origin_name: plan.origin_name ?? null,
        visibility: 'private',
        status: plan.status,
        version: plan.version ?? 1,
        created_at: plan.created_at,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('[POST /plans]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create plan' } },
      { status: 500 },
    )
  }
}
