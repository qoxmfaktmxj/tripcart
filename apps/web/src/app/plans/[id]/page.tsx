'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TravelMode } from '@tripcart/types'

type PlanStop = {
  id: string
  sequence: number
  kind: 'place' | 'custom'
  place_id: string | null
  custom_name: string | null
  locked: boolean
  dwell_minutes: number | null
}

type PlanDetail = {
  id: string
  title: string
  start_at: string | null
  region: string | null
  transport_mode: TravelMode
  status: 'draft' | 'ready' | 'archived'
  version: number
  origin_name: string | null
  origin_lat: number | null
  origin_lng: number | null
  created_at: string
  updated_at: string
  stops: PlanStop[]
}

type PlanDetailResponse = {
  data: PlanDetail
}

const TRANSPORT_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']
const TRANSPORT_LABELS: Record<TravelMode, string> = {
  car: '자동차',
  transit: '대중교통',
  walk: '도보',
  bicycle: '자전거',
}
const STATUS_LABELS: Record<PlanDetail['status'], string> = {
  draft: '초안',
  ready: '준비 완료',
  archived: '보관됨',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
}
const STOP_KIND_LABELS: Record<PlanStop['kind'], string> = {
  place: '장소',
  custom: '직접 입력',
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

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export default function PlanDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = useMemo(() => (typeof params?.id === 'string' ? params.id : ''), [params])

  const [item, setItem] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [transportMode, setTransportMode] = useState<TravelMode>('car')
  const [originName, setOriginName] = useState('')

  const loadPlan = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`플랜을 불러오지 못했습니다. (${response.status})`)
      }

      const payload = (await response.json()) as PlanDetailResponse
      const nextItem = payload.data
      setItem(nextItem)
      setTitle(nextItem.title)
      setStartAt(toDatetimeLocal(nextItem.start_at))
      setTransportMode(nextItem.transport_mode)
      setOriginName(nextItem.origin_name ?? '')
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 불러오지 못했습니다.'
      setError(message)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadPlan()
  }, [loadPlan])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setSaveError('플랜 제목은 필수입니다.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: trimmedTitle,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          transport_mode: transportMode,
          origin_name: originName.trim() || null,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(
          payload?.error?.message ?? `플랜을 저장하지 못했습니다. (${response.status})`,
        )
      }

      await loadPlan()
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 저장하지 못했습니다.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || deleting) return
    if (!window.confirm('이 플랜을 삭제할까요?')) return

    setDeleting(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(
          payload?.error?.message ?? `플랜을 삭제하지 못했습니다. (${response.status})`,
        )
      }

      router.push('/plans')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : '플랜을 삭제하지 못했습니다.'
      setSaveError(message)
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gold-700">1단계 초안 플랜</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">플랜 상세와 수정</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              기존 인증 기반 상세 API를 그대로 사용하고, 초안 플랜의 최소 수정과 삭제 흐름을
              제공합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/plans"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              플랜 목록으로
            </Link>
            <Link
              href={`/api/v1/plans/${id}`}
              prefetch={false}
              className="inline-flex h-10 items-center justify-center rounded-md border border-plum-300 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-50"
            >
              API 상세 보기
            </Link>
          </div>
        </div>

        {loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            플랜을 불러오는 중입니다...
          </section>
        ) : error || !item ? (
          <section className="rounded-2xl border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
            {error ?? '플랜을 찾을 수 없습니다.'}
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                    {STATUS_LABELS[item.status]}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-primary-900">{item.title}</h2>
                </div>
                <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                  v{item.version}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-neutral-500 sm:grid-cols-2">
                <p>지역: {item.region ? (REGION_LABELS[item.region] ?? item.region) : '미지정'}</p>
                <p>이동 수단: {TRANSPORT_LABELS[item.transport_mode]}</p>
                <p>시작 시각: {formatDate(item.start_at)}</p>
                <p>수정 시각: {formatDate(item.updated_at)}</p>
                <p>출발지 이름: {item.origin_name ?? '미지정'}</p>
                <p>
                  출발지 좌표:{' '}
                  {item.origin_lat != null && item.origin_lng != null
                    ? `${item.origin_lat}, ${item.origin_lng}`
                    : '미지정'}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary-900">초안 플랜 수정</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  현재 플랜 수정 API를 사용하는 최소 수정 화면입니다. 이번 단계에서는 지역은
                  읽기 전용으로 유지합니다.
                </p>
              </div>

              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSave}>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-primary-900">제목</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-primary-900">시작 시각</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
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

                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-primary-900">출발지 이름</span>
                  <input
                    value={originName}
                    onChange={(event) => setOriginName(event.target.value)}
                    placeholder="예: 부산역"
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
                </label>

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? '저장 중...' : '변경사항 저장'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-coral-500 px-4 text-sm font-semibold text-coral-500 transition hover:bg-coral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? '삭제 중...' : '플랜 삭제'}
                  </button>
                </div>
              </form>

              {saveError ? (
                <p className="mt-4 rounded-md border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
                  {saveError}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary-900">스톱 요약</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  현재 상세 응답에 포함된 스톱 정보를 읽기 전용으로 보여줍니다.
                </p>
              </div>

              {item.stops.length === 0 ? (
                <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                  아직 스톱이 없습니다. 스톱 편집은 이번 범위에 포함되지 않습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {item.stops.map((stop) => (
                    <article
                      key={stop.id}
                      className="rounded-xl border border-neutral-300 bg-neutral-0 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                            {STOP_KIND_LABELS[stop.kind]}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-primary-900">
                            #{stop.sequence} {stop.custom_name ?? stop.place_id ?? '이름 없는 스톱'}
                          </h3>
                        </div>
                        {stop.locked ? (
                          <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                            고정됨
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-neutral-500 sm:grid-cols-2">
                        <p>장소 ID: {stop.place_id ?? '없음'}</p>
                        <p>체류 시간(분): {stop.dwell_minutes ?? '없음'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
