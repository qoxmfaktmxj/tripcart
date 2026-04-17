/**
 * TripCart domain types
 * Canonical source: API_CONTRACT_v0.2.md / tripcart_schema_canonical_v0.3.sql
 */

export type UUID = string
export type ISODateString = string

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'attraction'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other'

export type TransportMode = 'car' | 'transit' | 'walk' | 'bicycle'
export type TravelMode = TransportMode

export type WarningSeverity = 'low' | 'medium' | 'high'

export type WarningType =
  | 'break_time_conflict'
  | 'last_order_passed'
  | 'closed'
  | 'travel_time_tight'
  | 'overnight'

export type PlanStatus =
  | 'draft'
  | 'optimized'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type ExecutionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export type StopVisitStatus = 'pending' | 'visited' | 'skipped'

export type SpendCategory =
  | 'food'
  | 'cafe'
  | 'admission'
  | 'transport'
  | 'shopping'
  | 'accommodation'
  | 'other'

export type ShareVisibility = 'public' | 'link_only' | 'private'
export type SharedAccessLevel = ShareVisibility

export interface LocationPoint {
  lat: number
  lng: number
  name?: string | null
}

export interface Warning {
  type: WarningType
  place_id: UUID
  message: string
  severity: WarningSeverity
}

export interface PlaceSummary {
  id: UUID
  name: string
  category: PlaceCategory
  lat: number
  lng: number
  region: string
  thumbnail_url: string | null
}

export interface PlaceHour {
  day?: DayOfWeek
  is_closed?: boolean
  open_time: string | null
  close_time: string | null
  crosses_midnight?: boolean
  day_of_week?: number
  last_order_time?: string | null
}

export interface BreakWindow {
  day?: DayOfWeek
  break_start?: string
  break_end?: string
  last_order?: string | null
  day_of_week?: number
  start_time?: string
  end_time?: string
}

export type PlaceHours = PlaceHour

export interface VisitProfile {
  dwell_minutes: number
  min_dwell: number
  max_dwell: number
  parking_needed: boolean
  parking_note?: string | null
  rain_friendly?: boolean | null
  kid_friendly?: boolean | null
  wheelchair_ok?: boolean | null
  peak_hours_note?: string | null
}

export interface PlaceDetail extends PlaceSummary {
  address: string
  phone: string | null
  website?: string | null
  website_url?: string | null
  naver_place_id?: string | null
  kakao_place_id?: string | null
  description?: string
  tags?: string
  data_quality_score: number
  hours?: PlaceHour[]
  open_hours?: PlaceHour[]
  break_windows: BreakWindow[]
  visit_profile?: VisitProfile | null
  typical_dwell_minutes?: number | null
}

export interface SavedPlace {
  id: UUID
  user_id: UUID
  place: PlaceSummary
  note: string | null
  visited?: boolean
  created_at: ISODateString
}

export interface PlanStop {
  id: UUID
  place_id: UUID
  place: {
    id: UUID
    name: string
    category: PlaceCategory
    lat: number
    lng: number
  }
  stop_order: number
  locked: boolean
  locked_position?: number | null
  dwell_minutes: number
  arrive_at: ISODateString | null
  leave_at: ISODateString | null
  travel_from_prev_minutes: number | null
  travel_from_prev_meters: number | null
  warnings: Array<Warning | string>
  user_note?: string | null
}

export interface TripPlan {
  id: UUID
  user_id: UUID
  title: string
  region: string | null
  start_at: ISODateString | null
  end_at?: ISODateString | null
  transport_mode: TransportMode
  status: PlanStatus
  origin?: LocationPoint | null
  destination?: LocationPoint | null
  warning_count: number
  version?: number
  optimization_meta?: Record<string, unknown> | null
  has_active_execution?: boolean
  alternatives_count?: number
  origin_lat?: number | null
  origin_lng?: number | null
  origin_name?: string | null
  dest_lat?: number | null
  dest_lng?: number | null
  dest_name?: string | null
  stops: PlanStop[]
  created_at: ISODateString
  updated_at: ISODateString
}

export interface ExecutionStop {
  id: UUID
  stop_order: number
  place_id: UUID
  place_name: string
  planned_arrive_at: ISODateString | null
  planned_leave_at: ISODateString | null
  arrive_at: ISODateString | null
  leave_at: ISODateString | null
  skipped: boolean
  skip_reason?: string | null
  is_adhoc: boolean
}

export interface TripExecution {
  id: UUID
  plan_id: UUID
  user_id: UUID
  status: ExecutionStatus
  started_at: ISODateString | null
  ended_at: ISODateString | null
  delay_minutes?: number
  reopt_count?: number
  stops: ExecutionStop[]
}

export interface TripSpend {
  id: UUID
  execution_id: UUID
  stop_id: UUID | null
  category: SpendCategory
  total_amount: number
  occurred_at: ISODateString
}

export interface SharedItinerary {
  id: UUID
  share_code: string
  plan_id: UUID
  creator: {
    id: UUID
    display_name: string | null
  }
  title: string
  region: string
  stop_count: number
  visibility: ShareVisibility
  expires_at: ISODateString | null
  created_at: ISODateString
}

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
  GUEST_MIGRATION_PARTIAL: 'GUEST_MIGRATION_PARTIAL',
  GUEST_MIGRATION_FAILED: 'GUEST_MIGRATION_FAILED',
  DUPLICATE_PLAN_TITLE: 'DUPLICATE_PLAN_TITLE',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
