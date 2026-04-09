'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  GUEST_STATE_EVENT,
  createEmptyGuestState,
  createGuestPlan,
  readGuestStateFromStorage,
  removeGuestPlan,
  removeGuestSavedPlace,
  upsertGuestSavedPlace,
  writeGuestStateToStorage,
  type GuestPlanInput,
  type GuestSavedPlaceInput,
  type GuestState,
} from '@/lib/guest-state'

function dispatchGuestStateEvent(): void {
  window.dispatchEvent(new Event(GUEST_STATE_EVENT))
}

export function useGuestState() {
  const [state, setState] = useState<GuestState>(createEmptyGuestState())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setState(readGuestStateFromStorage())
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reload()
    }, 0)

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'tripcart_guest_v1') {
        reload()
      }
    }
    const handleGuestState = () => reload()

    window.addEventListener('storage', handleStorage)
    window.addEventListener(GUEST_STATE_EVENT, handleGuestState)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(GUEST_STATE_EVENT, handleGuestState)
    }
  }, [reload])

  const commit = useCallback((nextState: GuestState) => {
    writeGuestStateToStorage(nextState)
    setState(nextState)
    dispatchGuestStateEvent()
  }, [])

  const savePlace = useCallback(
    (place: GuestSavedPlaceInput) => {
      commit(upsertGuestSavedPlace(state, place))
    },
    [commit, state],
  )

  const removePlace = useCallback(
    (placeId: string) => {
      commit(removeGuestSavedPlace(state, placeId))
    },
    [commit, state],
  )

  const addPlan = useCallback(
    (input: GuestPlanInput) => {
      const next = createGuestPlan(state, input)
      commit(next.state)
      return next.plan
    },
    [commit, state],
  )

  const deletePlan = useCallback(
    (planId: string) => {
      commit(removeGuestPlan(state, planId))
    },
    [commit, state],
  )

  return {
    loading,
    state,
    savedPlaces: state.saved_places,
    plans: state.plans,
    savePlace,
    removePlace,
    addPlan,
    deletePlan,
    reload,
  }
}
