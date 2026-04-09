'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage(): React.JSX.Element {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setError('회원가입을 완료하려면 이메일을 확인해 주세요.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void handleSignup()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary-900">TripCart</h1>
        <p className="mt-1 text-sm text-neutral-500">계정을 만들고 시작하세요</p>
      </div>

      {error ? (
        <div className="rounded-md bg-coral-50 px-4 py-2 text-sm text-coral-500">
          {error}
        </div>
      ) : null}

      <input
        type="email"
        placeholder="이메일"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <input
        type="password"
        placeholder="비밀번호 (6자 이상)"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={6}
        className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <button
        type="button"
        onClick={() => void handleSignup()}
        disabled={loading}
        className="w-full rounded-md bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        {loading ? '계정 생성 중...' : '계정 만들기'}
      </button>

      <p className="text-center text-sm text-neutral-500">
        이미 계정이 있나요?{' '}
        <Link href="/login" className="text-primary-500 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  )
}
