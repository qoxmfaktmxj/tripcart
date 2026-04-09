'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  GUEST_MIGRATION_EVENT,
  GUEST_MIGRATION_FLASH_KEY,
  GUEST_MIGRATION_LOCK_KEY,
  GUEST_STATE_EVENT,
  applyMigrationResult,
  buildGuestMigrationFlashMessage,
  hasGuestData,
  migrateGuestStateWithFetch,
  readGuestStateFromStorage,
  writeGuestStateToStorage,
} from '@/lib/guest-state'

export function GuestSessionSync(): null {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user || typeof window === 'undefined') {
      return
    }

    if (window.sessionStorage.getItem(GUEST_MIGRATION_LOCK_KEY) === user.id) {
      return
    }

    const state = readGuestStateFromStorage()
    if (!hasGuestData(state)) {
      return
    }

    let cancelled = false
    window.sessionStorage.setItem(GUEST_MIGRATION_LOCK_KEY, user.id)

    void (async () => {
      try {
        const result = await migrateGuestStateWithFetch(state, window.fetch.bind(window))
        if (cancelled) return

        const nextState = applyMigrationResult(state, result)
        writeGuestStateToStorage(nextState)

        const flashMessage = buildGuestMigrationFlashMessage(result)
        if (flashMessage) {
          window.sessionStorage.setItem(GUEST_MIGRATION_FLASH_KEY, flashMessage)
        }

        window.dispatchEvent(new Event(GUEST_STATE_EVENT))
        window.dispatchEvent(new Event(GUEST_MIGRATION_EVENT))
        router.refresh()
      } finally {
        window.sessionStorage.removeItem(GUEST_MIGRATION_LOCK_KEY)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, router, user])

  return null
}
