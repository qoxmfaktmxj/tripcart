import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, PLAN_STOPS, PLAN_SUMMARY } from '../(tabs)/design-data'

type StopTone = (typeof PLAN_STOPS)[number]['statusTone']

function getStopToneStyle(tone: StopTone) {
  if (tone === 'risk') {
    return {
      card: styles.stopRisk,
      badge: styles.badgeRisk,
      badgeText: styles.badgeRiskText,
      marker: styles.markerRisk,
    }
  }

  if (tone === 'warning') {
    return {
      card: styles.stopWarning,
      badge: styles.badgeWarning,
      badgeText: styles.badgeWarningText,
      marker: styles.markerWarning,
    }
  }

  return {
    card: styles.stopOpen,
    badge: styles.badgeOpen,
    badgeText: styles.badgeOpenText,
    marker: styles.markerOpen,
  }
}

export default function PlanDetailRouteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const planId = typeof id === 'string' ? id : PLAN_SUMMARY.id
  const hasStops = PLAN_STOPS.length > 0

  const handleOpenNavigation = () => undefined
  const handleStartExecution = () => undefined
  const handleSharePlan = () => undefined

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 돌아가기"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Text style={styles.iconButtonText}>‹</Text>
          </Pressable>
          <View style={styles.topTitleGroup}>
            <Text style={styles.topTitle}>플랜 상세</Text>
            <Text style={styles.topMeta}>ID {planId}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이 플랜 공유하기"
            hitSlop={8}
            onPress={handleSharePlan}
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>공유</Text>
          </Pressable>
        </View>

        <ImageBackground
          source={{ uri: PLAN_SUMMARY.image }}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          style={styles.hero}
        >
          <View style={styles.heroInfo}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{PLAN_SUMMARY.status}</Text>
            </View>
            <Text style={styles.heroTitle}>{PLAN_SUMMARY.title}</Text>
            <Text style={styles.heroSub}>
              {PLAN_SUMMARY.date} · {PLAN_SUMMARY.startTime}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{PLAN_SUMMARY.totalTime}</Text>
            <Text style={styles.summaryLabel}>총 소요</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{PLAN_SUMMARY.totalDistance}</Text>
            <Text style={styles.summaryLabel}>총 이동</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryValue}>{PLAN_STOPS.length}곳</Text>
            <Text style={styles.summaryLabel}>방문</Text>
          </View>
        </View>

        <View style={styles.warningBanner} accessibilityRole="summary">
          <Text style={styles.warningTitle}>주의 경로</Text>
          <Text style={styles.warningText}>{PLAN_SUMMARY.warning}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="여행 실행 시작하기"
            accessibilityState={{ disabled: !hasStops }}
            disabled={!hasStops}
            hitSlop={8}
            onPress={handleStartExecution}
            style={[styles.primaryButton, !hasStops && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>여행 시작</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="네이버 지도 앱으로 경로 열기"
            hitSlop={8}
            onPress={handleOpenNavigation}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>지도 열기</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>타임라인</Text>
          <Text style={styles.sectionMeta}>{PLAN_SUMMARY.transport}</Text>
        </View>

        {hasStops ? (
          <View style={styles.timeline}>
            <View style={styles.timelineLine} accessible={false} />
            {PLAN_STOPS.map((stop, index) => {
              const toneStyle = getStopToneStyle(stop.statusTone)
              const selected = index === 0
              return (
                <Pressable
                  key={stop.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${stop.time} ${stop.name}, ${stop.status}, ${stop.dwell}`}
                  accessibilityState={{ selected }}
                  hitSlop={8}
                  style={[styles.stopRow, toneStyle.card]}
                >
                  <View style={[styles.stopMarker, toneStyle.marker]}>
                    <Text style={styles.stopMarkerText}>{stop.order}</Text>
                  </View>
                  <View style={styles.stopContent}>
                    <View style={styles.stopHeader}>
                      <Text style={styles.stopTime}>{stop.time}</Text>
                      <View style={[styles.stopBadge, toneStyle.badge]}>
                        <Text style={[styles.stopBadgeText, toneStyle.badgeText]}>{stop.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <Text style={styles.stopMeta}>
                      {stop.category} · {stop.dwell}
                    </Text>
                    <Text style={styles.stopTravel}>{stop.travelFromPrev}</Text>
                    <Text style={styles.stopNote}>{stop.note}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyState} accessibilityRole="summary">
            <Text style={styles.emptyTitle}>아직 방문지가 없습니다.</Text>
            <Text style={styles.emptyText}>장소를 담은 뒤 다시 최적화하면 타임라인이 표시됩니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 30,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  topTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  topMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutral500,
  },
  shareButton: {
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.plum50,
    borderWidth: 1,
    borderColor: COLORS.plum300,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.plum700,
  },
  hero: {
    minHeight: 248,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary50,
  },
  heroImage: {
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  heroInfo: {
    margin: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    padding: 14,
    gap: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCell: {
    flex: 1,
    minHeight: 78,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutral500,
  },
  warningBanner: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.gold50,
    borderWidth: 1,
    borderColor: COLORS.gold300,
    padding: 14,
    gap: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold900,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabledButton: {
    backgroundColor: COLORS.neutral300,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.neutral500,
  },
  timeline: {
    position: 'relative',
    gap: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 21,
    top: 24,
    bottom: 24,
    width: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primary100,
  },
  stopRow: {
    minHeight: 44,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    padding: 12,
  },
  stopOpen: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary300,
  },
  stopRisk: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold500,
  },
  stopWarning: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral500,
  },
  stopMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOpen: {
    backgroundColor: COLORS.primary50,
  },
  markerRisk: {
    backgroundColor: COLORS.gold50,
  },
  markerWarning: {
    backgroundColor: COLORS.coral50,
  },
  stopMarkerText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  stopContent: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stopTime: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  stopBadge: {
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stopBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeOpen: {
    backgroundColor: COLORS.successLight,
  },
  badgeOpenText: {
    color: COLORS.successDark,
  },
  badgeRisk: {
    backgroundColor: COLORS.gold50,
  },
  badgeRiskText: {
    color: COLORS.gold900,
  },
  badgeWarning: {
    backgroundColor: COLORS.coral50,
  },
  badgeWarningText: {
    color: COLORS.coral900,
  },
  stopName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  stopMeta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutral700,
  },
  stopTravel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  stopNote: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  emptyState: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.neutral300,
    backgroundColor: COLORS.neutral0,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
})
