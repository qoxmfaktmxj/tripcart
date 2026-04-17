import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid plan id format', details: { field: 'id' } } },
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

  const { data: executionId, error } = await supabase.rpc('start_trip_execution', {
    p_plan_id: id,
  })

  if (error) {
    const message = error.message ?? ''
    if (message.includes('PLAN_NOT_CONFIRMED')) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_CONFIRMED', message: 'Plan must be confirmed before starting' } },
        { status: 409 },
      )
    }
    if (message.includes('EXECUTION_ALREADY_ACTIVE')) {
      return NextResponse.json(
        { error: { code: 'EXECUTION_ALREADY_ACTIVE', message: 'Execution already active' } },
        { status: 409 },
      )
    }
    if (message.includes('PLAN_NOT_FOUND')) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } },
        { status: 404 },
      )
    }
    if (message.includes('NOT_OWNER')) {
      return NextResponse.json(
        { error: { code: 'NOT_OWNER', message: 'Not the plan owner' } },
        { status: 403 },
      )
    }
    throw error
  }

  const { data: execution } = await supabase
    .from('trip_executions')
    .select('id, status, started_at')
    .eq('id', executionId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    execution_id: executionId,
    status: (execution?.status as string | undefined) ?? 'active',
    started_at: (execution?.started_at as string | undefined) ?? new Date().toISOString(),
  })
}
