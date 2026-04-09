'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSavedPlaces } from '@/hooks/use-saved-places'

type PlaceListItem = {
  id: string
  name: string
  category: string
  region: string
  address: string | null
  thumbnail_url: string | null
  data_quality_score: number
  tags: string[]
}

type PlacesResponse = {
  data: PlaceListItem[]
  meta: {
    cursor: string | null
    has_more: boolean
  }
}

const DEFAULT_REGION = 'busan'
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

export default function PlacesPage(): React.JSX.Element {
  const router = useRouter()
  const [items, setItems] = useState<PlaceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const { user, authLoading, isSaved, isMutating, save, remove } = useSavedPlaces()

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      region: DEFAULT_REGION,
      limit: '12',
    })
    if (submittedQuery.trim()) {
      params.set('q', submittedQuery.trim())
    }
    return `/api/v1/places?${params.toString()}`
  }, [submittedQuery])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(endpoint, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`장소를 불러오지 못했습니다. (${response.status})`)
        }

        const payload = (await response.json()) as PlacesResponse
        if (!cancelled) {
          setItems(payload.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '장소를 불러오지 못했습니다'
          setError(message)
          setItems([])
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
  }, [endpoint])

  const handleSaveToggle = async (placeId: string) => {
    setActionError(null)

    if (!user) {
      router.push('/login?next=%2Fplaces')
      return
    }

    const result = isSaved(placeId) ? await remove(placeId) : await save(placeId)
    if (!result.ok && result.reason === 'REQUEST_FAILED') {
      setActionError(result.message ?? '저장 상태를 업데이트하지 못했습니다')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">1단계 시작점</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">장소 둘러보기</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              현재 장소 조회 API를 사용해 부산 시드 데이터를 간단한 목록 흐름으로
              보여줍니다.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            홈으로
          </Link>
        </div>

        <form
          className="flex flex-col gap-3 rounded-2xl border border-neutral-300 bg-white p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmittedQuery(query)
          }}
        >
          <label className="flex-1">
            <span className="mb-2 block text-sm font-medium text-primary-900">장소명 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 해운대"
              className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
            />
          </label>
          <div className="flex gap-3 sm:items-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              검색
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              onClick={() => {
                setQuery('')
                setSubmittedQuery('')
              }}
            >
              초기화
            </button>
          </div>
        </form>

        {actionError ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {actionError}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 p-5 text-sm text-primary-700">
            장소를 불러오는 중입니다...
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {error}
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            현재 조건에 맞는 장소가 없습니다.
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex h-full flex-col gap-4 rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-primary-900">{item.name}</h2>
                  </div>
                  <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                    품질 {item.data_quality_score}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-neutral-500">
                  <p>{REGION_LABELS[item.region] ?? item.region}</p>
                  <p>{item.address ?? '주소 정보 없음'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.tags.length > 0 ? (
                    item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                      태그 없음
                    </span>
                  )}
                </div>

                <div className="mt-auto flex gap-3 pt-2">
                  <Link
                    href={`/places/${item.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    상세 보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSaveToggle(item.id)}
                    disabled={authLoading || isMutating(item.id)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading
                      ? '확인 중...'
                      : isMutating(item.id)
                        ? '저장 중...'
                        : !user
                          ? '로그인 후 저장'
                          : isSaved(item.id)
                            ? '저장됨'
                            : '저장'}
                  </button>
                  <Link
                    href={`/api/v1/places/${item.id}`}
                    prefetch={false}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                  >
                    API
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}


