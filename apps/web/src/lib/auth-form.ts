type AuthInput = {
  email: string
  password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string): string {
  return email.trim()
}

function validateEmail(email: string): string | null {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return '이메일을 입력해 주세요.'
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return '올바른 이메일 형식을 입력해 주세요.'
  }

  return null
}

function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return '비밀번호를 입력해 주세요.'
  }

  return null
}

export function validateLoginInput(input: AuthInput): string | null {
  return validateEmail(input.email) ?? validatePassword(input.password)
}

export function validateSignupInput(input: AuthInput): string | null {
  const baseValidation = validateLoginInput(input)
  if (baseValidation) return baseValidation

  if (input.password.trim().length < 6) {
    return '비밀번호는 6자 이상이어야 합니다.'
  }

  return null
}

export function getFriendlyAuthErrorMessage(message: string): string {
  const normalizedMessage = message.trim().toLowerCase()

  if (
    normalizedMessage.includes('missing email') ||
    normalizedMessage.includes('missing email or phone')
  ) {
    return '이메일을 입력해 주세요.'
  }

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('email not confirmed')
  ) {
    return '이메일 또는 비밀번호를 다시 확인해 주세요.'
  }

  if (
    normalizedMessage.includes('anonymous sign-ins are disabled') ||
    normalizedMessage.includes('password should be at least 6 characters')
  ) {
    return '이메일을 입력하고 비밀번호를 6자 이상 작성해 주세요.'
  }

  if (normalizedMessage.includes('user already registered')) {
    return '이미 가입된 이메일입니다. 로그인으로 진행해 주세요.'
  }

  return message
}
