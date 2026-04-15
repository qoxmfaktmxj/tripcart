import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GUEST_MIGRATION_FLASH_KEY,
  GUEST_MIGRATION_LOCK_KEY,
  GUEST_STATE_STORAGE_KEY,
  applyMigrationResult,
  buildGuestMigrationFlashMessage,
  clearGuestStateStorage,
  createEmptyGuestState,
  createGuestPlan,
  hasGuestData,
  migrateGuestStateWithFetch,
  normalizeGuestState,
  readGuestStateFromStorage,
  removeGuestPlan,
  removeGuestSavedPlace,
  updateGuestPlan,
  upsertGuestSavedPlace,
  writeGuestStateToStorage,
  type GuestState,
} from './guest-state'

type MockStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  dump: () => Record<string, string>
}

function createMockStorage(initial: Record<string, string> = {}): MockStorage {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    dump: () => Object.fromEntries(store.entries()),
  }
}

function createSampleState(): GuestState {
  return {
    version: 1,
    saved_places: [
      {
        id: 'place-1',
        name: '해운대',
        category: 'attraction',
        region: 'busan',
        address: '부산 해운대구',
        thumbnail_url: null,
        data_quality_score: 90,
        tags: ['바다'],
        saved_at: '2026-04-09T00:00:00.000Z',
      },
    ],
    plans: [
      {
        id: 'guest-plan-1',
        title: '부산 드라이브',
        region: 'busan',
        transport_mode: 'car',
        start_at: null,
        origin_name: '부전역',
        status: 'draft',
        version: 1,
        created_at: '2026-04-09T00:00:00.000Z',
        updated_at: '2026-04-09T00:00:00.000Z',
      },
    ],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as typeof globalThis & { window?: unknown }).window
})

