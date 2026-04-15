/**
 * Places 읽기 쿼리 — Supabase server client 사용
 *
 * DB 컬럼명과 API 타입 간 차이를 여기서 변환한다.
 * - DB: day (enum 'mon'..'sun') -> API: day_of_week (0=Sun..6=Sat)
 * - DB: website -> API: website_url
 * - DB: images[0] -> API: thumbnail_url
 * - DB: place_visit_profile.dwell_minutes -> API: typical_dwell_minutes
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PlaceSummary,
  PlaceDetail,
  PlaceHours,
  BreakWindow,
  GetPlacesParams,
} from '@tripcart/types'

// ── day_of_week 변환 ────────────────────────────────────────────

const DAY_ENUM_TO_NUMBER: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

function toDayNumber(day: string): number {
  const n = DAY_ENUM_TO_NUMBER[day]
  if (n === undefined) {
    console.warn(`[places] Unknown day enum value: ${day}`)
    return -1
  }
  return n
}

// ── 입력 검증 ────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── 목록 조회 ────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/** 목록 응답에 쓰이는 확장 필드 (PlaceSummary + 추가 필드) */
export interface PlaceListItem extends PlaceSummary {
  address: string | null
  tags: string[]
  data_quality_score: number
  is_open_now: boolean | null
  next_break: string | null
}

export async function getPlaces(
  supabase: SupabaseClient,
  params: GetPlacesParams,
) {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

  let query = supabase
    .from('places')
    .select(
      'id, name, category, lat, lng, region, address, images, tags, data_quality_score, created_at',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1) // +1 으로 has_more 판별

  // 필터
  if (params.region) {
    query = query.eq('region', params.region)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.q) {
    // LIKE 특수문자 이스케이프
    const escapedQ = params.q.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('name', `%${escapedQ}%`)
  }
  if (params.tags) {
    // tags 파라미터: 쉼표 구분 문자열 -> 배열 overlap
    const tagArr = params.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tagArr.length > 0) {
      query = query.overlaps('tags', tagArr)
    }
  }

  // cursor: "created_at|id" 형태 — 입력 검증 필수
  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split('|')
    if (cursorDate && cursorId && ISO_DATE_RE.test(cursorDate) && UUID_RE.test(cursorId)) {
      query = query.or(
        `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`,
      )
    }
    // 형식이 맞지 않으면 cursor를 무시 (첫 페이지부터 시작)
  }

  const { data, error } = await query

  if (error) throw error

  const hasMore = (data?.length ?? 0) > limit
  const items = hasMore ? data!.slice(0, limit) : (data ?? [])

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1]!
    nextCursor = `${last.created_at}|${last.id}`
  }

  const mapped: PlaceListItem[] = items.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    lat: Number(row.lat),
    lng: Number(row.lng),
    region: row.region,
    thumbnail_url: (row.images as string[])?.[0] ?? null,
    address: row.address || null,
    tags: row.tags ?? [],
    data_quality_score: row.data_quality_score ?? 0,
    is_open_now: null, // Phase 2에서 실시간 계산 구현
    next_break: null, // Phase 2에서 실시간 계산 구현
  }))

  return { data: mapped, cursor: nextCursor, hasMore }
}

// ── 상세 조회 ────────────────────────────────────────────────────

export async function getPlaceById(
  supabase: SupabaseClient,
  id: string,
): Promise<PlaceDetail | null> {
  // 장소 기본 정보
  const { data: place, error: placeError } = await supabase
    .from('places')
    .select(
      'id, name, category, lat, lng, region, address, phone, website, description, naver_place_id, kakao_place_id, images, tags, data_quality_score',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (placeError) {
    if (placeError.code === 'PGRST116') return null // not found
    throw placeError // DB 에러는 상위로 전파
  }
  if (!place) return null

  // 관련 테이블 병렬 조회
  const [hoursResult, breaksResult, profileResult] = await Promise.all([
    supabase
      .from('place_hours')
      .select('day, is_closed, open_time, close_time')
      .eq('place_id', id)
      .eq('is_closed', false),
    supabase
      .from('place_break_windows')
      .select('day, break_start, break_end, last_order')
      .eq('place_id', id),
    supabase
      .from('place_visit_profile')
      .select('dwell_minutes, min_dwell, max_dwell, parking_needed')
      .eq('place_id', id)
      .maybeSingle(),
  ])

  // day_of_week enum -> number 변환 + 시간 포맷 + 알 수 없는 day 필터
  const openHours: PlaceHours[] = (hoursResult.data ?? [])
    .map((h) => ({
      day_of_week: toDayNumber(h.day),
      open_time: formatTime(h.open_time),
      close_time: formatTime(h.close_time),
      last_order_time: null, // place_hours에는 last_order 없음
    }))
    .filter((h) => h.day_of_week >= 0)

  const breakWindows: BreakWindow[] = (breaksResult.data ?? [])
    .map((b) => {
      const startTime = formatTime(b.break_start)
      const endTime = formatTime(b.break_end)
      return {
        day_of_week: toDayNumber(b.day),
        ...(startTime !== null && { start_time: startTime }),
        ...(endTime !== null && { end_time: endTime }),
      }
    })
    .filter((b) => b.day_of_week >= 0)

  return {
    id: place.id,
    name: place.name,
    category: place.category,
    lat: Number(place.lat),
    lng: Number(place.lng),
    region: place.region,
    thumbnail_url: (place.images as string[])?.[0] ?? null,
    address: place.address || null,
    phone: place.phone ?? null,
    website_url: place.website ?? null,
    naver_place_id: place.naver_place_id ?? null,
    kakao_place_id: place.kakao_place_id ?? null,
    data_quality_score: place.data_quality_score ?? 0,
    open_hours: openHours,
    break_windows: breakWindows,
    typical_dwell_minutes: profileResult.data?.dwell_minutes ?? null,
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────

/** time 타입 (HH:MM:SS) → HH:MM 포맷. null이면 null 반환 */
function formatTime(t: string | null): string | null {
  if (!t) return null
  // PostgreSQL time은 "HH:MM:SS" 형태
  return t.slice(0, 5)
}
