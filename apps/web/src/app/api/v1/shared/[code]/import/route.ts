import { NextResponse } from 'next/server'
import { importSharedItinerary } from '@/lib/supabase/queries/shared'
import { createClient } from '@/lib/supabase/server'
import type { ImportSharedRequest, TransportMode } from '@tripcart/types'

const TRANSPORT_MODES: TransportMode[] = ['car', 'transit', 'walk', 'bicycle']

function isIsoWithTimezone(value: string): boolean {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

function validateImportRequest(body: unknown):
  | { ok: true; value: ImportSharedRequest }
  | { ok: false; field: string; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, field: 'body', message: 'Request body must be an object' }
  }
  const source = body as Record<string, unknown>
  if (typeof source.start_at !== 'string' || !isIsoWithTimezone(source.start_at)) {
    return { ok: false, field: 'start_at', message: 'start_at must be an ISO timestamp with timezone' }
  }
  if (
    typeof source.transport_mode !== 'string' ||
    !TRANSPORT_MODES.includes(source.transport_mode as TransportMode)
  ) {
    return { ok: false, field: 'transport_mode', message: 'Invalid transport_mode' }
  }
  if (typeof source.origin_lat !== 'number') {
    return { ok: false, field: 'origin_lat', message: 'origin_lat must be a number' }
  }
  if (typeof source.origin_lng !== 'number') {
    return { ok: false, field: 'origin_lng', message: 'origin_lng must be a number' }
  }
  if (typeof source.origin_name !== 'string' || source.origin_name.trim().length === 0) {
    return { ok: false, field: 'origin_name', message: 'origin_name is required' }
  }
  return {
    ok: true,
    value: {
      start_at: source.start_at,
      transport_mode: source.transport_mode as TransportMode,
      origin_lat: source.origin_lat,
      origin_lng: source.origin_lng,
      origin_name: source.origin_name,
    },
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

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
  const validation = validateImportRequest(body)
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_FIELD',
          message: validation.message,
          details: { field: validation.field },
        },
      },
      { status: 400 },
    )
  }

  try {
    const resultPlanId = await importSharedItinerary(supabase, code, user.id, validation.value)
    return NextResponse.json(
      {
        result_plan_id: resultPlanId,
        status: 'draft',
      },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('SHARED_PRIVATE')) {
      return NextResponse.json(
        { error: { code: 'SHARED_PRIVATE', message: 'Shared itinerary is private' } },
        { status: 403 },
      )
    }
    if (message.includes('SHARED_NOT_FOUND')) {
      return NextResponse.json(
        { error: { code: 'SHARED_NOT_FOUND', message: 'Shared itinerary not found' } },
        { status: 404 },
      )
    }
    throw err
  }
}
