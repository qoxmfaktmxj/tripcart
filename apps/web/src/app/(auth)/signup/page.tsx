'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage(): React.JSX.Element {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
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

    // 이메일 확인이 필요한 경우 (session이 없음)
    if (data.user && !data.session) {
      setError('가입 확인 이메일을 확인해주세요.')
      setLoading(false)
      return
    }

    // handle_new_user() 트리거가 public.users 자동 생성
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary-900">TripCart</h1>
        <p className="text-neutral-500 text-sm mt-1">회원가입</p>
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
        placeholder="비밀번호 (6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full px-4 py-3 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-500 text-white py-3 rounded-md font-semibold text-sm hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 transition-colors"
      >
        {loading ? '가입 중...' : '회원가입'}
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
