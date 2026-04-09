import type { TravelMode } from '@tripcart/types'

export const GUEST_STATE_STORAGE_KEY = 'tripcart_guest_v1'
export const GUEST_STATE_EVENT = 'tripcart-guest-state-updated'
export const GUEST_MIGRATION_EVENT = 'tripcart-migration-complete'
export const GUEST_MIGRATION_FLASH_KEY = 'tripcart_guest_migration_flash'
export const GUEST_MIGRATION_LOCK_KEY = 'tripcart_guest_migration_lock'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type GuestSavedPlace = {
  id: string
  name: string
  category: string
  region: string
  address: string | null
  thumbnail_url: string | null
  data_quality_score: number
  tags: string[]
  saved_at: string
}

export type GuestSavedPlaceInput = Omit<GuestSavedPlace, 'saved_at'>

export type GuestPlan = {
  id: string
  title: string
  region: string
  transport_mode: TravelMode
  start_at: string | null
  origin_name: string | null
  status: 'draft'
  version: number
  created_at: string
  updated_at: string
}

export type GuestPlanInput = {
  title: string
  region: string
  transport_mode: TravelMode
  start_at?: string | null
  origin_name?: string | null
}

export type GuestState = {
  version: 1
  saved_places: GuestSavedPlace[]
  plans: GuestPlan[]
}

export type GuestMigrationResult = {
  migratedSavedPlaceIds: string[]
  failedSavedPlaceIds: string[]
  migratedPlanIds: string[]
  failedPlanIds: string[]
}

function nowIso(): string {
  return new Date().toISOString()
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function isTravelMode(value: unknown): value is TravelMode {
  return value === 'car' || value === 'transit' || value === 'walk' || value === 'bicycle'
}

export function createEmptyGuestState(): GuestState {
  return {
    version: 1,
    saved_places: [],
    plans: [],
  }
}

export function hasGuestData(state: GuestState): boolean {
  return state.saved_places.length > 0 || state.plans.length > 0
}

export function normalizeGuestState(raw: unknown): GuestState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyGuestState()
  }

  const source = raw as Record<string, unknown>
  const savedPlaces = Array.isArray(source.saved_places)
    ? source.saved_places.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const item = entry as Record<string, unknown>
        if (typeof item.id !== 'string' || typeof item.name !== 'string') return []

        return [
          {
            id: item.id,
            name: item.name,
            category: typeof item.category === 'string' ? item.category : 'other',
            region: typeof item.region === 'string' ? item.region : 'unknown',
            address: typeof item.address === 'string' ? item.address : null,
            thumbnail_url: typeof item.thumbnail_url === 'string' ? item.thumbnail_url : null,
            data_quality_score:
              typeof item.data_quality_score === 'number' && Number.isFinite(item.data_quality_score)
                ? item.data_quality_score
                : 0,
            tags: Array.isArray(item.tags)
              ? item.tags.filter((tag): tag is string => typeof tag === 'string')
              : [],
            saved_at: typeof item.saved_at === 'string' ? item.saved_at : nowIso(),
          },
        ]
      })
    : []

  const plans = Array.isArray(source.plans)
    ? source.plans.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const item = entry as Record<string, unknown>
        if (
          typeof item.id !== 'string' ||
          typeof item.title !== 'string' ||
          typeof item.region !== 'string' ||
          !isTravelMode(item.transport_mode)
        ) {
          return []
        }

        return [
          {
            id: item.id,
            title: item.title,
            region: item.region,
            transport_mode: item.transport_mode,
            start_at: typeof item.start_at === 'string' ? item.start_at : null,
            origin_name: typeof item.origin_name === 'string' ? item.origin_name : null,
            status: 'draft' as const,
            version:
              typeof item.version === 'number' && Number.isFinite(item.version)
                ? item.version
                : 1,
            created_at: typeof item.created_at === 'string' ? item.created_at : nowIso(),
            updated_at: typeof item.updated_at === 'string' ? item.updated_at : nowIso(),
          },
        ]
      })
    : []

  return {
    version: 1,
    saved_places: savedPlaces,
    plans,
  }
}

export function readGuestStateFromStorage(storage?: StorageLike): GuestState {
  const target = getStorage(storage)
  if (!target) return createEmptyGuestState()

  const raw = target.getItem(GUEST_STATE_STORAGE_KEY)
  if (!raw) return createEmptyGuestState()

  try {
    return normalizeGuestState(JSON.parse(raw))
  } catch {
    return createEmptyGuestState()
  }
}

