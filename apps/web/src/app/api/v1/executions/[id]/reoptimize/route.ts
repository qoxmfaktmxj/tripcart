import { notImplementedStub } from '@/lib/api-stub'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  return notImplementedStub(`/api/v1/executions/${id}/reoptimize`, 'POST')
}
