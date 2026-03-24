/**
 * API Request/Response DTO 타입
 * API Contract v0.2 기반
 */

import type {
  UUID,
  TravelMode,
  PlaceCategory,
  StopVisitStatus,
  SpendCategory,
  SharedAccessLevel,
} from '../domain/index.js'

// ── Places API ────────────────────────────────────────────────

export interface GetPlacesParams {
  region?: string
  category?: PlaceCategory
  q?: string
  cursor?: string
  limit?: number
}

// ── Saved Places API ──────────────────────────────────────────

export interface CreateSavedPlaceRequest {
  place_id: UUID
  note?: string
}

export interface UpdateSavedPlaceRequest {
  note?: string
  visited?: boolean
}

// ── Trip Plans API ────────────────────────────────────────────

export interface CreatePlanRequest {
  title: string
  travel_date?: string // YYYY-MM-DD
  region?: string
  travel_mode?: TravelMode
  origin_lat?: number
  origin_lng?: number
}

export interface UpdatePlanRequest {
  title?: string
  travel_date?: string
  travel_mode?: TravelMode
  origin_lat?: number
  origin_lng?: number
}

export interface AddStopRequest {
  place_id: UUID
  stop_order?: number
  dwell_minutes?: number
  locked?: boolean
}

export interface ReorderStopsRequest {
  stop_ids: UUID[] // 새로운 순서
}

// ── Optimize API ──────────────────────────────────────────────

export interface OptimizeRequest {
  plan_id: UUID
  travel_date: string // YYYY-MM-DD
  start_time: string // HH:MM
}

// ── Execution API ─────────────────────────────────────────────

export interface StartExecutionRequest {
  plan_id: UUID
}

export interface UpdateStopVisitRequest {
  visit_status: StopVisitStatus
  arrived_at?: string // ISO 8601
  departed_at?: string // ISO 8601
  note?: string
}

// ── Spend API ─────────────────────────────────────────────────

export interface CreateSpendRequest {
  execution_id: UUID
  execution_stop_id?: UUID
  category: SpendCategory
  amount: number
  note?: string
  spent_at?: string // ISO 8601
}

// ── Shared Itinerary API ──────────────────────────────────────

export interface CreateShareRequest {
  plan_id: UUID
  access_level?: SharedAccessLevel
  expires_in_days?: number
}

export interface ImportSharedRequest {
  share_token: string
  travel_date?: string // YYYY-MM-DD
}

// ── Push API ──────────────────────────────────────────────────

export interface RegisterPushTokenRequest {
  push_token: string // ExponentPushToken[xxxx]
  platform: 'ios' | 'android'
}
