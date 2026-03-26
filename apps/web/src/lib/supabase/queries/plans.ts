/**
 * Trip Plans CRUD 쿼리 — Supabase server client 사용
 *
 * trip_plans + trip_plan_stops 테이블 대상.
 * RLS가 user_id = auth.uid()를 강제하지만, defense in depth로 쿼리에도 명시적 필터.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TripPlan, PlanStop, PlaceSummary, TravelMode } from '@tripcart/types'

// ── 입력 검증 ────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── 공통 ─────────────────────────────────────────────────────────

const PLAN_SELECT = `
  id, user_id, title, start_at, region, transport_mode, status,
  origin_lat, origin_lng, origin_name, version, optimization_meta,
  created_at, updated_at
`

const STOP_SELECT = `
  id, plan_id, place_id, stop_order, locked, locked_position,
  dwell_minutes, arrive_at, leave_at,
  travel_from_prev_minutes, travel_from_prev_meters,
  warnings, user_note,
  places:place_id (id, name, category, lat, lng, region, images)
`

// ── active execution 체크 ────────────────────────────────────────

export async function hasActiveExecution(
  supabase: SupabaseClient,
  planId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('trip_executions')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .eq('status', 'active')
  return (count ?? 0) > 0
}

// ── DB row → PlanStop 변환 ───────────────────────────────────────

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

// ── DB row → TripPlan 변환 (stops 별도) ──────────────────────────

function toPlan(
  row: Record<string, unknown>,
  stops: PlanStop[],
  activeExecution: boolean,
  alternativesCount: number,
): TripPlan {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    start_at: (row.start_at as string) ?? null,
    region: (row.region as string) ?? null,
    transport_mode: (row.transport_mode as TravelMode) ?? 'car',
    status: row.status as TripPlan['status'],
    origin_lat: row.origin_lat != null ? Number(row.origin_lat) : null,
    origin_lng: row.origin_lng != null ? Number(row.origin_lng) : null,
    origin_name: (row.origin_name as string) ?? null,
    version: (row.version as number) ?? 1,
    optimization_meta: (row.optimization_meta as Record<string, unknown>) ?? null,
    has_active_execution: activeExecution,
    alternatives_count: alternativesCount,
    stops,
    warning_count: stops.reduce((acc, s) => acc + s.warnings.length, 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

// ── 목록 조회 (cursor pagination) ────────────────────────────────

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function getPlans(
  supabase: SupabaseClient,
  userId: string,
  params: { cursor?: string; limit?: number },
) {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

  let query = supabase
    .from('trip_plans')
    .select(PLAN_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split('|')
    if (cursorDate && cursorId && ISO_DATE_RE.test(cursorDate) && UUID_RE.test(cursorId)) {
      query = query.or(
        `updated_at.lt.${cursorDate},and(updated_at.eq.${cursorDate},id.lt.${cursorId})`,
      )
    }
  }

  const { data, error } = await query
  if (error) throw error

  const hasMore = (data?.length ?? 0) > limit
  const items = hasMore ? data!.slice(0, limit) : (data ?? [])

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1]!
    nextCursor = `${last.updated_at}|${last.id}`
  }

  // 목록에서는 stops를 포함하지 않고, 경량 응답 반환
  const mapped = items.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    start_at: row.start_at ?? null,
    region: row.region ?? null,
    transport_mode: row.transport_mode ?? 'car',
    status: row.status,
    origin_lat: row.origin_lat != null ? Number(row.origin_lat) : null,
    origin_lng: row.origin_lng != null ? Number(row.origin_lng) : null,
    origin_name: row.origin_name ?? null,
    version: row.version ?? 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  return { data: mapped, cursor: nextCursor, hasMore }
}

// ── 상세 조회 (stops 포함) ───────────────────────────────────────

export async function getPlanById(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
): Promise<TripPlan | null> {
  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .select(PLAN_SELECT)
    .eq('id', planId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (planError) {
    if (planError.code === 'PGRST116') return null
    throw planError
  }
  if (!plan) return null

  // stops + active execution + alternatives 병렬 조회
  const [stopsResult, executionResult, alternativesResult] = await Promise.all([
    supabase
      .from('trip_plan_stops')
      .select(STOP_SELECT)
      .eq('plan_id', planId)
      .order('stop_order', { ascending: true }),
    supabase
      .from('trip_executions')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('status', 'active'),
    supabase
      .from('trip_plan_alternatives')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId),
  ])

  if (stopsResult.error) throw stopsResult.error

  const stops = (stopsResult.data ?? []).map((row) =>
    toStop(row as unknown as Record<string, unknown>),
  )

  return toPlan(
    plan as unknown as Record<string, unknown>,
    stops,
    (executionResult.count ?? 0) > 0,
    alternativesResult.count ?? 0,
  )
}

// ── 생성 ─────────────────────────────────────────────────────────

export async function createPlan(
  supabase: SupabaseClient,
  userId: string,
  input: {
    title: string
    start_at?: string
    region: string
    transport_mode?: TravelMode
    origin_lat?: number
    origin_lng?: number
    origin_name?: string
  },
): Promise<TripPlan> {
  const { data, error } = await supabase
    .from('trip_plans')
    .insert({
      user_id: userId,
      title: input.title,
      start_at: input.start_at ?? null,
      region: input.region,
      transport_mode: input.transport_mode ?? 'car',
      origin_lat: input.origin_lat ?? null,
      origin_lng: input.origin_lng ?? null,
      origin_name: input.origin_name ?? null,
      status: 'draft',
      version: 1,
    })
    .select(PLAN_SELECT)
    .single()

  if (error) throw error

  return toPlan(data as unknown as Record<string, unknown>, [], false, 0)
}

// ── 수정 (status→draft, version++) ───────────────────────────────

export async function updatePlan(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  input: {
    title?: string
    start_at?: string | null
    transport_mode?: TravelMode
    origin_lat?: number
    origin_lng?: number
    origin_name?: string
  },
): Promise<TripPlan | null> {
  // 필드 업데이트 (version 제외)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) updateData.title = input.title
  if (input.start_at !== undefined) updateData.start_at = input.start_at
  if (input.transport_mode !== undefined) updateData.transport_mode = input.transport_mode
  if (input.origin_lat !== undefined) updateData.origin_lat = input.origin_lat
  if (input.origin_lng !== undefined) updateData.origin_lng = input.origin_lng
  if (input.origin_name !== undefined) updateData.origin_name = input.origin_name

  const { data: updated, error: updateError } = await supabase
    .from('trip_plans')
    .update(updateData)
    .eq('id', planId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id')

  if (updateError) throw updateError
  if (!updated || updated.length === 0) return null

  // 원자적 status→draft + version++ (race condition 방지)
  await resetPlanToDraft(supabase, planId)

  // 변경된 plan 전체 반환
  return getPlanById(supabase, userId, planId)
}

// ── soft delete ──────────────────────────────────────────────────

export async function softDeletePlan(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('trip_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id')

  if (error) throw error

  return (data?.length ?? 0) > 0
}

// ── plan 소유권 확인 (stops 관리용) ──────────────────────────────

export async function verifyPlanOwnership(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
): Promise<{ exists: boolean; owned: boolean }> {
  const { data, error } = await supabase
    .from('trip_plans')
    .select('id, user_id')
    .eq('id', planId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { exists: false, owned: false }
    throw error
  }
  if (!data) return { exists: false, owned: false }

  return { exists: true, owned: data.user_id === userId }
}

// ── plan status→draft, version++ (stop 변경 시 호출) ─────────────

export async function resetPlanToDraft(
  supabase: SupabaseClient,
  planId: string,
): Promise<void> {
  // 원자적 version increment — RPC 사용 (race condition 방지)
  const { error } = await supabase.rpc('reset_plan_to_draft', {
    p_plan_id: planId,
  })
  if (error) throw error
}
