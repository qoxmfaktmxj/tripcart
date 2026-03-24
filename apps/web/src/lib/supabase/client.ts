/**
 * Supabase Client — 브라우저 전용 (anon key)
 * 컴포넌트에서 직접 CRUD 시 사용
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
