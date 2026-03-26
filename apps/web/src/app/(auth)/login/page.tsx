'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage(): React.JSX.Element {
  const router = useRouter()

  // URL에서 next 파라미터 읽기 (useSearchParams 대신 — Suspense 불필요)
  const rawNext =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') ?? '/'
      : '/'
  // Open redirect 방지 — 상대 경로만 허용
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary-900">TripCart</h1>
        <p className="text-neutral-500 text-sm mt-1">로그인</p>
      </div>

      {error && (
        <div className="bg-coral-50 text-coral-500 text-sm px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-500 text-white py-3 rounded-md font-semibold text-sm hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm text-neutral-500">
        계정이 없나요?{' '}
        <Link href="/signup" className="text-primary-500 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}
