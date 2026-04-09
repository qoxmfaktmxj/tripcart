'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGuestState } from '@/hooks/use-guest-state'
import {
  GUEST_MIGRATION_EVENT,
  type GuestSavedPlaceInput,
} from '@/lib/guest-state'

type SavedPlaceViewItem = {
  id: string
  source: 'account' | 'guest'
  place: {
    id: string
    name: string
    category: string
    region: string
    thumbnail_url: string | null
  }
  note: string | null
}

type SavedPlacesResponse = {
  data: Array<{
    id: string
    place: {
      id: string
      name: string
      category: string
      region: string
      thumbnail_url: string | null
    }
    note: string | null
  }>
  meta: {
    cursor: string | null
    has_more: boolean
  }
}

type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'AUTH_REQUIRED' | 'REQUEST_FAILED'; message?: string }

export function useSavedPlaces() {
  const { user, loading: authLoading } = useAuth()
  const {
    loading: guestLoading,
    savedPlaces: guestSavedPlaces,
    savePlace,
    removePlace,
  } = useGuestState()
  const [items, setItems] = useState<SavedPlaceViewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutatingIds, setMutatingIds] = useState<string[]>([])

  const guestItems = useMemo<SavedPlaceViewItem[]>(
    () =>
      guestSavedPlaces.map((place) => ({
        id: `guest-${place.id}`,
        source: 'guest',
        place: {
          id: place.id,
          name: place.name,
          category: place.category,
          region: place.region,
          thumbnail_url: place.thumbnail_url,
        },
        note: place.address,
      })),
    [guestSavedPlaces],
  )

  const load = useCallback(async () => {
    if (!user) {
      setItems(guestItems)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/me/saved-places', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`저장한 장소를 불러오지 못했습니다. (${response.status})`)
      }

      const payload = (await response.json()) as SavedPlacesResponse
      setItems(
        (payload.data ?? []).map((item) => ({
          id: item.id,
          source: 'account',
          place: item.place,
          note: item.note,
        })),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '저장한 장소를 불러오지 못했습니다.'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [guestItems, user])

  useEffect(() => {
    if (authLoading) return
    void load()
  }, [authLoading, load])

  useEffect(() => {
    if (!user) return

    const handleMigration = () => {
      void load()
    }

    window.addEventListener(GUEST_MIGRATION_EVENT, handleMigration)
    return () => {
      window.removeEventListener(GUEST_MIGRATION_EVENT, handleMigration)
    }
  }, [load, user])

  const savedIds = useMemo(
    () => new Set(items.map((item) => item.place.id)),
    [items],
  )

  const setMutating = (placeId: string, active: boolean) => {
    setMutatingIds((current) => {
      if (active) {
        return current.includes(placeId) ? current : [...current, placeId]
      }
      return current.filter((id) => id !== placeId)
    })
  }

  const save = useCallback(
    async (place: GuestSavedPlaceInput): Promise<SaveResult> => {
      const placeId = place.id

      if (!user) {
        savePlace(place)
        return { ok: true }
      }

      setMutating(placeId, true)
      setError(null)

      try {
        const response = await fetch('/api/v1/me/saved-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ place_id: placeId }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null
          return {
            ok: false,
            reason: 'REQUEST_FAILED',
            message: payload?.error?.message ?? `장소를 저장하지 못했습니다. (${response.status})`,
          }
        }

        const payload = (await response.json()) as {
          data: {
            id: string
            place: {
              id: string
              name: string
              category: string
              region: string
              thumbnail_url: string | null
            }
            note: string | null
          }
        }
        setItems((current) => {
          const next = current.filter((item) => item.place.id !== placeId)
          return [
            {
              id: payload.data.id,
              source: 'account',
              place: payload.data.place,
              note: payload.data.note,
            },
            ...next,
          ]
        })

        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          reason: 'REQUEST_FAILED',
          message: err instanceof Error ? err.message : '장소를 저장하지 못했습니다.',
        }
      } finally {
        setMutating(placeId, false)
      }
    },
    [savePlace, user],
  )

  const remove = useCallback(
    async (placeId: string): Promise<SaveResult> => {
      if (!user) {
        removePlace(placeId)
        return { ok: true }
      }

      setMutating(placeId, true)
      setError(null)

      try {
        const response = await fetch(`/api/v1/me/saved-places/${placeId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null
          return {
            ok: false,
            reason: 'REQUEST_FAILED',
            message:
              payload?.error?.message ?? `저장한 장소를 해제하지 못했습니다. (${response.status})`,
          }
        }

        setItems((current) => current.filter((item) => item.place.id !== placeId))
        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          reason: 'REQUEST_FAILED',
          message: err instanceof Error ? err.message : '저장한 장소를 해제하지 못했습니다.',
        }
      } finally {
        setMutating(placeId, false)
      }
    },
    [removePlace, user],
  )

  return {
    user,
    authLoading,
    loading: user ? loading : guestLoading,
    error,
    items,
    storageMode: user ? 'account' : 'guest',
    savedIds,
    isSaved: (placeId: string) => savedIds.has(placeId),
    isMutating: (placeId: string) => mutatingIds.includes(placeId),
    save,
    remove,
    reload: load,
  }
}
