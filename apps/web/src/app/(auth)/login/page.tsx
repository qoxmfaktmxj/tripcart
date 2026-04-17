'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import {
  getFriendlyAuthErrorMessage,
  validateLoginInput,
} from '@/lib/auth-form'
import { createClient } from '@/lib/supabase/client'

function LoginForm(): React.JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    const validationError = validateLoginInput({ email, password })
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(getFriendlyAuthErrorMessage(error.message))
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void handleLogin()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary-900">TripCart</h1>
      </div>

      {error ? (
        <div id="auth-error" role="alert" className="rounded-md bg-coral-50 px-4 py-2 text-sm font-medium text-coral-900">
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-semibold text-neutral-900">
          이메일
        </label>
        <input
          id="email"
          type="email"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'auth-error' : undefined}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-semibold text-neutral-900">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'auth-error' : undefined}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm text-neutral-500">
        계정이 없나요?{' '}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
          회원가입
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
