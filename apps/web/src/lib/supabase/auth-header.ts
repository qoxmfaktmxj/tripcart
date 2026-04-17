export type HeaderSource = {
  headers: Pick<Headers, 'get'>
}

export function getBearerAuthorizationHeader(request?: HeaderSource): string | undefined {
  const authorization = request?.headers.get('authorization')?.trim()
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return undefined
  return authorization
}
