/**
 * Plan Stops 쿼리 — Supabase server client 사용
 *
 * trip_plan_stops 테이블 대상.
 * Plan 소유권 검증은 호출자(route handler)에서 수행한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStop, PlaceSummary } from '@tripcart/types'

// ── 공통 ─────────────────────────────────────────────────────────

const STOP_SELECT = `
  id, plan_id, place_id, stop_order, locked, locked_position,
  dwell_minutes, arrive_at, leave_at,
  travel_from_prev_minutes, travel_from_prev_meters,
  warnings, user_note,
  places:place_id (id, name, category, lat, lng, region, images)
`

function toStop(row: Record<string, unknown>): PlanStop {
  const p = row.places as unknown as Record<string, unknown> | null
  const place: PlaceSummary = {
    id: (p?.id as string) ?? (row.place_id as string),
    name: (p?.name as string) ?? '',
    category: (p?.category as PlaceSummary['category']) ?? 'other',
    lat: Number(p?.lat ?? 0),
    lng: Number(p?.lng ?? 0),
    region: (p?.region as string) ?? '',
    thumbnail_url: ((p?.images as string[]) ?? [])[0] ?? null,
  }
  return {
    id: row.id as string,
    place_id: row.place_id as string,
    place,
    stop_order: row.stop_order as number,
    locked: row.locked as boolean,
    locked_position: (row.locked_position as number) ?? null,
    dwell_minutes: row.dwell_minutes as number,
    arrive_at: (row.arrive_at as string) ?? null,
    leave_at: (row.leave_at as string) ?? null,
    travel_from_prev_minutes: (row.travel_from_prev_minutes as number) ?? null,
    travel_from_prev_meters: (row.travel_from_prev_meters as number) ?? null,
    warnings: (row.warnings as string[]) ?? [],
    user_note: (row.user_note as string) ?? null,
  }
}

// ── stop 추가 (stop_order = max+1) ──────────────────────────────

export async function addStop(
  supabase: SupabaseClient,
  planId: string,
  input: {
    place_id: string
    dwell_minutes?: number
    locked?: boolean
  },
): Promise<PlanStop> {
  // max stop_order 가져오기
  const { data: maxRow } = await supabase
    .from('trip_plan_stops')
    .select('stop_order')
    .eq('plan_id', planId)
    .order('stop_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = ((maxRow?.stop_order as number) ?? 0) + 1

  const { data, error } = await supabase
    .from('trip_plan_stops')
    .insert({
      plan_id: planId,
      place_id: input.place_id,
      stop_order: nextOrder,
      dwell_minutes: input.dwell_minutes ?? 60,
      locked: input.locked ?? false,
      locked_position: input.locked ? nextOrder : null,
    })
    .select(STOP_SELECT)
    .single()

  if (error) throw error

  return toStop(data as unknown as Record<string, unknown>)
}

// ── stop 삭제 + order 재정렬 (RPC 호출) ─────────────────────────

export async function removeStop(
  supabase: SupabaseClient,
  planId: string,
  stopId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc('remove_plan_stop', {
    p_plan_id: planId,
    p_stop_id: stopId,
    p_user_id: userId,
  })

  if (error) {
    if (error.message === 'PLAN_NOT_FOUND' || error.message === 'NOT_OWNER') {
      return false
    }
    if (error.message === 'STOP_NOT_FOUND') {
      return false
    }
    throw error
  }

  return true
}

// ── stop 수정 (dwell_minutes, locked, user_note) ────────────────

export async function updateStop(
  supabase: SupabaseClient,
  planId: string,
  stopId: string,
  input: {
    dwell_minutes?: number
    locked?: boolean
    user_note?: string | null
  },
): Promise<PlanStop | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.dwell_minutes !== undefined) updateData.dwell_minutes = input.dwell_minutes
  if (input.locked !== undefined) {
    updateData.locked = input.locked
    // locked=true면 현재 stop_order를 locked_position으로 설정
    if (input.locked) {
      const { data: currentStop } = await supabase
        .from('trip_plan_stops')
        .select('stop_order')
        .eq('id', stopId)
        .eq('plan_id', planId)
        .single()
      if (currentStop) {
        updateData.locked_position = currentStop.stop_order
      }
    } else {
      updateData.locked_position = null
    }
  }
  if (input.user_note !== undefined) updateData.user_note = input.user_note

  const { data, error } = await supabase
    .from('trip_plan_stops')
    .update(updateData)
    .eq('id', stopId)
    .eq('plan_id', planId)
    .select(STOP_SELECT)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return toStop(data as unknown as Record<string, unknown>)
}

// ── reorder (RPC 호출) ───────────────────────────────────────────

export async function reorderStops(
  supabase: SupabaseClient,
  planId: string,
  orderedStopIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc('reorder_plan_stops', {
    p_plan_id: planId,
    p_ordered_stop_ids: orderedStopIds,
  })

  if (error) throw error
}
