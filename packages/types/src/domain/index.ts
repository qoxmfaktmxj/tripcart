/**
 * TripCart 도메인 타입 정의
 * API Contract v0.2 / Schema v0.3 기반
 */

// ── 공통 ─────────────────────────────────────────────────────

export type UUID = string
export type ISODateString = string // ISO 8601 + timezone

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'attraction'
  | 'accommodation'
  | 'shopping'
  | 'other'

export type TravelMode = 'car' | 'transit' | 'walk' | 'bicycle'

export type WarningSeverity = 'low' | 'medium' | 'high'

export type WarningType =
  | 'break_time_conflict'
  | 'last_order_passed'
  | 'closed'
  | 'travel_time_tight'
  | 'overnight'

export type PlanStatus = 'draft' | 'optimized' | 'confirmed' | 'archived'

export type ExecutionStatus = 'active' | 'completed' | 'abandoned'

export type StopVisitStatus = 'pending' | 'visited' | 'skipped'

export type SpendCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'shopping'
  | 'attraction'
  | 'other'

export type SharedAccessLevel = 'public' | 'link_only' | 'private'

// ── Place ─────────────────────────────────────────────────────

export interface PlaceSummary {
  id: UUID
  name: string
  category: PlaceCategory
  lat: number
  lng: number
  region: string
  thumbnail_url: string | null
}

export interface PlaceDetail extends PlaceSummary {
  address: string | null
  phone: string | null
  website_url: string | null
  naver_place_id: string | null
  kakao_place_id: string | null
  data_quality_score: number
  open_hours: PlaceHours[]
  break_windows: BreakWindow[]
  typical_dwell_minutes: number | null
}

export interface PlaceHours {
  day_of_week: number // 0=Sun, 6=Sat
  open_time: string // HH:MM
  close_time: string // HH:MM
  last_order_time: string | null
}

export interface BreakWindow {
  day_of_week: number
  start_time: string // HH:MM
  end_time: string // HH:MM
}

// ── Saved Place ───────────────────────────────────────────────

export interface SavedPlace {
  id: UUID
  user_id: UUID
  place: PlaceSummary
  note: string | null
  visited: boolean
  created_at: ISODateString
}

// ── Trip Plan ─────────────────────────────────────────────────

export interface TripPlan {
  id: UUID
  user_id: UUID
  title: string
  travel_date: string | null // YYYY-MM-DD
  region: string | null
  travel_mode: TravelMode
  status: PlanStatus
  origin_lat: number | null
  origin_lng: number | null
  stops: PlanStop[]
  warning_count: number
  created_at: ISODateString
  updated_at: ISODateString
}

export interface PlanStop {
  id: UUID
  place_id: UUID
  place: PlaceSummary
  stop_order: number
  locked: boolean
  dwell_minutes: number
  arrive_at: ISODateString | null
  leave_at: ISODateString | null
  travel_from_prev_minutes: number | null
  travel_from_prev_meters: number | null
  warnings: Warning[]
}

// ── Warning ───────────────────────────────────────────────────

export interface Warning {
  type: WarningType
  place_id: UUID
  message: string
  severity: WarningSeverity
}

// ── Trip Execution ────────────────────────────────────────────

export interface TripExecution {
  id: UUID
  plan_id: UUID
  user_id: UUID
  status: ExecutionStatus
  started_at: ISODateString
  ended_at: ISODateString | null
  stops: ExecutionStop[]
}

export interface ExecutionStop {
  id: UUID
  plan_stop_id: UUID
  place: PlaceSummary
  visit_status: StopVisitStatus
  arrived_at: ISODateString | null
  departed_at: ISODateString | null
  note: string | null
}

// ── Spend ─────────────────────────────────────────────────────

export interface TripSpend {
  id: UUID
  execution_id: UUID
  execution_stop_id: UUID | null
  category: SpendCategory
  amount: number // KRW
  note: string | null
  spent_at: ISODateString
}

// ── Shared Itinerary ──────────────────────────────────────────

export interface SharedItinerary {
  id: UUID
  share_token: string
  plan_id: UUID
  creator: {
    id: UUID
    display_name: string | null
  }
  title: string
  region: string | null
  stop_count: number
  access_level: SharedAccessLevel
  expires_at: ISODateString | null
  created_at: ISODateString
}

// ── API Common ────────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    cursor: string | null
    has_more: boolean
  }
}

// ── Error Codes ───────────────────────────────────────────────

export const ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NOT_OWNER: 'NOT_OWNER',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  PLAN_NOT_CONFIRMED: 'PLAN_NOT_CONFIRMED',
  PLAN_IN_PROGRESS: 'PLAN_IN_PROGRESS',
  EXECUTION_NOT_FOUND: 'EXECUTION_NOT_FOUND',
  EXECUTION_ALREADY_ACTIVE: 'EXECUTION_ALREADY_ACTIVE',
  INVALID_FIELD: 'INVALID_FIELD',
  INVALID_STOP_IDS: 'INVALID_STOP_IDS',
  LOCKED_POSITION_VIOLATED: 'LOCKED_POSITION_VIOLATED',
  NOT_OPTIMIZED: 'NOT_OPTIMIZED',
  BREAK_TIME_CONFLICT: 'BREAK_TIME_CONFLICT',
  LAST_ORDER_PASSED: 'LAST_ORDER_PASSED',
  SHARED_NOT_FOUND: 'SHARED_NOT_FOUND',
  SHARED_PRIVATE: 'SHARED_PRIVATE',
  DUPLICATE_TOKEN: 'DUPLICATE_TOKEN',
  RECEIPT_PARSE_FAILED: 'RECEIPT_PARSE_FAILED',
  STORAGE_UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
