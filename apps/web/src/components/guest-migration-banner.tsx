'use client'

import { useEffect, useState } from 'react'
import { GUEST_MIGRATION_EVENT, GUEST_MIGRATION_FLASH_KEY } from '@/lib/guest-state'

export function GuestMigrationBanner(): React.JSX.Element | null {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const syncMessage = () => {
      const nextMessage = window.sessionStorage.getItem(GUEST_MIGRATION_FLASH_KEY)
      setMessage(nextMessage)
      if (nextMessage) {
        window.sessionStorage.removeItem(GUEST_MIGRATION_FLASH_KEY)
      }
    }

    syncMessage()
    window.addEventListener(GUEST_MIGRATION_EVENT, syncMessage)

    return () => {
      window.removeEventListener(GUEST_MIGRATION_EVENT, syncMessage)
    }
  }, [])

  if (!message) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 border-b border-primary-300 bg-primary-50/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 text-sm text-primary-900">
        <p className="font-medium">{message}</p>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem(GUEST_MIGRATION_FLASH_KEY)
            setMessage(null)
          }}
          className="shrink-0 rounded-md border border-primary-300 px-3 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
