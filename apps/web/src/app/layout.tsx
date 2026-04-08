import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TripCart',
  description: 'Optimize travel plans and execution.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}