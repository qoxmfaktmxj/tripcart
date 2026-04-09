/**
 * TripCart Mobile Phase 0 placeholder screen.
 */
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { tripcartColors } from '@tripcart/design-tokens'
import type { TransportMode } from '@tripcart/types'

const defaultTransportMode: TransportMode = 'car'
const TRANSPORT_LABELS: Record<TransportMode, string> = {
  car: '자동차',
  transit: '대중교통',
  walk: '도보',
  bicycle: '자전거',
}

const COLORS = {
  primary50: tripcartColors.primary[50],
  primary300: tripcartColors.primary[300],
  primary500: tripcartColors.primary[500],
  primary900: tripcartColors.primary[900],
  neutral50: tripcartColors.neutral[50],
  neutral500: tripcartColors.neutral[500],
} as const

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TripCart</Text>
      <Text style={styles.subtitle}>여행 계획과 실행을 한 흐름으로 관리합니다</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>0단계 모바일 개발 클라이언트 준비 완료</Text>
      </View>
      <Text style={styles.meta}>기본 이동 수단: {TRANSPORT_LABELS[defaultTransportMode]}</Text>
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
    textAlign: 'center',
  },
  badge: {
    backgroundColor: COLORS.primary50,
    borderWidth: 1,
    borderColor: COLORS.primary300,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  badgeText: {
    color: COLORS.primary500,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: COLORS.neutral500,
    textAlign: 'center',
  },
})
