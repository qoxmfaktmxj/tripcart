/**
 * Auth Callback Route
 * 이메일 확인/OAuth 리다이렉트 후 code를 세션으로 교환
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Open redirect 방지 — 상대 경로만 허용
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 시 로그인으로 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
