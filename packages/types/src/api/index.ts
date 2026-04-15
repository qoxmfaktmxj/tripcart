/**
 * Shared API DTOs
 * Canonical source: API_CONTRACT_v0.2.md
 */

import type {
  PlaceCategory,
  ShareVisibility,
  SpendCategory,
  StopVisitStatus,
  TransportMode,
  UUID,
} from '../domain/index.js'

export interface GetPlacesParams {
  region?: string
  category?: PlaceCategory
  q?: string
  tags?: string
  cursor?: string
  limit?: number
}

export interface CreateSavedPlaceRequest {
  place_id: UUID
  note?: string
}

export interface UpdateSavedPlaceRequest {
  note?: string
}

export interface CreatePlanRequest {
  title?: string
  region: string
  start_at?: string
  end_at?: string
  transport_mode?: TransportMode
  origin_lat?: number
  origin_lng?: number
  origin_name?: string
  dest_lat?: number
  dest_lng?: number
  dest_name?: string
}

export interface UpdatePlanRequest {
  title?: string
  start_at?: string
  end_at?: string
  transport_mode?: TransportMode
  origin_lat?: number
  origin_lng?: number
  origin_name?: string
  dest_lat?: number
  dest_lng?: number
  dest_name?: string
}

export interface AddStopRequest {
  place_id: UUID
  stop_order?: number
  dwell_minutes?: number
  locked?: boolean
}

export interface ReorderStopsRequest {
  ordered_stop_ids: UUID[]
}

export interface OptimizePlanRequest {
  locked_stop_ids?: UUID[]
  objective?: 'min_travel' | 'max_places' | 'balanced'
  allow_alternatives?: boolean
}

export interface StartExecutionRequest {
  plan_id: UUID
}

export interface UpdateStopVisitRequest {
  visit_status: StopVisitStatus
  arrived_at?: string
  departed_at?: string
  note?: string
}

export interface CreateSpendRequest {
  execution_id: UUID
  execution_stop_id?: UUID
  category: SpendCategory
  total_amount: number
  note?: string
  spent_at?: string
}

export interface CreateShareRequest {
  visibility: ShareVisibility
  title?: string
  description?: string
}

export interface ImportSharedRequest {
  start_at: string
  transport_mode: 'car' | 'transit' | 'walk' | 'bicycle'
  origin_lat: number
  origin_lng: number
  origin_name: string
}

export interface RegisterPushTokenRequest {
  push_token: string
  platform: 'ios' | 'android'
  device_name?: string
}
