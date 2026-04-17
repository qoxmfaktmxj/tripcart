import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getBearerAuthorizationHeader, type HeaderSource } from './auth-header'

export async function createClient(request?: HeaderSource) {
  const cookieStore = await cookies()
  const authorization = getBearerAuthorizationHeader(request)
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(
      cookiesToSet: Array<{
        name: string
        value: string
        options: CookieOptions
      }>,
    ) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        )
      } catch {
        // Server Components cannot always mutate cookies; Route Handlers can.
      }
    },
  }
  const clientOptions = authorization
    ? {
        global: {
          headers: { Authorization: authorization },
        },
        cookies: cookieMethods,
      }
    : {
        cookies: cookieMethods,
      }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    clientOptions,
  )
}
