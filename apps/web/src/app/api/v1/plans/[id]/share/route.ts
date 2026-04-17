import { NextResponse } from 'next/server'
import { createSharedItinerary } from '@/lib/supabase/queries/shared'
import { verifyPlanOwnership } from '@/lib/supabase/queries/plans'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'
import type { ShareVisibility } from '@tripcart/types'

const VISIBILITIES: ShareVisibility[] = ['public', 'link_only', 'private']

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
  const visibility = source.visibility
  if (typeof visibility !== 'string' || !VISIBILITIES.includes(visibility as ShareVisibility)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FIELD', message: 'Invalid visibility', details: { field: 'visibility' } } },
      { status: 400 },
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

  const shared = await createSharedItinerary(supabase, id, user.id, {
    visibility: visibility as ShareVisibility,
    ...(typeof source.title === 'string' && { title: source.title.trim() }),
    ...(typeof source.description === 'string' && { description: source.description.trim() }),
  })

  return NextResponse.json(
    {
      ...shared,
      share_url: `${new URL(request.url).origin}/trip/${shared.share_code}`,
    },
    { status: 201 },
  )
}
