/**
 * TripCart User & Auth 타입 정의
 * Schema v0.3 public.users 테이블 기반
 */

import type { UUID, ISODateString } from './index.js'

// ── User Profile (public.users 테이블) ───────────────────────

// schema에서 provider는 text (freeform) — 알려진 값 + 확장 허용
export type AuthProvider = 'email' | 'google' | 'kakao' | 'apple' | (string & {})

export interface UserProfile {
  id: UUID
  email: string
  nickname: string | null
  avatar_url: string | null
  provider: AuthProvider
  preferences: UserPreferences
  created_at: ISODateString
  updated_at: ISODateString
}

export interface UserPreferences {
  default_region?: string
  default_transport_mode?: string
  timezone?: string
}

// ── Auth State (클라이언트 상태 관리용) ──────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: UserProfile | null
  /** Supabase auth.users.id — RLS에서 auth.uid()로 참조됨 */
  authId: string | null
}
