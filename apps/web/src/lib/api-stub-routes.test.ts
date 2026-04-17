import { describe, expect, it } from 'vitest'

import { POST as postOptimizePlan } from '../app/api/v1/plans/[id]/optimize/route'
import { POST as postReoptimizeExecution } from '../app/api/v1/executions/[id]/reoptimize/route'

type StubHandler = (
  request: Request,
  context: { params: Promise<unknown> },
) => Promise<Response>

const UUID = '11111111-1111-4111-8111-111111111111'

async function expectNotImplemented(
  handler: StubHandler,
  params: Record<string, string>,
  method: string,
  endpoint: string,
) {
  const response = await handler(new Request(`https://tripcart.test${endpoint}`, { method }), {
    params: Promise.resolve(params),
  })
  const body = await response.json()

  expect(response.status).toBe(501)
  expect(body).toEqual({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Endpoint is documented but not implemented in this phase.',
      details: {
        endpoint,
        method,
        phase: 'stub',
      },
    },
  })
}

describe('API phase stubs', () => {
  it.each([
    [postOptimizePlan, { id: UUID }, 'POST', `/api/v1/plans/${UUID}/optimize`],
    [postReoptimizeExecution, { id: UUID }, 'POST', `/api/v1/executions/${UUID}/reoptimize`],
  ])('returns a standard NOT_IMPLEMENTED envelope for %s %s', async (
    handler,
    params,
    method,
    endpoint,
  ) => {
    await expectNotImplemented(handler as StubHandler, params, method, endpoint)
  })
})
