/**
 * Plan Stops 쿼리 — Supabase server client 사용
 *
 * trip_plan_stops 테이블 대상.
 * Plan 소유권 검증은 호출자(route handler)에서 수행한다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStop, PlaceSummary } from '@tripcart/types'

// ── 공통 ─────────────────────────────────────────────────────────

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
  const { data, error } = await supabase.rpc('add_plan_stop', {
    p_plan_id: planId,
    p_place_id: input.place_id,
    p_dwell_minutes: input.dwell_minutes ?? 60,
    p_locked: input.locked ?? false,
  })

  if (error) throw error

  return toStop(data as unknown as Record<string, unknown>)
}

// ── stop 삭제 + order 재정렬 (RPC 호출) ─────────────────────────

export async function removeStop(
  supabase: SupabaseClient,
  planId: string,
  stopId: string,
): Promise<boolean> {
  const { error } = await supabase.rpc('remove_plan_stop', {
    p_plan_id: planId,
    p_stop_id: stopId,
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
  const patch: Record<string, unknown> = {}
  if (input.dwell_minutes !== undefined) patch.dwell_minutes = input.dwell_minutes
  if (input.locked !== undefined) patch.locked = input.locked
  if (input.user_note !== undefined) patch.user_note = input.user_note

  const { data, error } = await supabase.rpc('update_plan_stop', {
    p_plan_id: planId,
    p_stop_id: stopId,
    p_patch: patch,
  })

  if (error) {
    if (error.message?.includes('STOP_NOT_FOUND')) return null
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
