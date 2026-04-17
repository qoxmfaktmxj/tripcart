import type { SpendCategory } from '@tripcart/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SPEND_CATEGORIES: SpendCategory[] = [
  'food',
  'cafe',
  'admission',
  'transport',
  'shopping',
  'accommodation',
  'other',
]

type InvalidFieldError = {
  code: 'INVALID_FIELD'
  message: string
  details: { field: string }
}

export type ValidatedSpendItem = {
  name: string
  qty: number
  unit_price: number
  line_amount: number
}

export type ValidatedCreateSpendRequest = {
  stop_id: string
  category: SpendCategory
  occurred_at: string
  total_amount: number
  items: ValidatedSpendItem[]
}

export type ValidatedSpendSummaryParams = {
  period: 'weekly' | 'monthly'
  from?: string
  to?: string
}

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: InvalidFieldError }

function invalid<T>(field: string, message: string): ValidationResult<T> {
  return {
    ok: false,
    error: {
      code: 'INVALID_FIELD',
      message,
      details: { field },
    },
  }
}

function isIsoWithTimezone(value: string): boolean {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function validateCreateSpendRequest(body: unknown): ValidationResult<ValidatedCreateSpendRequest> {
  if (!body || typeof body !== 'object') {
    return invalid('body', 'Request body must be an object')
  }

  const source = body as Record<string, unknown>

  if (typeof source.stop_id !== 'string' || !UUID_RE.test(source.stop_id)) {
    return invalid('stop_id', 'stop_id must be a valid UUID')
  }

  if (
    typeof source.category !== 'string' ||
    !SPEND_CATEGORIES.includes(source.category as SpendCategory)
  ) {
    return invalid('category', 'Invalid spend category')
  }

  if (typeof source.occurred_at !== 'string' || !isIsoWithTimezone(source.occurred_at)) {
    return invalid('occurred_at', 'occurred_at must be an ISO 8601 timestamp with timezone')
  }

  if (!isPositiveInteger(source.total_amount)) {
    return invalid('total_amount', 'total_amount must be a positive integer')
  }

  if (!Array.isArray(source.items)) {
    return invalid('items', 'items must be an array')
  }

  const items: ValidatedSpendItem[] = []
  for (const [index, rawItem] of source.items.entries()) {
    if (!rawItem || typeof rawItem !== 'object') {
      return invalid(`items[${index}]`, 'item must be an object')
    }

    const item = rawItem as Record<string, unknown>
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    if (!name) return invalid(`items[${index}].name`, 'item name is required')
    if (!isPositiveInteger(item.qty)) {
      return invalid(`items[${index}].qty`, 'qty must be a positive integer')
    }
    if (!isPositiveInteger(item.unit_price)) {
      return invalid(`items[${index}].unit_price`, 'unit_price must be a positive integer')
    }
    if (!isPositiveInteger(item.line_amount)) {
      return invalid(`items[${index}].line_amount`, 'line_amount must be a positive integer')
    }
    if (item.line_amount !== item.qty * item.unit_price) {
      return invalid(`items[${index}].line_amount`, 'line_amount must equal qty * unit_price')
    }

    items.push({
      name,
      qty: item.qty,
      unit_price: item.unit_price,
      line_amount: item.line_amount,
    })
  }

  return {
    ok: true,
    value: {
      stop_id: source.stop_id,
      category: source.category as SpendCategory,
      occurred_at: source.occurred_at,
      total_amount: source.total_amount,
      items,
    },
  }
}

export function validateSpendSummaryParams(
  searchParams: URLSearchParams,
): ValidationResult<ValidatedSpendSummaryParams> {
  const period = searchParams.get('period') ?? 'monthly'
  if (period !== 'weekly' && period !== 'monthly') {
    return invalid('period', 'period must be weekly or monthly')
  }

  const from = searchParams.get('from') ?? undefined
  if (from !== undefined && !isIsoWithTimezone(from)) {
    return invalid('from', 'from must be an ISO 8601 timestamp with timezone')
  }

  const to = searchParams.get('to') ?? undefined
  if (to !== undefined && !isIsoWithTimezone(to)) {
    return invalid('to', 'to must be an ISO 8601 timestamp with timezone')
  }
  if (from !== undefined && to !== undefined && new Date(from).getTime() >= new Date(to).getTime()) {
    return invalid('from', 'from must be before to')
  }

  return {
    ok: true,
    value: {
      period,
      ...(from !== undefined && { from }),
      ...(to !== undefined && { to }),
    },
  }
}
