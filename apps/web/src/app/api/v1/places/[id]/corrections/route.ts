import { NextResponse } from 'next/server'
import { validatePlaceCorrectionRequest } from '@/lib/place-corrections-api'
import { createClient } from '@/lib/supabase/server'
import { UUID_RE } from '@/lib/utils/validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_FIELD',
          message: 'Invalid place id format',
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
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
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

  const validation = validatePlaceCorrectionRequest(body)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data: place, error: placeError } = await supabase
    .from('places')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (placeError) throw placeError
  if (!place) {
    return NextResponse.json(
      { error: { code: 'PLACE_NOT_FOUND', message: 'Place not found' } },
      { status: 404 },
    )
  }

  const { data, error } = await supabase
    .from('place_data_corrections')
    .insert({
      user_id: user.id,
      place_id: id,
      ...validation.value,
    })
    .select('id, status')
    .single()

  if (error) throw error

  return NextResponse.json(
    {
      id: data.id,
      status: data.status,
    },
    { status: 201 },
  )
}
