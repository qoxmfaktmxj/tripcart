/**
 * Mobile Auth Provider
 * onAuthStateChange로 인증 상태를 전역 관리
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // getUser()로 서버 검증 — getSession()은 로컬 토큰만 읽어 위변조에 취약
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setLoading(false)
        })
      } else {
        setSession(null)
        setLoading(false)
      }
    })

    // 실시간 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
