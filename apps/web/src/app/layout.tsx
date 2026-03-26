import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TripCart',
  description: '여행 일정을 최적화하고 실행하세요',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
