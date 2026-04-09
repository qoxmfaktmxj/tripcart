'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

type SavedPlaceItem = {
  id: string
  user_id: string
  place: {
    id: string
    name: string
    category: string
    lat: number
    lng: number
    region: string
    thumbnail_url: string | null
  }
  note: string | null
  visited: boolean
  created_at: string
}

type SavedPlacesResponse = {
  data: SavedPlaceItem[]
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
  const [items, setItems] = useState<SavedPlaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutatingIds, setMutatingIds] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!user) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/me/saved-places', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Failed to load saved places (${response.status})`)
      }

      const payload = (await response.json()) as SavedPlacesResponse
      setItems(payload.data ?? [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load saved places'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    void load()
  }, [authLoading, load])

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
    async (placeId: string): Promise<SaveResult> => {
      if (!user) {
        return { ok: false, reason: 'AUTH_REQUIRED' }
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
            message: payload?.error?.message ?? `Failed to save place (${response.status})`,
          }
        }

        const payload = (await response.json()) as { data: SavedPlaceItem }
        setItems((current) => {
          const next = current.filter((item) => item.place.id !== placeId)
          return [payload.data, ...next]
        })

        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          reason: 'REQUEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to save place',
        }
      } finally {
        setMutating(placeId, false)
      }
    },
    [user],
  )

  const remove = useCallback(
    async (placeId: string): Promise<SaveResult> => {
      if (!user) {
        return { ok: false, reason: 'AUTH_REQUIRED' }
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
              payload?.error?.message ?? `Failed to remove saved place (${response.status})`,
          }
        }

        setItems((current) => current.filter((item) => item.place.id !== placeId))
        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          reason: 'REQUEST_FAILED',
          message: err instanceof Error ? err.message : 'Failed to remove saved place',
        }
      } finally {
        setMutating(placeId, false)
      }
    },
    [user],
  )

  return {
    user,
    authLoading,
    loading,
    error,
    items,
    savedIds,
    isSaved: (placeId: string) => savedIds.has(placeId),
    isMutating: (placeId: string) => mutatingIds.includes(placeId),
    save,
    remove,
    reload: load,
  }
}