describe('guest-state', () => {
  it('잘못된 입력은 빈 guest 상태로 정규화한다', () => {
    expect(normalizeGuestState(null)).toEqual(createEmptyGuestState())
    expect(normalizeGuestState('broken')).toEqual(createEmptyGuestState())
    expect(normalizeGuestState(123)).toEqual(createEmptyGuestState())
  })

  it('저장 장소를 추가하고 중복이면 최신 값으로 덮어쓴다', () => {
    const empty = createEmptyGuestState()
    const first = upsertGuestSavedPlace(empty, {
      id: 'place-1',
      name: '해운대',
      category: 'attraction',
      region: 'busan',
      address: null,
      thumbnail_url: null,
      data_quality_score: 88,
      tags: ['바다'],
    })

    expect(first.saved_places).toHaveLength(1)

    const second = upsertGuestSavedPlace(first, {
      id: 'place-1',
      name: '해운대 재저장',
      category: 'attraction',
      region: 'busan',
      address: '부산 해운대구',
      thumbnail_url: null,
      data_quality_score: 92,
      tags: ['야경'],
    })

    expect(second.saved_places).toHaveLength(1)
    expect(second.saved_places[0]!.name).toBe('해운대 재저장')
    expect(second.saved_places[0]!.saved_at).not.toBe(first.saved_places[0]!.saved_at)
  })

  it('저장 장소와 게스트 초안 플랜을 제거할 수 있다', () => {
    const state = createSampleState()

    expect(removeGuestSavedPlace(state, 'place-1').saved_places).toHaveLength(0)
    expect(removeGuestPlan(state, 'guest-plan-1').plans).toHaveLength(0)
  })

  it('게스트 초안 플랜 생성 시 고유 id를 만든다', () => {
    const base = createEmptyGuestState()
    const first = createGuestPlan(base, {
      title: '첫 일정',
      region: 'busan',
      transport_mode: 'car',
    })
    const second = createGuestPlan(first.state, {
      title: '두 번째 일정',
      region: 'busan',
      transport_mode: 'walk',
    })

    expect(first.plan.id).not.toBe(second.plan.id)
    expect(second.state.plans).toHaveLength(2)
  })

  it('게스트 초안 플랜을 수정하면 기존 id를 유지하고 updated_at을 갱신한다', () => {
    const state = createSampleState()
    const updated = updateGuestPlan(state, 'guest-plan-1', {
      title: '부산 야경 드라이브',
      region: 'busan',
      transport_mode: 'walk',
      start_at: '2026-04-12T09:00:00.000Z',
      origin_name: '서면역',
    })

    expect(updated.plan?.id).toBe('guest-plan-1')
    expect(updated.plan?.title).toBe('부산 야경 드라이브')
    expect(updated.plan?.transport_mode).toBe('walk')
    expect(updated.plan?.start_at).toBe('2026-04-12T09:00:00.000Z')
    expect(updated.plan?.origin_name).toBe('서면역')
    expect(updated.plan?.updated_at).not.toBe(state.plans[0]?.updated_at)
  })

  it('migration 결과에서 성공한 항목만 local 상태에서 제거한다', () => {
    const state = createSampleState()
    const next = applyMigrationResult(state, {
      migratedSavedPlaceIds: ['place-1'],
      failedSavedPlaceIds: [],
      migratedPlanIds: [],
      failedPlanIds: ['guest-plan-1'],
    })

    expect(next.saved_places).toHaveLength(0)
    expect(next.plans).toHaveLength(1)
    expect(next.plans[0]!.id).toBe('guest-plan-1')
  })

  it('migration 성공 flash 문구를 만든다', () => {
    expect(
      buildGuestMigrationFlashMessage({
        migratedSavedPlaceIds: ['place-1'],
        failedSavedPlaceIds: [],
        migratedPlanIds: ['guest-plan-1'],
        failedPlanIds: [],
      }),
    ).toBe('비로그인 상태에서 담아둔 장소 1개와 초안 플랜 1개를 계정으로 가져왔습니다.')
  })

  it('migration 일부 실패 시 브라우저에 남겼다는 안내를 붙인다', () => {
    expect(
      buildGuestMigrationFlashMessage({
        migratedSavedPlaceIds: ['place-1'],
        failedSavedPlaceIds: [],
        migratedPlanIds: [],
        failedPlanIds: ['guest-plan-1'],
      }),
    ).toBe(
      '비로그인 상태에서 담아둔 장소 1개를 계정으로 가져왔습니다. 일부 항목은 브라우저에 남겨 두었습니다.',
    )
  })

  it('migration이 전부 실패하면 재로그인을 안내한다', () => {
    expect(
      buildGuestMigrationFlashMessage({
        migratedSavedPlaceIds: [],
        failedSavedPlaceIds: ['place-1'],
        migratedPlanIds: [],
        failedPlanIds: ['guest-plan-1'],
      }),
    ).toBe('비로그인 상태 데이터 이관에 실패했습니다. 잠시 후 다시 로그인해 보세요.')
  })

  it('게스트 데이터가 하나라도 있으면 true를 반환한다', () => {
    expect(hasGuestData(createEmptyGuestState())).toBe(false)
    expect(hasGuestData(createSampleState())).toBe(true)
  })

  it('storage read, write, clear가 guest 상태와 세션 키를 정리한다', () => {
    const localStorage = createMockStorage()
    const sessionStorage = createMockStorage({
      [GUEST_MIGRATION_FLASH_KEY]: 'flash',
      [GUEST_MIGRATION_LOCK_KEY]: 'lock',
    })

    ;(globalThis as typeof globalThis & { window?: unknown }).window = {
      sessionStorage: sessionStorage as unknown as Storage,
    } as unknown as Window & typeof globalThis

    writeGuestStateToStorage(createSampleState(), localStorage)
    expect(readGuestStateFromStorage(localStorage).saved_places).toHaveLength(1)

    clearGuestStateStorage(localStorage)

    expect(localStorage.dump()[GUEST_STATE_STORAGE_KEY]).toBeUndefined()
    expect(sessionStorage.dump()[GUEST_MIGRATION_FLASH_KEY]).toBeUndefined()
    expect(sessionStorage.dump()[GUEST_MIGRATION_LOCK_KEY]).toBeUndefined()
  })

  it('storage quota 오류가 나도 예외를 던지지 않는다', () => {
    const badStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
      removeItem: () => {},
    }

    expect(() => writeGuestStateToStorage(createSampleState(), badStorage)).not.toThrow()
  })

  it('migration fetch는 201과 409를 모두 성공으로 처리한다', async () => {
    const state = createSampleState()
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 409 }))

    const result = await migrateGuestStateWithFetch(state, fetchImpl)

    expect(result).toEqual({
      migratedSavedPlaceIds: ['place-1'],
      failedSavedPlaceIds: [],
      migratedPlanIds: ['guest-plan-1'],
      failedPlanIds: [],
    })
  })

  it('migration fetch 일부 실패 시 실패한 항목만 남긴다', async () => {
    const state = createSampleState()
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
      .mockRejectedValueOnce(new Error('network failed'))

    const result = await migrateGuestStateWithFetch(state, fetchImpl)

    expect(result).toEqual({
      migratedSavedPlaceIds: [],
      failedSavedPlaceIds: ['place-1'],
      migratedPlanIds: [],
      failedPlanIds: ['guest-plan-1'],
    })
  })
})
