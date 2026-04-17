import { StatusBar } from 'expo-status-bar'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, FEATURED_PLANS } from './design-data'

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>나의 여행 계획</Text>
        <Text style={styles.subtitle}>다가오는 여행과 지난 여행을 한눈에 확인하세요.</Text>

        <View style={styles.planList}>
          {FEATURED_PLANS.map((plan) => (
            <ImageBackground key={plan.title} source={{ uri: plan.image }} imageStyle={styles.planImage} style={styles.planCard}>
              <View style={styles.overlay}>
                <View style={styles.badge}><Text style={styles.badgeText}>{plan.badge}</Text></View>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDate}>{plan.date}</Text>
                <Text style={styles.planMeta}>장소 8곳 • 이동 수단: 자동차</Text>
              </View>
            </ImageBackground>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="새 여행 계획 만들기"
          hitSlop={8}
          style={styles.floatingButton}
        >
          <Text style={styles.floatingButtonText}>＋ 새 계획 만들기</Text>
        </Pressable>
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
    paddingTop: 24,
    paddingBottom: 120,
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.primary900,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.neutral700,
    marginTop: 4,
  },
  planList: {
    gap: 16,
    marginTop: 6,
  },
  planCard: {
    height: 182,
    justifyContent: 'flex-end',
  },
  planImage: {
    borderRadius: 24,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(15,23,42,0.28)',
    borderRadius: 24,
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 999,
    backgroundColor: '#EAF8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary700,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
  planDate: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
  },
  planMeta: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
  },
  floatingButton: {
    alignSelf: 'flex-end',
    marginTop: -72,
    marginRight: 10,
    height: 60,
    borderRadius: 999,
    backgroundColor: COLORS.primary500,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#264653',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
})
