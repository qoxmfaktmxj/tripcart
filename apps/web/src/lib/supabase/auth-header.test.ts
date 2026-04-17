import { describe, expect, it } from 'vitest'
import { getBearerAuthorizationHeader } from './auth-header'

function requestWithAuthorization(value: string | null) {
  return {
    headers: {
      get(name: string) {
        return name.toLowerCase() === 'authorization' ? value : null
      },
    },
  }
}

describe('getBearerAuthorizationHeader', () => {
  it('Bearer 토큰을 그대로 전달한다', () => {
    expect(getBearerAuthorizationHeader(requestWithAuthorization('Bearer abc.def'))).toBe(
      'Bearer abc.def',
    )
  })

  it('Bearer 형식이 아니면 전달하지 않는다', () => {
    expect(getBearerAuthorizationHeader(requestWithAuthorization('Basic abc'))).toBeUndefined()
    expect(getBearerAuthorizationHeader(requestWithAuthorization(null))).toBeUndefined()
  })
})
