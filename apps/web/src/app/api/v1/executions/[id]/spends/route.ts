import { NextResponse } from 'next/server'
import { validateCreateSpendRequest } from '@/lib/spend-api'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'

export async function POST(
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid JSON body' } },
      { status: 400 },
    )
  }

  const validation = validateCreateSpendRequest(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
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

  const input = validation.value
  const { data: stop, error: stopError } = await supabase
    .from('trip_execution_stops')
    .select('id, execution_id, place_id')
    .eq('id', input.stop_id)
    .eq('execution_id', id)
    .single()

  if (stopError?.code === 'PGRST116' || !stop) {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'stop_id does not belong to this execution', details: { field: 'stop_id' } } },
      { status: 400 },
    )
  }
  if (stopError) throw stopError

  const { data: spend, error: spendError } = await supabase
    .from('trip_spends')
    .insert({
      execution_id: id,
      exec_stop_id: input.stop_id,
      place_id: stop.place_id,
      user_id: user.id,
      amount: input.total_amount,
      category: input.category,
      spent_at: input.occurred_at,
    })
    .select('id, amount')
    .single()

  if (spendError) throw spendError

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('trip_spend_items')
      .insert(
        input.items.map((item) => ({
          spend_id: spend.id,
          menu_name: item.name,
          quantity: item.qty,
          unit_price: item.unit_price,
        })),
      )

    if (itemsError) throw itemsError
  }

  return NextResponse.json(
    {
      id: spend.id,
      total_amount: spend.amount,
    },
    { status: 201 },
  )
}
