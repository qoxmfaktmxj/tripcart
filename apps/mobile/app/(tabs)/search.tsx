import { StatusBar } from 'expo-status-bar'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS, PLACE_CARDS } from './design-data'

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>장소 둘러보기</Text>
          <View style={styles.homeChip}>
            <Text style={styles.homeChipText}>홈으로</Text>
          </View>
        </View>

        <TextInput placeholder="예: 해운대" placeholderTextColor={COLORS.neutral500} style={styles.searchInput} />

        <View style={styles.list}>
          {PLACE_CARDS.map((place) => (
            <View key={place.name} style={styles.card}>
              <Image source={{ uri: place.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{place.name}</Text>
                <Text style={styles.cardRegion}>{place.region}</Text>
                <View style={styles.tagRow}>
                  {place.tags.map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Pressable style={styles.addButton}>
                <Text style={styles.addButtonText}>담기</Text>
              </Pressable>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary900,
  },
  homeChip: {
    borderRadius: 12,
    backgroundColor: COLORS.neutral100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  homeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.neutral500,
  },
  searchInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary300,
    paddingHorizontal: 18,
    fontSize: 18,
    color: COLORS.primary900,
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.neutral0,
    borderRadius: 18,
    padding: 12,
    shadowColor: '#264653',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardImage: {
    width: 92,
    height: 92,
    borderRadius: 18,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.neutral900,
  },
  cardRegion: {
    fontSize: 16,
    color: COLORS.neutral500,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
  addButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary300,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary700,
  },
})
