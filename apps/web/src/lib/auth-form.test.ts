import { describe, expect, it } from 'vitest'
import {
  getFriendlyAuthErrorMessage,
  validateLoginInput,
  validateSignupInput,
} from './auth-form'

describe('auth-form', () => {
  it('로그인 폼은 빈 이메일을 로컬에서 막는다', () => {
    expect(validateLoginInput({ email: '', password: 'secret123' })).toBe(
      '이메일을 입력해 주세요.',
    )
  })

  it('로그인 폼은 잘못된 이메일 형식을 로컬에서 막는다', () => {
    expect(validateLoginInput({ email: 'tripcart', password: 'secret123' })).toBe(
      '올바른 이메일 형식을 입력해 주세요.',
    )
  })

  it('회원가입 폼은 짧은 비밀번호를 로컬에서 막는다', () => {
    expect(validateSignupInput({ email: 'user@example.com', password: '123' })).toBe(
      '비밀번호는 6자 이상이어야 합니다.',
    )
  })

  it('백엔드 인증 에러를 사용자 문구로 바꾼다', () => {
    expect(getFriendlyAuthErrorMessage('missing email or phone')).toBe(
      '이메일을 입력해 주세요.',
    )
    expect(getFriendlyAuthErrorMessage('Anonymous sign-ins are disabled')).toBe(
      '이메일을 입력하고 비밀번호를 6자 이상 작성해 주세요.',
    )
  })
})
