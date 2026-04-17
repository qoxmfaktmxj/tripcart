import type { CreatePlanRequest, TravelMode } from '@tripcart/types'

export const VALID_TRAVEL_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']

export type PlanCreateValidationResult =
  | { ok: true; value: CreatePlanRequest }
  | {
      ok: false
      error: {
        code: 'INVALID_FIELD'
        message: string
        details?: { field: string }
      }
    }

function invalid(field: string, message: string): PlanCreateValidationResult {
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
  if (typeof source.origin_name === 'string') value.origin_name = source.origin_name

  return { ok: true, value }
}
