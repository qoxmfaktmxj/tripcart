import { NextResponse } from 'next/server'
import { getSharedItineraryPreview } from '@/lib/supabase/queries/shared'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const supabase = await createClient(request)

  try {
    return NextResponse.json(await getSharedItineraryPreview(supabase, code))
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
