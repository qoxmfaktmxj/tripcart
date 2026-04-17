import { NextResponse } from 'next/server'
import { validateSpendSummaryParams } from '@/lib/spend-api'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
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

  const validation = validateSpendSummaryParams(new URL(request.url).searchParams)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const input = validation.value
  let query = supabase
    .from('trip_spends')
    .select('amount, category, spent_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (input.from) query = query.gte('spent_at', input.from)
  if (input.to) query = query.lte('spent_at', input.to)

  const { data, error } = await query
  if (error) throw error

  const byCategory: Record<string, number> = {}
  let total = 0
  for (const spend of data ?? []) {
    const amount = spend.amount ?? 0
    const category = spend.category ?? 'other'
    total += amount
    byCategory[category] = (byCategory[category] ?? 0) + amount
  }

  return NextResponse.json({
    period: input.period,
    total_amount: total,
    by_category: byCategory,
  })
}
