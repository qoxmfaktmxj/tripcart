'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGuestState } from '@/hooks/use-guest-state'
import { GUEST_MIGRATION_EVENT } from '@/lib/guest-state'
import type { PlanStatus, TravelMode } from '@tripcart/types'

type PlanListItem = {
  id: string
  title: string
  start_at: string | null
  region: string | null
  transport_mode: TravelMode
  status: PlanStatus
  version: number
  created_at: string
  updated_at: string
}

type PlansResponse = {
  data: PlanListItem[]
  meta: {
    cursor: string | null
    has_more: boolean
  }
}

type PlanCard = {
  id: string
  title: string
  start_at: string | null
  region: string | null
  transport_mode: TravelMode
  statusLabel: string
  image: string
  source: 'sample' | 'guest' | 'account'
  sourcePlanId?: string
  subtitle: string
}

const DEFAULT_REGION = 'busan'
const TRANSPORT_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']
const TRANSPORT_LABELS: Record<TravelMode, string> = {
  car: '자동차',
  transit: '대중교통',
  walk: '도보',
  bicycle: '자전거',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
  seoul: '서울',
  sokcho: '속초',
}
const SHOWCASE_PLANS: Array<
  Pick<PlanCard, 'id' | 'title' | 'start_at' | 'region' | 'transport_mode' | 'image' | 'subtitle'> & {
    statusLabel: string
  }
> = [
  {
    id: 'showcase-busan',
    title: '부산 주말 드라이브',
    start_at: '2024-06-14T09:00:00.000Z',
    region: 'busan',
    transport_mode: 'car',
    statusLabel: '추천 예시',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    subtitle: '부산 • 이동 수단: 자동차',
  },
  {
    id: 'showcase-seorak',
    title: '설악산 단풍 여행',
    start_at: '2024-10-25T02:00:00.000Z',
    region: 'sokcho',
    transport_mode: 'car',
    statusLabel: '추천 예시',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    subtitle: '속초 • 이동 수단: 자동차',
  },
  {
    id: 'showcase-seoul',
    title: '서울 시티 투어',
    start_at: '2024-12-20T03:00:00.000Z',
    region: 'seoul',
    transport_mode: 'car',
    statusLabel: '추천 예시',
    image:
      'https://images.unsplash.com/photo-1538485399081-7c89798d8b0c?auto=format&fit=crop&w=1600&q=80',
    subtitle: '서울 • 이동 수단: 자동차',
  },
]

function formatPlanDateTime(value: string | null): string {
  if (!value) return '날짜를 정해 주세요'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function compactTitle(title: string): string {
  return title.length > 14 ? `${title.slice(0, 13)}…` : title
}

const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  draft: '초안',
  optimized: '최적화 완료',
  confirmed: '예정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소됨',
}

function getStatusLabel(status: PlanStatus): string {
  return PLAN_STATUS_LABELS[status]
}

function AddIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export default function PlansPage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const {
    loading: guestLoading,
    plans: guestPlans,
    savedPlaces: guestSavedPlaces,
    addPlan: addGuestPlan,
    replacePlan,
    deletePlan: deleteGuestPlan,
  } = useGuestState()
  const [items, setItems] = useState<PlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [editingGuestPlanId, setEditingGuestPlanId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [transportMode, setTransportMode] = useState<TravelMode>('car')
  const [startAt, setStartAt] = useState('')

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/plans?limit=20', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`플랜을 불러오지 못했습니다. (${response.status})`)
      }

      const payload = (await response.json()) as PlansResponse
      setItems(payload.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 불러오지 못했습니다'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      setError(null)
      setItems([])
      return
    }
    void loadPlans()
  }, [authLoading, loadPlans, user])

  useEffect(() => {
    if (!user) return

    const handleMigration = () => {
      void loadPlans()
    }

    window.addEventListener(GUEST_MIGRATION_EVENT, handleMigration)
    return () => {
      window.removeEventListener(GUEST_MIGRATION_EVENT, handleMigration)
    }
  }, [loadPlans, user])

  const resetComposer = useCallback(() => {
    setEditingGuestPlanId(null)
    setTitle('')
    setRegion(DEFAULT_REGION)
    setTransportMode('car')
    setStartAt('')
    setSubmitError(null)
    setShowComposer(false)
  }, [])

  const openComposer = useCallback(
    (next: {
      title?: string
      region?: string | null
      transportMode?: TravelMode
      startAt?: string | null
      editingGuestPlanId?: string | null
    }) => {
      setEditingGuestPlanId(next.editingGuestPlanId ?? null)
      setTitle(next.title ?? '')
      setRegion(next.region ?? DEFAULT_REGION)
      setTransportMode(next.transportMode ?? 'car')
      setStartAt(toDatetimeLocal(next.startAt ?? null))
      setSubmitError(null)
      setShowComposer(true)
    },
    [],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const normalizedTitle = title.trim()
      const normalizedRegion = region.trim()

      if (!normalizedTitle) {
        throw new Error('플랜 제목을 입력해 주세요.')
      }

      if (!startAt) {
        throw new Error('출발 날짜와 시간을 입력해 주세요.')
      }

      const parsedStartAt = new Date(startAt)
      if (Number.isNaN(parsedStartAt.getTime())) {
        throw new Error('유효한 날짜와 시간을 입력해 주세요.')
      }

      const startAtIso = parsedStartAt.toISOString()

      if (!user) {
        if (editingGuestPlanId) {
          replacePlan(editingGuestPlanId, {
            title: normalizedTitle,
            region: normalizedRegion,
            transport_mode: transportMode,
            start_at: startAtIso,
          })
        } else {
          addGuestPlan({
            title: normalizedTitle,
            region: normalizedRegion,
            transport_mode: transportMode,
            start_at: startAtIso,
          })
        }

        resetComposer()
        return
      }

      const response = await fetch('/api/v1/plans', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: normalizedTitle,
          region: normalizedRegion,
          transport_mode: transportMode,
          start_at: startAtIso,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(payload?.error?.message ?? `플랜을 만들지 못했습니다. (${response.status})`)
      }

      resetComposer()
      await loadPlans()
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 만들지 못했습니다'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGuestDraft = () => {
    if (!editingGuestPlanId) return
    deleteGuestPlan(editingGuestPlanId)
    resetComposer()
  }

  const visibleItems = user ? items : guestPlans
  const showLoading = isMounted && (authLoading || (user ? loading : guestLoading))
  const cards = useMemo<PlanCard[]>(() => {
    const actualCards: PlanCard[] = visibleItems.map((item, index) => {
      const fallbackImage =
        SHOWCASE_PLANS[index % SHOWCASE_PLANS.length] ?? SHOWCASE_PLANS[0]!
      const regionLabel = item.region ? REGION_LABELS[item.region] ?? item.region : '지역 미정'

      return {
        id: `actual-${item.id}`,
        title: item.title,
        start_at: item.start_at,
        region: item.region,
        transport_mode: item.transport_mode,
        statusLabel: user ? getStatusLabel((item as PlanListItem).status) : '브라우저 초안',
        image: fallbackImage.image,
        source: user ? 'account' : 'guest',
        sourcePlanId: item.id,
        subtitle: `${regionLabel} • 이동 수단: ${TRANSPORT_LABELS[item.transport_mode]}`,
      }
    })

    const padded = [...actualCards]
    for (const sample of SHOWCASE_PLANS) {
      if (padded.length >= 3) break
      padded.push({
        ...sample,
        source: 'sample',
      })
    }

    return padded.slice(0, 3)
  }, [user, visibleItems])

  const openComposerWithSample = (card: PlanCard) => {
    openComposer({
      title: card.title,
      region: card.region,
      transportMode: card.transport_mode,
      startAt: card.start_at,
      editingGuestPlanId: null,
    })
  }

  const openGuestDraft = (planId: string | undefined) => {
    if (!planId) return
    const plan = guestPlans.find((item) => item.id === planId)
    if (!plan) return

    openComposer({
      title: plan.title,
      region: plan.region,
      transportMode: plan.transport_mode,
      startAt: plan.start_at,
      editingGuestPlanId: plan.id,
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,242,240,0.92),_rgba(248,250,251,1)_42%,_rgba(252,247,235,0.92)_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="text-center">
          <h1 className="text-[4rem] font-bold tracking-tight text-primary-900 sm:text-[4.6rem]">
            나의 여행
          </h1>
          <p className="mt-4 text-[1.2rem] text-neutral-700">
            다가오는 여행, 지난 여행 확인하기
          </p>
          {!user ? (
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-primary-200 bg-white/82 px-5 py-3 text-sm font-medium text-primary-800 shadow-sm backdrop-blur">
              담아둔 장소 {guestSavedPlaces.length}개는 로그인 시 계정에 연동됩니다.
            </div>
          ) : null}
        </header>

        {submitError ? (
          <section className="rounded-[1.75rem] border border-coral-500 bg-white px-5 py-4 text-sm text-coral-500 shadow-sm">
            {submitError}
          </section>
        ) : null}

        <section className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const visibleTitle = compactTitle(card.title)
            const body = (
              <div
                className="relative flex min-h-[220px] items-end overflow-hidden rounded-[1.9rem] border border-white/85 px-5 pb-5 pt-5 text-left text-white shadow-[0_18px_42px_rgba(38,70,83,0.12)]"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.58) 100%), url(${card.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="absolute right-4 top-4 rounded-full border border-[#6ca8a2] bg-[#eaf8f5] px-3 py-[0.35rem] text-[0.82rem] font-semibold text-[#2f6f73] shadow-sm">
                  {card.statusLabel}
                </span>
                <div className="max-w-[88%] drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                  <h2 className="text-[1.78rem] font-bold leading-[1.14] tracking-tight">
                    {visibleTitle}
                  </h2>
                  <p className="mt-2 text-[1.12rem] font-medium text-white/92">
                    {formatPlanDateTime(card.start_at)}
                  </p>
                  <p className="mt-4 text-[0.95rem] font-medium text-white/88">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            )

            if (card.source === 'sample') {
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => openComposerWithSample(card)}
                  className="transition hover:-translate-y-1"
                >
                  {body}
                </button>
              )
            }

            if (card.source === 'guest') {
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => openGuestDraft(card.sourcePlanId)}
                  className="transition hover:-translate-y-1"
                >
                  {body}
                </button>
              )
            }

            return (
              <Link
                key={card.id}
                href={`/plans/${card.sourcePlanId ?? ''}`}
                className="transition hover:-translate-y-1"
              >
                {body}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() =>
              openComposer({
                title: '',
                region: DEFAULT_REGION,
                transportMode: 'car',
                startAt: null,
                editingGuestPlanId: null,
              })
            }
            className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.9rem] border border-white/85 bg-white shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 xl:col-start-1"
          >
            <span className="text-[#2f6f73]">
              <AddIcon />
            </span>
            <span className="mt-4 text-[2.45rem] font-bold tracking-tight text-primary-900">
              새 계획 만들기
            </span>
          </button>
        </section>

        {showComposer ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/86 p-6 shadow-[0_20px_50px_rgba(38,70,83,0.12)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-900">
                  {editingGuestPlanId ? '브라우저 수정' : '새 계획 만들기'}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  {editingGuestPlanId
                    ? '브라우저에 저장된 초안을 수정합니다. 날짜를 정하면 카드에도 즉시 반영됩니다.'
                    : user
                      ? '현재 플랜 생성 API에 연결된 화면입니다. 출발 날짜와 시간을 함께 저장합니다.'
                      : '브라우저에 임시 저장한 뒤, 로그인하면 계정으로 이어집니다.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {!user ? (
                  <Link
                    href="/login?next=/plans"
                    className="rounded-full border border-plum-300 bg-plum-50 px-5 py-3 text-sm font-semibold text-plum-700 transition hover:bg-plum-100"
                  >
                    로그인 후 계정으로 가져오기
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={resetComposer}
                  className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  닫기
                </button>
              </div>
            </div>

            <form
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.9fr_0.95fr_1.15fr_auto]"
              onSubmit={handleCreate}
            >
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-neutral-600">제목</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예: 부산 주말 드라이브"
                  className="h-12 rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-neutral-600">지역</span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="h-12 rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                >
                  <option value={DEFAULT_REGION}>부산</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-neutral-600">이동 수단</span>
                <select
                  value={transportMode}
                  onChange={(event) => setTransportMode(event.target.value as TravelMode)}
                  className="h-12 rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                >
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {TRANSPORT_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-neutral-600">출발 일시</span>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="h-12 rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                />
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#2f8a88] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.22)] transition hover:bg-[#2a7674] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? '저장 중...'
                    : editingGuestPlanId
                      ? '수정'
                      : '생성'}
                </button>
                {editingGuestPlanId ? (
                  <button
                    type="button"
                    onClick={handleDeleteGuestDraft}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-coral-500 px-4 text-sm font-semibold text-coral-500 transition hover:bg-coral-50"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}

        {showLoading ? (
          <section className="rounded-[1.75rem] border border-primary-300 bg-white px-5 py-4 text-sm text-primary-700 shadow-sm">
            플랜을 불러오는 중입니다...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[1.75rem] border border-coral-500 bg-white px-5 py-4 text-sm text-coral-500 shadow-sm">
            {error}
          </section>
        ) : null}
      </div>
    </main>
  )
}
