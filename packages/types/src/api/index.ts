/**
 * Shared API DTOs
 * Canonical source: API_CONTRACT_v0.2.md
 */

import type {
  ExecutionStatus,
  ISODateString,
  LocationPoint,
  PlanStatus,
  PlaceCategory,
  PlanStop,
  ShareVisibility,
  SpendCategory,
  TransportMode,
  TripExecution,
  TripPlan,
  UUID,
  Warning,
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
  title: string
  region: string
  start_at: ISODateString
  end_at?: ISODateString
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
  start_at?: ISODateString | null
  end_at?: ISODateString | null
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

export interface AddStopResponse {
  data: PlanStop
}

export interface UpdatePlanStopRequest {
  dwell_minutes?: number
  locked?: boolean
  user_note?: string | null
}

export interface UpdatePlanStopResponse {
  data: PlanStop
}

export interface ReorderStopsRequest {
  ordered_stop_ids: UUID[]
}

export interface CreatePlanResponse {
  data: Pick<
    TripPlan,
    | 'id'
    | 'title'
    | 'region'
    | 'transport_mode'
    | 'start_at'
    | 'status'
    | 'version'
    | 'created_at'
  > & {
    origin_name: string | null
    visibility: ShareVisibility
  }
}

export interface PlanDetailResponse {
  data: TripPlan
}

export interface UpdatePlanResponse {
  id: UUID
  status: PlanStatus
  version: number
  updated_at: ISODateString
}

export interface ReorderStopsResponse {
  id: UUID
  status: PlanStatus
  version: number
  stops: PlanStop[]
}

export interface OptimizePlanRequest {
  locked_stop_ids?: UUID[]
  objective?: 'min_travel' | 'max_places' | 'balanced'
  allow_alternatives?: boolean
}

export interface OptimizePlanResponse {
  plan_id: UUID
  status: Extract<PlanStatus, 'confirmed'>
  selected_alternative_index: number
  alternatives_count: number
  warnings: Warning[]
}

export interface PlanAlternative {
  index: number
  label: string
  selected: boolean
  total_travel_minutes: number
  total_dwell_minutes: number
  score: number
  warning_count: number
  schedule: PlanStop[]
}

export interface GetPlanAlternativesResponse {
  plan_id: UUID
  alternatives: PlanAlternative[]
}

export interface SelectPlanAlternativeResponse {
  plan_id: UUID
  selected_alternative_index: number
  status: Extract<PlanStatus, 'confirmed'>
}

export interface CreateShareRequest {
  visibility: ShareVisibility
  title?: string
  description?: string
}

export interface CreateShareResponse {
  shared_id: UUID
  share_code: string
  share_url: string
  expires_at: ISODateString | null
}

export interface SharedItineraryStopPreview {
  place_name: string
  day_index: number
  offset_minutes: number
}

export interface GetSharedItineraryResponse {
  share_code: string
  title: string
  region: string
  transport_mode: TransportMode
  total_stops: number
  estimated_hours: number
  stops: SharedItineraryStopPreview[]
}

export interface ImportSharedRequest {
  start_at: ISODateString
  transport_mode: TransportMode
  origin_lat: number
  origin_lng: number
  origin_name: string
}

export interface ImportSharedResponse {
  result_plan_id: UUID
  status: Extract<PlanStatus, 'draft'>
}

export interface StartExecutionResponse {
  execution_id: UUID
  status: Extract<ExecutionStatus, 'active'>
  started_at: ISODateString
}

export interface ExecutionStopDetail {
  id: UUID
  stop_order: number
  place_id: UUID
  place_name: string
  planned_arrive_at: ISODateString | null
  planned_leave_at: ISODateString | null
  arrive_at: ISODateString | null
  leave_at: ISODateString | null
  skipped: boolean
  is_adhoc: boolean
}

export interface ExecutionAlertPreview {
  type: string
  fire_at: ISODateString
}

export interface GetExecutionResponse
  extends Pick<TripExecution, 'id' | 'plan_id' | 'status'> {
  delay_minutes: number
  reopt_count: number
  stops: ExecutionStopDetail[]
  next_alert: ExecutionAlertPreview | null
}

export interface UpdateExecutionStopRequest {
  arrive_at?: ISODateString
  leave_at?: ISODateString
  skipped?: boolean
  skip_reason?: string
}

export interface ReoptimizeExecutionRequest {
  strategy: 'keep_restaurant_priority' | string
}

export interface ReoptimizeExecutionResponse {
  execution_id: UUID
  reopt_count: number
  warnings: Warning[]
}

export interface SpendItemRequest {
  name: string
  qty: number
  unit_price: number
  line_amount: number
}

export interface CreateSpendRequest {
  stop_id: UUID
  category: SpendCategory
  occurred_at: ISODateString
  total_amount: number
  items: SpendItemRequest[]
}

export interface CreateSpendResponse {
  id: UUID
  total_amount: number
}

export interface GetSpendSummaryParams {
  period: 'weekly' | 'monthly'
  from?: ISODateString
  to?: ISODateString
}

export interface GetSpendSummaryResponse {
  period: 'weekly' | 'monthly'
  total_amount: number
  by_category: Partial<Record<SpendCategory, number>>
}

export interface CreateMediaUploadRequest {
  kind: 'trip-photo' | 'receipt-image'
  content_type: string
  file_name: string
}

export interface CreateMediaUploadResponse {
  asset_id: UUID
  upload_url: string
  storage_path: string
}

export interface RegisterPushTokenRequest {
  push_token: string
  platform: 'ios' | 'android'
  device_name?: string
}

export interface RegisterPushTokenResponse {
  id: UUID
  is_active: boolean
}

export interface ScanReceiptRequest {
  asset_id: UUID
  execution_id: UUID
  stop_id: UUID
}

export interface ScanReceiptResponse {
  receipt_id: UUID
  status: 'needs_review'
}

export interface ReceiptField<T> {
  confidence: number
  text?: string
  value?: T
  iso?: ISODateString
  currency?: string
}

export interface ReceiptItemDraft {
  name: string
  qty: number
  unit_price: number
  amount: number
  confidence: number
}

export interface GetReceiptResponse {
  id: UUID
  status: 'queued' | 'processing' | 'parsed' | 'needs_review' | 'confirmed' | 'failed'
  merchant_name: ReceiptField<string>
  occurred_at: ReceiptField<ISODateString>
  total_amount: ReceiptField<number>
  items: ReceiptItemDraft[]
}

export interface ConfirmReceiptRequest {
  merchant_name: string
  occurred_at: ISODateString
  total_amount: number
  category: SpendCategory
  items: SpendItemRequest[]
}

export interface ConfirmReceiptResponse {
  receipt_id: UUID
  status: 'confirmed'
  spend_id: UUID
}

export interface OptimizerStopRequest {
  stop_id: UUID
  place_id: UUID
  lat: number
  lng: number
  dwell_minutes: number
  locked: boolean
  time_window: {
    open_at: ISODateString
    close_at: ISODateString
  }
}

export interface OptimizerOptimizeRequest {
  plan_id: UUID
  transport_mode: TransportMode
  start_at: ISODateString
  origin: LocationPoint
  stops: OptimizerStopRequest[]
}

export interface OptimizerAlternative {
  index: number
  label?: string
  total_travel_minutes: number
  total_dwell_minutes: number
  score: number
  warning_count: number
  schedule: PlanStop[]
}

export interface OptimizerOptimizeResponse {
  selected_alternative_index: number
  alternatives: OptimizerAlternative[]
  warnings: Warning[]
  meta: {
    total_travel_minutes: number
    score: number
  }
}

export interface MatrixPoint {
  id: string
  lat: number
  lng: number
}

export interface OptimizerMatrixRequest {
  provider: 'tmap' | 'naver' | 'kakao'
  transport_mode: TransportMode
  points: MatrixPoint[]
}

export interface OptimizerMatrixCell {
  minutes: number
  meters: number
}

export interface OptimizerMatrixResponse {
  matrix: Record<string, Record<string, OptimizerMatrixCell>>
}
