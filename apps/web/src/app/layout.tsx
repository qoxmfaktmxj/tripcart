import type { Metadata } from 'next'
import { GuestMigrationBanner } from '@/components/guest-migration-banner'
import { GuestSessionSync } from '@/components/guest-session-sync'
import './globals.css'

export const metadata: Metadata = {
  title: 'TripCart',
  description: '여행 장소를 장바구니에 담고, 실행 가능한 일정으로 정리하세요.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="ko">
      <body>
        <GuestSessionSync />
        <GuestMigrationBanner />
        {children}
      </body>
    </html>
  )
}
