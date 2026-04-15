import { StatusBar } from 'expo-status-bar'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, FEATURED_PLANS, HERO_IMAGE, PLACE_CARDS } from './design-data'

const CATEGORIES = ['전체', '카페', '식당', '관광지'] as const

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>TRIPCART</Text>

        <ImageBackground source={{ uri: HERO_IMAGE }} imageStyle={styles.heroImage} style={styles.hero}>
          <View style={styles.heroSearchBar}>
            <Text style={styles.heroSearchText}>장소 또는 플랜 검색</Text>
          </View>
        </ImageBackground>

        <View style={styles.categoryRow}>
          {CATEGORIES.map((category, index) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={[styles.categoryLabel, index === 0 && styles.categoryLabelActive]}>{category}</Text>
              {index === 0 ? <View style={styles.categoryUnderline} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>인기 장소</Text>
        <View style={styles.cardGrid}>
          {PLACE_CARDS.slice(0, 4).map((place) => (
            <View key={place.name} style={styles.placeCard}>
              <ImageBackground source={{ uri: place.image }} imageStyle={styles.placeImage} style={styles.placeImageWrap} />
              <Text style={styles.placeName}>{place.name}</Text>
              <View style={styles.placeMetaRow}>
                <Text style={styles.placeCategory}>{place.tags[0]}</Text>
                <Text style={styles.placeSave}>저장</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>추천 플랜</Text>
        <View style={styles.planList}>
          {FEATURED_PLANS.map((plan) => (
            <ImageBackground key={plan.title} source={{ uri: plan.image }} imageStyle={styles.planImage} style={styles.planCard}>
              <View style={styles.planOverlay}>
                <View style={styles.planBadge}><Text style={styles.planBadgeText}>{plan.badge}</Text></View>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDate}>{plan.date}</Text>
              </View>
            </ImageBackground>
          ))}
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>새 계획 만들기</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral0,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 18,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary900,
    letterSpacing: 0.6,
  },
  hero: {
    height: 220,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  heroImage: {
    borderRadius: 24,
  },
  heroSearchBar: {
    alignSelf: 'stretch',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  heroSearchText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.neutral0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral500,
  },
  categoryLabelActive: {
    color: COLORS.primary900,
  },
  categoryUnderline: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary500,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.neutral900,
    marginTop: 6,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  placeCard: {
    width: '47%',
    backgroundColor: COLORS.neutral0,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#264653',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  placeImageWrap: {
    height: 130,
  },
  placeImage: {
    borderRadius: 18,
  },
  placeName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary900,
  },
  placeMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary700,
  },
  placeSave: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  planList: {
    gap: 16,
  },
  planCard: {
    height: 190,
    justifyContent: 'flex-end',
  },
  planImage: {
    borderRadius: 22,
  },
  planOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(15,23,42,0.28)',
    borderRadius: 22,
  },
  planBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EAF8F5',
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  planTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
  planDate: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
  },
  primaryButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary500,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
})
