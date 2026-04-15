import { Stack } from 'expo-router'
import { AuthProvider } from '../src/providers/auth-provider'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="plan/[id]" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  )
}

