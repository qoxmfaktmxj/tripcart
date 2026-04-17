import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BROWSE_FILTERS, COLORS, PLACE_CARDS } from './design-data'

type BrowseFilter = (typeof BROWSE_FILTERS)[number]
type PlaceTone = (typeof PLACE_CARDS)[number]['statusTone']

function getStatusBadgeStyle(tone: PlaceTone) {
  if (tone === 'risk') {
    return {
      badge: styles.statusRisk,
      text: styles.statusRiskText,
    }
  }

  if (tone === 'warning') {
    return {
      badge: styles.statusWarning,
      text: styles.statusWarningText,
    }
  }

  return {
    badge: styles.statusOpen,
    text: styles.statusOpenText,
  }
}

export default function BrowseScreen() {
  const [selectedFilter, setSelectedFilter] = useState<BrowseFilter>('전체')
  const visiblePlaces = useMemo(
    () =>
      PLACE_CARDS.filter(
        (place) =>
          selectedFilter === '전체' ||
          place.category === selectedFilter ||
          (place.tags as readonly string[]).includes(selectedFilter),
      ),
    [selectedFilter],
  )

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>장소 둘러보기</Text>
          <Text style={styles.title}>저장할 곳을 고르고 플랜에 담으세요.</Text>
          <Text style={styles.subtitle}>네트워크가 느려도 최근 장소와 저장 상태는 이 기기에서 먼저 확인할 수 있습니다.</Text>
        </View>

        <View style={styles.searchShell} accessibilityRole="search">
          <Text style={styles.searchLabel}>검색</Text>
          <Text style={styles.searchText}>해운대, 감천문화마을, 카페</Text>
        </View>

        <View style={styles.notice} accessibilityRole="summary">
          <Text style={styles.noticeTitle}>게스트 저장 사용 중</Text>
          <Text style={styles.noticeText}>로그인 전 담은 장소는 초안 플랜에 남고, 로그인 후 계정으로 이어서 관리할 수 있습니다.</Text>
        </View>

        <View style={styles.filterRow} accessibilityLabel="장소 필터">
          {BROWSE_FILTERS.map((filter) => {
            const selected = filter === selectedFilter
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityLabel={`${filter} 장소 보기`}
                accessibilityState={{ selected }}
                hitSlop={8}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.mapSummary}>
          <View style={styles.mapPinCluster} accessible={false}>
            <View style={styles.mapPinLarge} />
            <View style={styles.mapPinSmall} />
            <View style={styles.mapPinRoute} />
          </View>
          <View style={styles.mapCopy}>
            <Text style={styles.mapTitle}>부산 동선 요약</Text>
            <Text style={styles.mapText}>해안선을 따라 이동 시간이 짧은 장소를 먼저 보여줍니다.</Text>
          </View>
          <View style={styles.mapMetric}>
            <Text style={styles.mapMetricValue}>5곳</Text>
            <Text style={styles.mapMetricLabel}>후보</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추천 장소</Text>
          <Text style={styles.sectionMeta}>{visiblePlaces.length}개</Text>
        </View>

        {visiblePlaces.length > 0 ? (
          <View style={styles.placeList}>
            {visiblePlaces.map((place) => {
              const statusStyle = getStatusBadgeStyle(place.statusTone)
              return (
                <View key={place.id} style={styles.placeCard}>
                  <ImageBackground
                    source={{ uri: place.image }}
                    imageStyle={styles.placeImage}
                    resizeMode="cover"
                    style={styles.placeImageFrame}
                  >
                    <View style={[styles.statusBadge, statusStyle.badge]}>
                      <Text style={[styles.statusBadgeText, statusStyle.text]}>{place.status}</Text>
                    </View>
                  </ImageBackground>

                  <View style={styles.placeBody}>
                    <View style={styles.placeTitleRow}>
                      <View style={styles.placeTitleGroup}>
                        <Text style={styles.placeName}>{place.name}</Text>
                        <Text style={styles.placeRegion}>{place.region}</Text>
                      </View>
                      <Text style={styles.qualityScore}>{place.qualityScore}</Text>
                    </View>

                    <View style={styles.tagRow}>
                      {place.tags.map((tag) => (
                        <View key={tag} style={styles.tagPill}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.placeMetaGrid}>
                      <View style={styles.metaBlock}>
                        <Text style={styles.metaValue}>{place.dwellMinutes}분</Text>
                        <Text style={styles.metaLabel}>권장 체류</Text>
                      </View>
                      <View style={styles.metaBlock}>
                        <Text style={styles.metaValue}>{place.travelMinutes}분</Text>
                        <Text style={styles.metaLabel}>예상 이동</Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${place.name} 저장하기`}
                        accessibilityState={{ selected: place.saved }}
                        hitSlop={8}
                        style={[styles.secondaryButton, place.saved && styles.savedButton]}
                      >
                        <Text style={[styles.secondaryButtonText, place.saved && styles.savedButtonText]}>
                          {place.saved ? '저장됨' : '저장'}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${place.name} 플랜에 추가하기`}
                        hitSlop={8}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>플랜에 추가</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyState} accessibilityRole="summary">
            <Text style={styles.emptyTitle}>표시할 장소가 없습니다.</Text>
            <Text style={styles.emptyText}>다른 필터를 선택하거나 네트워크가 안정된 뒤 다시 시도하세요.</Text>
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
    paddingTop: 18,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.neutral700,
  },
  searchShell: {
    minHeight: 58,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.primary300,
    backgroundColor: COLORS.neutral0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  notice: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.plum50,
    borderWidth: 1,
    borderColor: COLORS.plum300,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.plum700,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.neutral300,
    backgroundColor: COLORS.neutral0,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    borderColor: COLORS.primary500,
    backgroundColor: COLORS.primary50,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutral700,
  },
  filterTextSelected: {
    color: COLORS.primary700,
  },
  mapSummary: {
    minHeight: 132,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: COLORS.primary900,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  mapPinCluster: {
    width: 72,
    height: 84,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary50,
    borderWidth: 1,
    borderColor: COLORS.primary100,
  },
  mapPinLarge: {
    position: 'absolute',
    top: 16,
    left: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary500,
  },
  mapPinSmall: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.plum700,
  },
  mapPinRoute: {
    position: 'absolute',
    left: 30,
    top: 40,
    width: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primary300,
    transform: [{ rotate: '34deg' }],
  },
  mapCopy: {
    flex: 1,
    gap: 6,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  mapText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.neutral700,
  },
  mapMetric: {
    width: 58,
    minHeight: 58,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  mapMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutral500,
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
  placeList: {
    gap: 14,
  },
  placeCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral0,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    overflow: 'hidden',
    shadowColor: COLORS.primary900,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  placeImageFrame: {
    height: 144,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  placeImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderCurve: 'continuous',
  },
  statusBadge: {
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusOpen: {
    backgroundColor: COLORS.successLight,
  },
  statusOpenText: {
    color: COLORS.successDark,
  },
  statusRisk: {
    backgroundColor: COLORS.gold50,
  },
  statusRiskText: {
    color: COLORS.gold900,
  },
  statusWarning: {
    backgroundColor: COLORS.coral50,
  },
  statusWarningText: {
    color: COLORS.coral900,
  },
  placeBody: {
    padding: 14,
    gap: 12,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  placeTitleGroup: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  placeRegion: {
    fontSize: 14,
    color: COLORS.neutral500,
  },
  qualityScore: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  placeMetaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBlock: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.neutral50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.neutral500,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: COLORS.neutral300,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  savedButton: {
    borderColor: COLORS.plum300,
    backgroundColor: COLORS.plum50,
  },
  savedButtonText: {
    color: COLORS.plum700,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: COLORS.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.neutral0,
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
