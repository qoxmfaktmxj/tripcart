import { StatusBar } from 'expo-status-bar'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, TIMELINE_ITEMS } from './design-data'

export default function PlanDetailScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>플랜 상세 및 일정</Text>

        <View style={styles.deviceFrame}>
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>←</Text>
            <Text style={styles.topBarMeta}>9:41</Text>
            <Text style={styles.topBarMeta}>⌁</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>캡처용 플랜</Text>
            <Text style={styles.summarySub}>시작시간: 2026. 4. 9. 오후 4:18</Text>
            <Text style={styles.summarySub}>이동 수단: 자동차</Text>
          </View>

          <View style={styles.timelineWrap}>
            <View style={styles.timelineLine} />
            {TIMELINE_ITEMS.map((item, index) => (
              <View key={item.title} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { top: 20 + index * 108 }]}>
                  <Text style={styles.timelineDotText}>{index < 3 ? '차' : '도'}</Text>
                </View>
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.editButton}>
              <Text style={styles.editButtonText}>수정</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FBFB',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    alignItems: 'center',
    gap: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral900,
    textAlign: 'center',
  },
  deviceFrame: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 34,
    backgroundColor: COLORS.neutral0,
    padding: 16,
    shadowColor: '#264653',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.neutral900,
  },
  topBarMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary500,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  summarySub: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.neutral500,
  },
  timelineWrap: {
    position: 'relative',
    paddingLeft: 18,
    paddingBottom: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 10,
    bottom: 12,
    width: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primary100,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineDot: {
    position: 'absolute',
    left: -1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9F1EE',
  },
  timelineDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary700,
  },
  timelineCard: {
    marginLeft: 34,
    width: 250,
    borderRadius: 18,
    backgroundColor: COLORS.neutral0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#264653',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.neutral500,
  },
  timelineTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  bottomBar: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
    paddingTop: 14,
  },
  editButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral0,
  },
})
