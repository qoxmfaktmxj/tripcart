type InvalidFieldError = {
  code: 'INVALID_FIELD'
  message: string
  details: { field: string }
}

type PlaceCorrectionRequest = {
  field_name: string
  old_value?: string | null
  new_value: string
  reason: string
}

type PlaceCorrectionValidationResult =
  | { ok: true; value: PlaceCorrectionRequest }
  | { ok: false; error: InvalidFieldError }

const FIELD_NAME_RE = /^[a-z][a-z0-9_]{1,63}$/

function invalid(field: string, message: string): PlaceCorrectionValidationResult {
  return {
    ok: false,
    error: {
      code: 'INVALID_FIELD',
      message,
      details: { field },
    },
  }
}

export function validatePlaceCorrectionRequest(
  body: unknown,
): PlaceCorrectionValidationResult {
  if (!body || typeof body !== 'object') {
    return invalid('body', 'Request body must be an object')
  }

  const source = body as Record<string, unknown>
  const fieldName = typeof source.field_name === 'string' ? source.field_name.trim() : ''
  const newValue = typeof source.new_value === 'string' ? source.new_value.trim() : ''
  const reason = typeof source.reason === 'string' ? source.reason.trim() : ''

  if (!fieldName) return invalid('field_name', 'field_name is required')
  if (!FIELD_NAME_RE.test(fieldName)) {
    return invalid('field_name', 'field_name must be a safe snake_case field name')
  }
  if (!newValue) return invalid('new_value', 'new_value is required')
  if (!reason) return invalid('reason', 'reason is required')

  const value: PlaceCorrectionRequest = {
    field_name: fieldName,
    new_value: newValue,
    reason,
  }

  if (typeof source.old_value === 'string') {
    value.old_value = source.old_value.trim() || null
  }

  return { ok: true, value }
}
