'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGuestState } from '@/hooks/use-guest-state'
import { GUEST_MIGRATION_EVENT, type GuestPlan } from '@/lib/guest-state'
import type { TravelMode } from '@tripcart/types'

type PlanListItem = {
  id: string
  title: string
  start_at: string | null
  region: string | null
  transport_mode: TravelMode
  status: 'draft' | 'ready' | 'archived'
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

const DEFAULT_REGION = 'busan'
const TRANSPORT_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']
const TRANSPORT_LABELS: Record<TravelMode, string> = {
  car: '자동차',
  transit: '대중교통',
  walk: '도보',
  bicycle: '자전거',
}
const STATUS_LABELS: Record<PlanListItem['status'], string> = {
  draft: '초안',
  ready: '준비됨',
  archived: '보관됨',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
}

function formatDate(value: string | null): string {
  if (!value) return '미정'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function PlansPage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const {
    loading: guestLoading,
    plans: guestPlans,
    savedPlaces: guestSavedPlaces,
    addPlan: addGuestPlan,
    deletePlan: deleteGuestPlan,
  } = useGuestState()
  const [items, setItems] = useState<PlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [transportMode, setTransportMode] = useState<TravelMode>('car')

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

      if (!user) {
        addGuestPlan({
          title: normalizedTitle,
          region: normalizedRegion,
          transport_mode: transportMode,
        })
        setTitle('')
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
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(payload?.error?.message ?? `플랜을 만들지 못했습니다. (${response.status})`)
      }

      setTitle('')
      await loadPlans()
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 만들지 못했습니다'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const showLoading = authLoading || (user ? loading : guestLoading)
  const showEmptyState = user ? items.length === 0 : guestPlans.length === 0

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gold-700">초안 일정</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              플랜 목록과 생성
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              {user
                ? '계정 플랜 API를 사용해 초안 목록을 보여주고, 새 플랜을 만들 수 있습니다.'
                : '로그인 없이 브라우저에 초안 플랜을 저장할 수 있습니다. 로그인하면 그대로 계정으로 가져옵니다.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/saved-places"
              className="inline-flex h-10 items-center justify-center rounded-md border border-plum-300 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-50"
            >
              저장한 장소
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              홈으로
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-primary-900">초안 플랜 만들기</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {user
                ? '현재 플랜 생성 API 계약에 맞춘 최소 생성 흐름입니다.'
                : `브라우저에 임시 저장됩니다. 현재 담아둔 장소 ${guestSavedPlaces.length}개와 함께 나중에 계정으로 이어서 관리할 수 있습니다.`}
            </p>
          </div>

          <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handleCreate}>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-primary-900">제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 부산 주말 드라이브"
                required
                className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-primary-900">지역</span>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                required
                className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
              >
                <option value={DEFAULT_REGION}>부산</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-primary-900">이동 수단</span>
              <select
                value={transportMode}
                onChange={(event) => setTransportMode(event.target.value as TravelMode)}
                className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {TRANSPORT_LABELS[mode]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? user
                    ? '생성 중...'
                    : '저장 중...'
                  : user
                    ? '초안 만들기'
                    : '브라우저에 초안 저장'}
              </button>
            </div>

            <div className="flex items-end">
              {user ? (
                <Link
                  href="/api/v1/plans"
                  prefetch={false}
                  className="inline-flex h-11 w-full items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  플랜 API 보기
                </Link>
              ) : (
                <Link
                  href="/login?next=/plans"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md border border-plum-300 bg-plum-50 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-100"
                >
                  로그인 후 계정에 가져오기
                </Link>
              )}
            </div>
          </form>

          {submitError ? (
            <p className="mt-4 rounded-md border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
              {submitError}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-primary-900">내 플랜</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {user
                  ? '현재 플랜 목록 API 응답을 그대로 사용합니다.'
                  : '비로그인 상태 초안은 현재 브라우저에만 저장됩니다.'}
              </p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                새로고침
              </button>
            ) : null}
          </div>

          {showLoading ? (
            <div className="rounded-xl border border-primary-300 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              플랜을 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : showEmptyState ? (
            <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
              아직 플랜이 없습니다. 위에서 첫 초안을 만들어 보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {(user ? items : guestPlans).map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-neutral-300 bg-neutral-0 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                        {user ? STATUS_LABELS[item.status] : '브라우저 초안'}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-primary-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                      v{item.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-neutral-500 sm:grid-cols-2">
                    <p>지역: {item.region ? (REGION_LABELS[item.region] ?? item.region) : '없음'}</p>
                    <p>이동 수단: {TRANSPORT_LABELS[item.transport_mode]}</p>
                    <p>시작 시각: {formatDate(item.start_at)}</p>
                    <p>업데이트: {formatDate(item.updated_at)}</p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    {user ? (
                      <>
                        <Link
                          href={`/plans/${item.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                        >
                          플랜 열기
                        </Link>
                        <Link
                          href={`/api/v1/plans/${item.id}`}
                          prefetch={false}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                        >
                          API 상세 보기
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login?next=/plans"
                          className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                        >
                          로그인 후 이어서 보기
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteGuestPlan((item as GuestPlan).id)}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
