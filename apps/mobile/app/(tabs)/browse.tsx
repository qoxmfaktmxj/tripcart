import { Image, ScrollView, StyleSheet } from 'react-native'
import browseReference from '../../assets/reference/browse.png'

export default function BrowseScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <Image source={browseReference} style={styles.image} resizeMode="cover" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  container: {
    alignItems: 'stretch',
  },
  image: {
    width: '100%',
    aspectRatio: 768 / 1365,
  },
})