export function writeGuestStateToStorage(state: GuestState, storage?: StorageLike): void {
  const target = getStorage(storage)
  if (!target) return

  try {
    target.setItem(GUEST_STATE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage quota or privacy mode failures should not crash the UI.
  }
}

export function clearGuestStateStorage(storage?: StorageLike): void {
  const target = getStorage(storage)
  if (target) {
    try {
      target.removeItem(GUEST_STATE_STORAGE_KEY)
    } catch {
      // Ignore storage cleanup failures.
    }
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(GUEST_MIGRATION_FLASH_KEY)
      window.sessionStorage.removeItem(GUEST_MIGRATION_LOCK_KEY)
    } catch {
      // Ignore session cleanup failures.
    }
  }
}

export function upsertGuestSavedPlace(
  state: GuestState,
  place: GuestSavedPlaceInput,
): GuestState {
  const nextPlace: GuestSavedPlace = {
    ...place,
    tags: [...place.tags],
    saved_at: nowIso(),
  }

  return {
    ...state,
    saved_places: [nextPlace, ...state.saved_places.filter((item) => item.id !== place.id)],
  }
}

export function removeGuestSavedPlace(state: GuestState, placeId: string): GuestState {
  return {
    ...state,
    saved_places: state.saved_places.filter((item) => item.id !== placeId),
  }
}

export function createGuestPlan(
  state: GuestState,
  input: GuestPlanInput,
): { state: GuestState; plan: GuestPlan } {
  const timestamp = nowIso()
  const plan: GuestPlan = {
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    region: input.region.trim(),
    transport_mode: input.transport_mode,
    start_at: input.start_at ?? null,
    origin_name: input.origin_name?.trim() || null,
    status: 'draft',
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
  }

  return {
    plan,
    state: {
      ...state,
      plans: [plan, ...state.plans],
    },
  }
}

export function removeGuestPlan(state: GuestState, planId: string): GuestState {
  return {
    ...state,
    plans: state.plans.filter((plan) => plan.id !== planId),
  }
}

export function applyMigrationResult(
  state: GuestState,
  result: GuestMigrationResult,
): GuestState {
  return {
    ...state,
    saved_places: state.saved_places.filter(
      (item) => !result.migratedSavedPlaceIds.includes(item.id),
    ),
    plans: state.plans.filter((plan) => !result.migratedPlanIds.includes(plan.id)),
  }
}

export function buildGuestMigrationFlashMessage(result: GuestMigrationResult): string | null {
  const migratedSavedPlaces = result.migratedSavedPlaceIds.length
  const migratedPlans = result.migratedPlanIds.length
  const failedCount = result.failedSavedPlaceIds.length + result.failedPlanIds.length

  if (migratedSavedPlaces === 0 && migratedPlans === 0) {
    return failedCount > 0
      ? '비로그인 상태 데이터 이관에 실패했습니다. 잠시 후 다시 로그인해 보세요.'
      : null
  }

  const parts: string[] = []
  if (migratedSavedPlaces > 0) {
    parts.push(`장소 ${migratedSavedPlaces}개`)
  }
  if (migratedPlans > 0) {
    parts.push(`초안 플랜 ${migratedPlans}개`)
  }

  const baseMessage = `비로그인 상태에서 담아둔 ${parts.join('와 ')}를 계정으로 가져왔습니다.`

  if (failedCount > 0) {
    return `${baseMessage} 일부 항목은 브라우저에 남겨 두었습니다.`
  }

  return baseMessage
}

export async function migrateGuestStateWithFetch(
  state: GuestState,
  fetchImpl: typeof fetch,
): Promise<GuestMigrationResult> {
  const result: GuestMigrationResult = {
    migratedSavedPlaceIds: [],
    failedSavedPlaceIds: [],
    migratedPlanIds: [],
    failedPlanIds: [],
  }

  for (const place of state.saved_places) {
    try {
      const response = await fetchImpl('/api/v1/me/saved-places', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ place_id: place.id }),
      })

      if (response.ok || response.status === 409) {
        result.migratedSavedPlaceIds.push(place.id)
      } else {
        result.failedSavedPlaceIds.push(place.id)
      }
    } catch {
      result.failedSavedPlaceIds.push(place.id)
    }
  }

  for (const plan of state.plans) {
    try {
      const response = await fetchImpl('/api/v1/plans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: plan.title,
          region: plan.region,
          transport_mode: plan.transport_mode,
          start_at: plan.start_at,
          origin_name: plan.origin_name,
        }),
      })

      if (response.ok || response.status === 409) {
        result.migratedPlanIds.push(plan.id)
      } else {
        result.failedPlanIds.push(plan.id)
      }
    } catch {
      result.failedPlanIds.push(plan.id)
    }
  }

  return result
}
