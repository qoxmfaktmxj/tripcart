import type { AddStopRequest, CreatePlanRequest, TravelMode, UpdatePlanRequest } from '@tripcart/types'

export const VALID_TRAVEL_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']

type InvalidFieldError = {
  code: 'INVALID_FIELD'
  message: string
  details?: { field: string }
}

export type PlanCreateValidationResult =
  | { ok: true; value: CreatePlanRequest }
  | {
      ok: false
      error: InvalidFieldError
    }

export type PlanUpdateValidationResult =
  | { ok: true; value: UpdatePlanRequest }
  | { ok: false; error: InvalidFieldError }

export type AddStopValidationResult =
  | { ok: true; value: AddStopRequest }
  | { ok: false; error: InvalidFieldError }

function invalid(field: string, message: string): { ok: false; error: InvalidFieldError } {
  return {
    ok: false,
    error: {
      code: 'INVALID_FIELD',
      message,
      details: { field },
    },
  }
}

function isValidIsoDate(value: string): boolean {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateCreatePlanRequest(body: unknown): PlanCreateValidationResult {
  if (!body || typeof body !== 'object') {
    return invalid('body', 'Request body must be an object')
  }

  const source = body as Record<string, unknown>
  const title = typeof source.title === 'string' ? source.title.trim() : ''
  const region = typeof source.region === 'string' ? source.region.trim() : ''
  const startAt = typeof source.start_at === 'string' ? source.start_at.trim() : ''

  if (!title) return invalid('title', 'title is required')
  if (!region) return invalid('region', 'region is required')
  if (!startAt) return invalid('start_at', 'start_at is required')
  if (!isValidIsoDate(startAt)) {
    return invalid('start_at', 'start_at must be an ISO 8601 timestamp with timezone')
  }

  const transportMode = source.transport_mode
  if (transportMode !== undefined && !VALID_TRAVEL_MODES.includes(transportMode as TravelMode)) {
    return invalid(
      'transport_mode',
      `Invalid transport_mode. Allowed: ${VALID_TRAVEL_MODES.join(', ')}`,
    )
  }

  if (
    source.origin_lat !== undefined &&
    (typeof source.origin_lat !== 'number' || Number.isNaN(source.origin_lat))
  ) {
    return invalid('origin_lat', 'origin_lat must be a number')
  }

  if (
    source.origin_lng !== undefined &&
    (typeof source.origin_lng !== 'number' || Number.isNaN(source.origin_lng))
  ) {
    return invalid('origin_lng', 'origin_lng must be a number')
  }

  if (
    source.origin_name !== undefined &&
    source.origin_name !== null &&
    typeof source.origin_name !== 'string'
  ) {
    return invalid('origin_name', 'origin_name must be a string')
  }

  const value: CreatePlanRequest = {
    title,
    region,
    start_at: startAt,
  }

  if (transportMode !== undefined) value.transport_mode = transportMode as TravelMode
  if (source.origin_lat !== undefined) value.origin_lat = source.origin_lat as number
  if (source.origin_lng !== undefined) value.origin_lng = source.origin_lng as number
  if (typeof source.origin_name === 'string') value.origin_name = source.origin_name.trim()

  return { ok: true, value }
}

export function validateUpdatePlanRequest(body: unknown): PlanUpdateValidationResult {
  if (!body || typeof body !== 'object') {
    return invalid('body', 'Request body must be an object')
  }

  const source = body as Record<string, unknown>
  const value: UpdatePlanRequest = {}

  if (source.title !== undefined) {
    if (typeof source.title !== 'string' || source.title.trim().length === 0) {
      return invalid('title', 'title must be a non-empty string')
    }
    value.title = source.title.trim()
  }

  if (source.start_at !== undefined) {
    if (source.start_at !== null && typeof source.start_at !== 'string') {
      return invalid('start_at', 'start_at must be an ISO 8601 timestamp with timezone or null')
    }
    if (typeof source.start_at === 'string' && !isValidIsoDate(source.start_at)) {
      return invalid('start_at', 'start_at must be an ISO 8601 timestamp with timezone')
    }
    value.start_at = source.start_at
  }

  if (
    source.transport_mode !== undefined &&
    !VALID_TRAVEL_MODES.includes(source.transport_mode as TravelMode)
  ) {
    return invalid(
      'transport_mode',
      `Invalid transport_mode. Allowed: ${VALID_TRAVEL_MODES.join(', ')}`,
    )
  }
  if (source.transport_mode !== undefined) {
    value.transport_mode = source.transport_mode as TravelMode
  }

  if (source.origin_lat !== undefined) {
    if (typeof source.origin_lat !== 'number' || !isValidLatitude(source.origin_lat)) {
      return invalid('origin_lat', 'origin_lat must be a number between -90 and 90')
    }
    value.origin_lat = source.origin_lat
  }

  if (source.origin_lng !== undefined) {
    if (typeof source.origin_lng !== 'number' || !isValidLongitude(source.origin_lng)) {
      return invalid('origin_lng', 'origin_lng must be a number between -180 and 180')
    }
    value.origin_lng = source.origin_lng
  }

  if (
    source.origin_name !== undefined &&
    source.origin_name !== null &&
    typeof source.origin_name !== 'string'
  ) {
    return invalid('origin_name', 'origin_name must be a string or null')
  }
  if (typeof source.origin_name === 'string') {
    value.origin_name = source.origin_name.trim()
  } else if (source.origin_name === null) {
    value.origin_name = null
  }

  return { ok: true, value }
}

export function validateAddStopRequest(body: unknown): AddStopValidationResult {
  if (!body || typeof body !== 'object') {
    return invalid('body', 'Request body must be an object')
  }

  const source = body as Record<string, unknown>

  if (typeof source.place_id !== 'string' || !UUID_RE.test(source.place_id)) {
    return invalid('place_id', 'place_id is required and must be a valid UUID')
  }

  if (
    source.dwell_minutes !== undefined &&
    (typeof source.dwell_minutes !== 'number' ||
      !Number.isFinite(source.dwell_minutes) ||
      source.dwell_minutes < 1 ||
      source.dwell_minutes > 1440)
  ) {
    return invalid('dwell_minutes', 'dwell_minutes must be a number between 1 and 1440')
  }

  if (source.locked !== undefined && typeof source.locked !== 'boolean') {
    return invalid('locked', 'locked must be a boolean')
  }

  const value: AddStopRequest = {
    place_id: source.place_id,
  }

  if (source.dwell_minutes !== undefined) value.dwell_minutes = source.dwell_minutes
  if (source.locked !== undefined) value.locked = source.locked

  return { ok: true, value }
}
