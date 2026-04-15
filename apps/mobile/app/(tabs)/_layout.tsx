import { Tabs } from 'expo-router'
import { COLORS } from './design-data'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary700,
        tabBarInactiveTintColor: COLORS.neutral500,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: COLORS.neutral0,
          borderTopColor: COLORS.neutral100,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="search" options={{ title: '검색' }} />
      <Tabs.Screen name="plans" options={{ title: '플랜' }} />
      <Tabs.Screen name="plan-detail" options={{ title: '상세' }} />
    </Tabs>
  )
}
