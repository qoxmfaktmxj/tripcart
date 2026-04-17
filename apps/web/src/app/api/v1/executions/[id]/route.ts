import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid execution id format', details: { field: 'id' } } },
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

  const { data: execution, error } = await supabase
    .from('trip_executions')
    .select('*')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116' || !execution) {
    return NextResponse.json(
      { error: { code: 'EXECUTION_NOT_FOUND', message: 'Execution not found' } },
      { status: 404 },
    )
  }
  if (error) throw error

  if (execution.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: 'NOT_OWNER', message: 'Not the execution owner' } },
      { status: 403 },
    )
  }

  const { data: stops, error: stopsError } = await supabase
    .from('trip_execution_stops')
    .select('id, stop_order, place_id, planned_arrive_at, planned_leave_at, arrive_at, leave_at, skipped, is_adhoc, places:place_id (name)')
    .eq('execution_id', id)
    .order('stop_order', { ascending: true })

  if (stopsError) throw stopsError

  return NextResponse.json({
    id: execution.id,
    plan_id: execution.plan_id,
    status: execution.status,
    delay_minutes: execution.delay_minutes ?? 0,
    reopt_count: execution.reopt_count ?? 0,
    stops: (stops ?? []).map((stop) => {
      const place = stop.places as { name?: string } | null
      return {
        id: stop.id,
        stop_order: stop.stop_order,
        place_id: stop.place_id,
        place_name: place?.name ?? '',
        planned_arrive_at: stop.planned_arrive_at ?? null,
        planned_leave_at: stop.planned_leave_at ?? null,
        arrive_at: stop.arrive_at ?? null,
        leave_at: stop.leave_at ?? null,
        skipped: stop.skipped ?? false,
        is_adhoc: stop.is_adhoc ?? false,
      }
    }),
    next_alert: null,
  })
}
