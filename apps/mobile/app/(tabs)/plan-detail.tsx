import { StatusBar } from 'expo-status-bar'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, PLAN_STOPS, PLAN_SUMMARY } from './design-data'

type StopTone = (typeof PLAN_STOPS)[number]['statusTone']

function getTimelineToneStyle(tone: StopTone) {
  if (tone === 'risk') {
    return {
      border: styles.timelineRisk,
      badge: styles.badgeRisk,
      badgeText: styles.badgeRiskText,
    }
  }

  if (tone === 'warning') {
    return {
      border: styles.timelineWarning,
      badge: styles.badgeWarning,
      badgeText: styles.badgeWarningText,
    }
  }

  return {
    border: styles.timelineOpen,
    badge: styles.badgeOpen,
    badgeText: styles.badgeOpenText,
  }
}

export default function PlanDetailScreen() {
  const hasStops = PLAN_STOPS.length > 0
  const handleEditPlan = () => undefined
  const handleOpenNavigation = () => undefined

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>실행 준비</Text>
          <Text style={styles.pageTitle}>{PLAN_SUMMARY.title}</Text>
          <Text style={styles.pageSubtitle}>
            {PLAN_SUMMARY.date} · {PLAN_SUMMARY.transport}
          </Text>
        </View>

        <ImageBackground source={{ uri: PLAN_SUMMARY.image }} imageStyle={styles.coverImage} style={styles.coverCard}>
          <View style={styles.coverSummary}>
            <Text style={styles.coverLabel}>{PLAN_SUMMARY.status}</Text>
            <Text style={styles.coverTitle}>출발 {PLAN_SUMMARY.startTime}</Text>
            <Text style={styles.coverText}>
              {PLAN_STOPS.length}개 장소 · {PLAN_SUMMARY.totalDistance} · {PLAN_SUMMARY.totalTime}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.alertCard} accessibilityRole="summary">
          <Text style={styles.alertTitle}>네트워크 저하 대비</Text>
          <Text style={styles.alertText}>이 화면은 마지막 최적화 결과를 기준으로 표시됩니다. 경로 열기는 외부 지도 앱으로 넘깁니다.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="플랜 수정하기"
            accessibilityState={{ disabled: !hasStops }}
            disabled={!hasStops}
            hitSlop={8}
            onPress={handleEditPlan}
            style={[styles.primaryButton, !hasStops && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>수정</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="외부 지도 앱으로 경로 열기"
            hitSlop={8}
            onPress={handleOpenNavigation}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>지도 열기</Text>
          </Pressable>
        </View>

        <View style={styles.routeSummary}>
          <View style={styles.routeMap} accessible={false}>
            <View style={styles.routeDotStart} />
            <View style={styles.routeLine} />
            <View style={styles.routeDotEnd} />
          </View>
          <View style={styles.routeCopy}>
            <Text style={styles.routeTitle}>경로 요약</Text>
            <Text style={styles.routeText}>{PLAN_SUMMARY.warning}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 타임라인</Text>
          <Text style={styles.sectionCount}>{PLAN_STOPS.length} stops</Text>
        </View>

        {hasStops ? (
          <View style={styles.timelineList}>
            {PLAN_STOPS.map((stop, index) => {
              const toneStyle = getTimelineToneStyle(stop.statusTone)
              const current = index === 0
              return (
                <Pressable
                  key={stop.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${stop.time} ${stop.name}, ${stop.status}`}
                  accessibilityState={{ selected: current }}
                  hitSlop={8}
                  style={[styles.timelineCard, toneStyle.border]}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{stop.time}</Text>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderText}>{stop.order}</Text>
                    </View>
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <View style={[styles.statusBadge, toneStyle.badge]}>
                        <Text style={[styles.statusBadgeText, toneStyle.badgeText]}>{stop.status}</Text>
                      </View>
                    </View>
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
            <Text style={styles.emptyTitle}>표시할 일정이 없습니다.</Text>
            <Text style={styles.emptyText}>장소를 담고 최적화하면 일정 카드가 표시됩니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  pageSubtitle: {
    fontSize: 15,
    color: COLORS.neutral700,
  },
  coverCard: {
    minHeight: 220,
    justifyContent: 'flex-end',
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: COLORS.primary50,
  },
  coverImage: {
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  coverSummary: {
    margin: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    padding: 14,
    gap: 6,
  },
  coverLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  coverText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  alertCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary50,
    borderWidth: 1,
    borderColor: COLORS.primary100,
    padding: 14,
    gap: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary900,
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  actions: {
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
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    padding: 14,
    gap: 14,
  },
  routeMap: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral100,
  },
  routeDotStart: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary500,
  },
  routeLine: {
    position: 'absolute',
    left: 28,
    top: 36,
    width: 32,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primary300,
    transform: [{ rotate: '38deg' }],
  },
  routeDotEnd: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.plum700,
  },
  routeCopy: {
    flex: 1,
    gap: 6,
  },
  routeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  routeText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutral500,
  },
  timelineList: {
    gap: 12,
  },
  timelineCard: {
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
  timelineOpen: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary300,
  },
  timelineRisk: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold500,
  },
  timelineWarning: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral500,
  },
  timeColumn: {
    width: 62,
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.neutral900,
    textAlign: 'center',
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary50,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  timelineBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  stopName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  statusBadge: {
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusBadgeText: {
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
  stopMeta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutral700,
  },
  stopTravel: {
    fontSize: 13,
    fontWeight: '800',
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
