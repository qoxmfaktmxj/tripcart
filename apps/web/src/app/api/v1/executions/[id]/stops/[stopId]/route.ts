import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stopId: string }> },
) {
  const { id, stopId } = await params

  if (!UUID_RE.test(id) || !UUID_RE.test(stopId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid id format' } },
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid JSON body' } },
      { status: 400 },
    )
  }

  const source = body as Record<string, unknown>
  const patch: Record<string, unknown> = {}

  for (const field of ['arrive_at', 'leave_at', 'skip_reason'] as const) {
    if (source[field] !== undefined) {
      if (source[field] !== null && typeof source[field] !== 'string') {
        return NextResponse.json(
          { error: { code: 'INVALID_FIELD', message: `${field} must be a string or null`, details: { field } } },
          { status: 400 },
        )
      }
      patch[field] = source[field]
    }
  }

  if (source.skipped !== undefined) {
    if (typeof source.skipped !== 'boolean') {
      return NextResponse.json(
        { error: { code: 'INVALID_FIELD', message: 'skipped must be a boolean', details: { field: 'skipped' } } },
        { status: 400 },
      )
    }
    patch.skipped = source.skipped
  }

  const { data: execution, error: executionError } = await supabase
    .from('trip_executions')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (executionError?.code === 'PGRST116' || !execution) {
    return NextResponse.json(
      { error: { code: 'EXECUTION_NOT_FOUND', message: 'Execution not found' } },
      { status: 404 },
    )
  }
  if (executionError) throw executionError
  if (execution.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: 'NOT_OWNER', message: 'Not the execution owner' } },
      { status: 403 },
    )
  }

  const { data, error } = await supabase
    .from('trip_execution_stops')
    .update(patch)
    .eq('id', stopId)
    .eq('execution_id', id)
    .select('id, execution_id, place_id, stop_order, planned_arrive_at, planned_leave_at, arrive_at, leave_at, skipped, skip_reason, is_adhoc, places:place_id (name)')
    .single()

  if (error?.code === 'PGRST116' || !data) {
    return NextResponse.json(
      { error: { code: 'EXECUTION_NOT_FOUND', message: 'Execution stop not found' } },
      { status: 404 },
    )
  }
  if (error) throw error

  return NextResponse.json({ data })
}
