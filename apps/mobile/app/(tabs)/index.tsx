/**
 * TripCart Mobile — Phase 0 Hello World
 */
import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

// TripCart 디자인 토큰 (TypeScript)
const COLORS = {
  primary500: '#2A9D8F',
  primary900: '#264653',
  neutral50: '#F8FAFB',
  neutral500: '#64748B',
} as const

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 TripCart</Text>
      <Text style={styles.subtitle}>여행 일정 최적화 & 실행 도구</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 0 — Mobile Dev Client 준비됨</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary900,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.neutral500,
  },
  badge: {
    backgroundColor: '#D5F2EE', // primary-50
    borderWidth: 1,
    borderColor: '#4DBFAD', // primary-300
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  badgeText: {
    color: COLORS.primary500,
    fontWeight: '600',
    fontSize: 14,
  },
})
