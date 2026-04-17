import { NextResponse } from 'next/server'

export function notImplementedStub(endpoint: string, method: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Endpoint is documented but not implemented in this phase.',
        details: {
          endpoint,
          method,
          phase: 'stub',
        },
      },
    },
    { status: 501 },
  )
}
