/**
 * Saved Places CRUD 쿼리 — Supabase server client 사용
 *
 * user_saved_places 테이블 대상.
 * RLS가 user_id = auth.uid()를 강제하지만, defense in depth로 쿼리에도 명시적 필터.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SavedPlace, PlaceSummary } from '@tripcart/types'

// ── 공통 ─────────────────────────────────────────────────────────

const SAVED_PLACE_SELECT = `
  id, user_id, place_id, note, created_at,
  places:place_id (id, name, category, lat, lng, region, images)
`

/** DB row → SavedPlace 변환 */
function toSavedPlace(
  row: Record<string, unknown>,
  fallbackPlaceId: string,
): SavedPlace {
  const p = row.places as unknown as Record<string, unknown> | null
  const place: PlaceSummary = {
    id: (p?.id as string) ?? fallbackPlaceId,
    name: (p?.name as string) ?? '',
    category: (p?.category as PlaceSummary['category']) ?? 'other',
    lat: Number(p?.lat ?? 0),
    lng: Number(p?.lng ?? 0),
    region: (p?.region as string) ?? '',
    thumbnail_url: ((p?.images as string[]) ?? [])[0] ?? null,
  }
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    place,
    note: (row.note as string | null) ?? null,
    // DB에 visited 컬럼 없음 (canonical v0.3). 타입 호환을 위해 항상 false.
    visited: false,
    created_at: row.created_at as string,
  }
}

// ── 목록 조회 ────────────────────────────────────────────────────

export async function getSavedPlaces(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedPlace[]> {
  const { data, error } = await supabase
    .from('user_saved_places')
    .select(SAVED_PLACE_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => toSavedPlace(row, row.place_id as string))
}

// ── 저장 추가 ────────────────────────────────────────────────────

export async function addSavedPlace(
  supabase: SupabaseClient,
  userId: string,
  placeId: string,
  note?: string | null,
): Promise<SavedPlace> {
  const { data, error } = await supabase
    .from('user_saved_places')
    .insert({ user_id: userId, place_id: placeId, note: note ?? null })
    .select(SAVED_PLACE_SELECT)
    .single()

  if (error) throw error

  return toSavedPlace(data, placeId)
}

// ── 저장 해제 ────────────────────────────────────────────────────

/**
 * 저장 해제. 존재하지 않아도 에러를 던지지 않음 (idempotent).
 * @returns 삭제된 행 수 (0 또는 1)
 */
export async function removeSavedPlace(
  supabase: SupabaseClient,
  userId: string,
  placeId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('user_saved_places')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .select('id')

  if (error) throw error

  return data?.length ?? 0
}
