'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSavedPlaces } from '@/hooks/use-saved-places'

type PlaceDetail = {
  id: string
  name: string
  category: string
  region: string
  address: string | null
  phone: string | null
  website_url: string | null
  data_quality_score: number
  typical_dwell_minutes: number | null
  open_hours: Array<{
    day_of_week: number
    open_time: string
    close_time: string
    last_order_time: string | null
  }>
  break_windows: Array<{
    day_of_week: number
    start_time: string
    end_time: string
  }>
}

type PlaceDetailResponse = {
  data: PlaceDetail
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const KOREAN_DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '식당',
  cafe: '카페',
  attraction: '관광지',
  lodging: '숙소',
  shopping: '쇼핑',
  activity: '체험',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
}

export default function PlaceDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>()
  const placeId = typeof params.id === 'string' ? params.id : ''

  const [place, setPlace] = useState<PlaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { user, authLoading, isSaved, isMutating, save, remove, storageMode } =
    useSavedPlaces()

  useEffect(() => {
    if (!placeId) {
      setError('장소 ID가 없습니다.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/v1/places/${placeId}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`장소를 불러오지 못했습니다. (${response.status})`)
        }

        const payload = (await response.json()) as PlaceDetailResponse
        if (!cancelled) {
          setPlace(payload.data ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '장소 정보를 불러오지 못했습니다.'
          setError(message)
          setPlace(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [placeId])

  const handleSaveToggle = async () => {
    if (!placeId || !place) return

    setActionError(null)

    const result = isSaved(placeId)
      ? await remove(placeId)
      : await save({
          id: place.id,
          name: place.name,
          category: place.category,
          region: place.region,
          address: place.address,
          thumbnail_url: null,
          data_quality_score: place.data_quality_score,
          tags: [],
        })

    if (!result.ok && result.reason === 'REQUEST_FAILED') {
      setActionError(result.message ?? '저장 상태를 업데이트하지 못했습니다.')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">장소 상세</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              {loading ? '불러오는 중...' : place?.name ?? '장소 상세'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/places"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              목록으로
            </Link>
            {placeId ? (
              <Link
                href={`/api/v1/places/${placeId}`}
                prefetch={false}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                API
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSaveToggle()}
              disabled={!placeId || authLoading || isMutating(placeId)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading
                ? '확인 중...'
                : placeId && isMutating(placeId)
                  ? storageMode === 'guest'
                    ? '담는 중...'
                    : '저장 중...'
                  : !user
                    ? isSaved(placeId)
                      ? '담음'
                      : '장바구니 담기'
                    : isSaved(placeId)
                      ? '저장됨'
                      : '저장'}
            </button>
          </div>
        </div>

        {actionError ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {actionError}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 p-5 text-sm text-primary-700">
            장소 상세를 불러오는 중입니다...
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {error}
          </section>
        ) : !place ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            장소 정보를 찾을 수 없습니다.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {CATEGORY_LABELS[place.category] ?? place.category}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-primary-900">{place.name}</h2>
                <div className="mt-4 space-y-2 text-sm text-neutral-500">
                  <p>지역: {REGION_LABELS[place.region] ?? place.region}</p>
                  <p>주소: {place.address ?? '주소 정보 없음'}</p>
                  <p>전화: {place.phone ?? '정보 없음'}</p>
                  <p>
                    웹사이트:{' '}
                    {place.website_url ? (
                      <a
                        href={place.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary-700 underline"
                      >
                        {place.website_url}
                      </a>
                    ) : (
                      '정보 없음'
                    )}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-neutral-500">데이터 품질 점수</p>
                <p className="mt-2 text-4xl font-bold text-primary-900">{place.data_quality_score}</p>
                <p className="mt-4 text-sm text-neutral-500">
                  권장 체류 시간:{' '}
                  {place.typical_dwell_minutes ? `${place.typical_dwell_minutes}분` : '미설정'}
                </p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-primary-900">운영 시간</h3>
                <div className="mt-4 space-y-3">
                  {place.open_hours.length > 0 ? (
                    place.open_hours.map((item) => (
                      <div
                        key={`${place.id}-hour-${item.day_of_week}-${item.open_time}`}
                        className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-primary-900">
                          {KOREAN_DAY_LABELS[item.day_of_week] ??
                            DAY_LABELS[item.day_of_week] ??
                            item.day_of_week}
                        </span>
                        <span className="font-mono text-neutral-500">
                          {item.open_time} - {item.close_time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">등록된 운영 시간이 없습니다.</p>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-primary-900">브레이크 타임</h3>
                <div className="mt-4 space-y-3">
                  {place.break_windows.length > 0 ? (
                    place.break_windows.map((item) => (
                      <div
                        key={`${place.id}-break-${item.day_of_week}-${item.start_time}`}
                        className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-primary-900">
                          {KOREAN_DAY_LABELS[item.day_of_week] ??
                            DAY_LABELS[item.day_of_week] ??
                            item.day_of_week}
                        </span>
                        <span className="font-mono text-coral-500">
                          {item.start_time} - {item.end_time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">등록된 브레이크 타임이 없습니다.</p>
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
