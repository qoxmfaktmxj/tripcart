/**
 * TripCart Mobile Phase 0 placeholder screen.
 */
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { tripcartColors } from '@tripcart/design-tokens'
import type { TransportMode } from '@tripcart/types'

const defaultTransportMode: TransportMode = 'car'

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
      <Text style={styles.subtitle}>Optimized travel planning and execution</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 0 mobile dev client ready</Text>
      </View>
      <Text style={styles.meta}>default transport: {defaultTransportMode}</Text>
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