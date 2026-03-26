/**
 * Mobile Supabase Client
 * expo-secure-store로 토큰을 안전하게 저장
 */

import 'react-native-url-polyfill/polyfill'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

// Expo에서 env는 babel transform으로 인라인됨
// @ts-expect-error — Expo env vars are inlined at build time
const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL
// @ts-expect-error — Expo env vars are inlined at build time
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Expo에서는 URL 기반 세션 감지 불필요
  },
})
