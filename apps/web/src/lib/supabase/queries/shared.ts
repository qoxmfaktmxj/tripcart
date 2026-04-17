import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImportSharedRequest, ShareVisibility, TransportMode } from '@tripcart/types'

type CreateShareInput = {
  visibility: ShareVisibility
  title?: string
  description?: string
}

type SharedCreateResult = {
  shared_id: string
  share_code: string
  expires_at: string | null
}

type SharedStop = {
  place_id: string
  day_index: number
  offset_minutes: number
  dwell_minutes: number
  order: number
}

function minutesBetween(startAt: string | null, arriveAt: string | null, fallback: number): number {
  if (!startAt || !arriveAt) return fallback
  const start = new Date(startAt).getTime()
  const arrive = new Date(arriveAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(arrive)) return fallback
  return Math.max(0, Math.round((arrive - start) / 60_000))
}

export async function createSharedItinerary(
  supabase: SupabaseClient,
  planId: string,
  userId: string,
  input: CreateShareInput,
): Promise<SharedCreateResult> {
  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .select('id, user_id, title, start_at, region, transport_mode, version, optimization_meta')
    .eq('id', planId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (planError) throw planError

  const { data: stops, error: stopsError } = await supabase
    .from('trip_plan_stops')
    .select('id, place_id, stop_order, dwell_minutes, arrive_at, travel_from_prev_minutes')
    .eq('plan_id', planId)
    .order('stop_order', { ascending: true })

  if (stopsError) throw stopsError

  let fallbackOffset = 0
  const relativeStops: SharedStop[] = (stops ?? []).map((stop) => {
    const offset = minutesBetween(plan.start_at ?? null, stop.arrive_at ?? null, fallbackOffset)
    fallbackOffset = offset + (stop.dwell_minutes ?? 60) + (stop.travel_from_prev_minutes ?? 0)
    return {
      place_id: stop.place_id,
      day_index: 1,
      offset_minutes: offset,
      dwell_minutes: stop.dwell_minutes ?? 60,
      order: stop.stop_order,
    }
  })

  const totalDwellMinutes = relativeStops.reduce((sum, stop) => sum + stop.dwell_minutes, 0)
  const totalTravelMinutes =
    typeof plan.optimization_meta?.total_travel_minutes === 'number'
      ? plan.optimization_meta.total_travel_minutes
      : 0

  const { data: shared, error: insertError } = await supabase
    .from('shared_itineraries')
    .insert({
      source_plan_id: planId,
      created_by: userId,
      visibility: input.visibility,
      source_plan_version: plan.version ?? 1,
      relative_stops: relativeStops,
      title: input.title ?? plan.title,
      description: input.description ?? null,
      region: plan.region,
      transport_mode: plan.transport_mode,
      total_stops: relativeStops.length,
      estimated_hours: Math.round(((totalDwellMinutes + totalTravelMinutes) / 60) * 10) / 10,
    })
    .select('id, share_code, expires_at')
    .single()

  if (insertError) throw insertError

  return {
    shared_id: shared.id,
    share_code: shared.share_code,
    expires_at: shared.expires_at ?? null,
  }
}

export async function getSharedItineraryPreview(
  supabase: SupabaseClient,
  shareCode: string,
) {
  const { data, error } = await supabase.rpc('get_shared_itinerary', {
    p_share_code: shareCode,
  })

  if (error) throw error
  const shared = Array.isArray(data) ? data[0] : data
  if (!shared) throw new Error('SHARED_NOT_FOUND')

  const relativeStops = [...((shared.relative_stops ?? []) as SharedStop[])].sort(
    (a, b) => a.order - b.order,
  )
  const placeIds = relativeStops.map((stop) => stop.place_id)
  const placeNames = new Map<string, string>()

  if (placeIds.length > 0) {
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name')
      .in('id', placeIds)
    if (placesError) throw placesError
    for (const place of places ?? []) {
      placeNames.set(place.id, place.name)
    }
  }

  return {
    share_code: shared.share_code,
    title: shared.title,
    region: shared.region,
    transport_mode: shared.transport_mode as TransportMode,
    total_stops: shared.total_stops,
    estimated_hours: Number(shared.estimated_hours ?? 0),
    stops: relativeStops.map((stop) => ({
      place_name: placeNames.get(stop.place_id) ?? '',
      day_index: stop.day_index,
      offset_minutes: stop.offset_minutes,
    })),
  }
}

export async function importSharedItinerary(
  supabase: SupabaseClient,
  shareCode: string,
  userId: string,
  input: ImportSharedRequest,
): Promise<string> {
  const { data, error } = await supabase.rpc('import_shared_itinerary', {
    p_share_code: shareCode,
    p_user_id: userId,
    p_start_at: input.start_at,
    p_transport_mode: input.transport_mode,
    p_origin_lat: input.origin_lat,
    p_origin_lng: input.origin_lng,
    p_origin_name: input.origin_name,
  })

  if (error) throw error
  return data as string
}
