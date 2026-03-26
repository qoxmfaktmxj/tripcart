/**
 * Next.js Middleware — Supabase 세션 갱신 + 라우트 보호
 *
 * @supabase/ssr 패턴: 매 요청마다 getUser()로 세션을 갱신하고
 * 갱신된 토큰을 response 쿠키에 기록한다.
 * 이게 없으면 JWT 만료 후 서버 컴포넌트의 RLS 쿼리가 빈 결과를 반환한다.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** 인증 없이 접근 가능한 경로 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/trip', // 공유 링크 prefix
  '/api/v1/places', // Places public read API
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // 세션 갱신 — getUser()가 refresh token을 교환한다
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 경로에 비인증 접근 시 로그인으로 리다이렉트
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - public 폴더 리소스
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
