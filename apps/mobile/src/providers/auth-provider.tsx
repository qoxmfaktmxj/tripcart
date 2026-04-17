import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Text, View } from 'react-native'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigError } from '../lib/supabase'

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
    const client = supabase

    if (!client) {
      setLoading(false)
      return
    }

    const authClient = client.auth
    let mounted = true

    async function loadInitialSession() {
      try {
        const {
          data: { user },
        } = await authClient.getUser()

        if (!mounted) return

        if (!user) {
          setSession(null)
          return
        }

        const {
          data: { session },
        } = await authClient.getSession()

        if (mounted) setSession(session)
      } catch {
        if (mounted) setSession(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitialSession()

    const {
      data: { subscription },
    } = authClient.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  if (supabaseConfigError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#F8FAFB',
        }}
      >
        <Text
          style={{
            color: '#264653',
            fontSize: 18,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          Supabase configuration is missing
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: '#64748B',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
        </Text>
      </View>
    )
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
