'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSavedPlaces } from '@/hooks/use-saved-places'
import { normalizePlaceCategoryParam } from '@/lib/home-view'
import type { PlaceCategory } from '@tripcart/types'

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

type RegionFilter = 'all' | 'busan'
type CategoryFilter = 'all' | PlaceCategory

const DEFAULT_REGION: RegionFilter = 'busan'
const DEFAULT_CATEGORY: CategoryFilter = 'all'
const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: '전체',
  restaurant: '맛집',
  cafe: '카페',
  attraction: '명소',
  accommodation: '숙소',
  shopping: '쇼핑',
  activity: '체험',
  other: '기타',
}
const REGION_LABELS: Record<RegionFilter, string> = {
  all: '전체 지역',
  busan: '부산',
}
const PLACE_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
] as const

const CATEGORY_FALLBACK_IMAGES: Partial<Record<string, string>> = {
  restaurant: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=900&q=80',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
  attraction: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=900&q=80',
  accommodation: 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2e?auto=format&fit=crop&w=900&q=80',
  activity: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  shopping: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80',
}
const BUSAN_AREAS = ['해운대', '광안리', '감천', '남포동', '기장', '서면'] as const
const CATEGORY_OPTIONS: CategoryFilter[] = [
  'all',
  'restaurant',
  'cafe',
  'attraction',
  'accommodation',
  'activity',
  'shopping',
  'other',
]
const REGION_OPTIONS: RegionFilter[] = ['busan', 'all']

function getPlaceImage(item: PlaceListItem, index: number): string {
  if (item.thumbnail_url) return item.thumbnail_url
  const categoryImage = CATEGORY_FALLBACK_IMAGES[item.category]
  if (categoryImage) return categoryImage
  return PLACE_IMAGES.at(index % PLACE_IMAGES.length) ?? PLACE_IMAGES[0] ?? ''
}

function getCategoryLabel(category: string): string {
  const normalized = normalizePlaceCategoryParam(category) ?? 'other'
  return CATEGORY_LABELS[normalized]
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.55rem] w-[1.55rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function ChevronDownIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[0.95rem] w-[0.95rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function BusanSummaryPanel({ count }: { count: number }): React.JSX.Element {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8">
      <div>
        <p className="text-[0.68rem] font-bold tracking-[0.22em] text-primary-700 uppercase">
          부산 · 지금
        </p>
        <p
          className="mt-3 font-black leading-none tracking-tight text-primary-900"
          style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}
        >
          <span className="font-mono tabular-nums">{count}</span>
          <span className="ml-2 text-[1.6rem] font-semibold text-neutral-600">개</span>
        </p>
        <p className="mt-1.5 text-base font-medium text-neutral-500">
          현재 필터에 표시 중인 장소
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-700">부산 주요 구역</p>
        <div className="flex flex-wrap gap-2">
          {BUSAN_AREAS.map((area) => (
            <span
              key={area}
              className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-neutral-500">
        <p>현재 MVP 탐색 범위: 부산 중심</p>
        <p>지도 연동은 추후 업데이트 예정입니다.</p>
      </div>
    </div>
  )
}

export default function PlacesPage(): React.JSX.Element {
  const [items, setItems] = useState<PlaceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>(DEFAULT_REGION)
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>(DEFAULT_CATEGORY)
  const [openMenu, setOpenMenu] = useState<'region' | 'category' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { authLoading, isSaved, isMutating, save, remove } = useSavedPlaces()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextCategory =
      normalizePlaceCategoryParam(params.get('category')) ?? DEFAULT_CATEGORY
    const nextQuery = params.get('q')?.trim() ?? ''

    setSelectedCategory(nextCategory)
    setQuery(nextQuery)
    setSubmittedQuery(nextQuery)
  }, [])

  const selectedCategoryLabel =
    selectedCategory !== 'all' ? CATEGORY_LABELS[selectedCategory] : null

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      limit: '12',
    })

    if (selectedRegion !== 'all') {
      params.set('region', selectedRegion)
    }
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory)
    }
    if (submittedQuery.trim()) {
      params.set('q', submittedQuery.trim())
    }

    return `/api/v1/places?${params.toString()}`
  }, [selectedCategory, selectedRegion, submittedQuery])

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
          const message =
            err instanceof Error ? err.message : '장소를 불러오지 못했습니다.'
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

  const handleSaveToggle = async (place: PlaceListItem) => {
    setActionError(null)

    const result = isSaved(place.id)
      ? await remove(place.id)
      : await save({
          id: place.id,
          name: place.name,
          category: place.category,
          region: place.region,
          address: place.address,
          thumbnail_url: place.thumbnail_url,
          data_quality_score: place.data_quality_score,
          tags: place.tags,
        })

    if (!result.ok && result.reason === 'REQUEST_FAILED') {
      setActionError(result.message ?? '담은 상태를 업데이트하지 못했습니다.')
    }
  }

  const resetFilters = () => {
    setQuery('')
    setSubmittedQuery('')
    setSelectedRegion(DEFAULT_REGION)
    setSelectedCategory(DEFAULT_CATEGORY)
    setOpenMenu(null)
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-6 py-6 sm:px-8 lg:px-10" style={{ background: 'radial-gradient(circle at 70% 0%, rgba(210,230,250,0.85), rgba(248,250,251,1) 42%, rgba(205,238,233,0.78) 100%)' }}>
      <div className="mx-auto flex max-w-[1380px] flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[3.2rem] font-bold tracking-tight text-primary-900">
            장소 둘러보기
          </h1>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-100 px-4 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200"
          >
            홈으로
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.93fr_1.02fr]">
          <section className="overflow-hidden rounded-2xl border border-white/90 bg-white/92 shadow-[0_16px_40px_rgba(38,70,83,0.10)]">
            <div className="border-b border-neutral-200 px-6 py-5">
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmittedQuery(query)
                  setOpenMenu(null)
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <SearchIcon />
                    </span>
                    <span className="sr-only">장소 검색</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="장소 이름이나 키워드를 검색하세요"
                      className="h-14 w-full rounded-xl border border-neutral-300 bg-white pl-14 pr-5 text-[1.05rem] text-primary-900 outline-none transition focus:border-primary-500"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex h-14 items-center justify-center rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.18)] transition hover:bg-primary-700"
                  >
                    검색
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === 'region' ? null : 'region',
                      )
                    }
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-[0.98rem] font-medium transition ${
                      openMenu === 'region'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    지역 · {REGION_LABELS[selectedRegion]}
                    <ChevronDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === 'category' ? null : 'category',
                      )
                    }
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-[0.98rem] font-medium transition ${
                      openMenu === 'category'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    카테고리 · {CATEGORY_LABELS[selectedCategory]}
                    <ChevronDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-base font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    초기화
                  </button>
                </div>

                {selectedCategoryLabel ? (
                  <div className="inline-flex items-center rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
                    현재 카테고리: {selectedCategoryLabel}
                  </div>
                ) : null}

                {openMenu === 'region' ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="mb-3 text-sm font-semibold text-neutral-600">
                      지역 선택
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REGION_OPTIONS.map((region) => (
                        <button
                          key={region}
                          type="button"
                          onClick={() => {
                            setSelectedRegion(region)
                            setOpenMenu(null)
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selectedRegion === region
                              ? 'bg-primary-500 text-white'
                              : 'bg-white text-neutral-700'
                          }`}
                        >
                          {REGION_LABELS[region]}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">
                      현재 MVP 탐색 범위는 부산 중심입니다.
                    </p>
                  </div>
                ) : null}

                {openMenu === 'category' ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="mb-3 text-sm font-semibold text-neutral-600">
                      카테고리 선택
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category)
                            setOpenMenu(null)
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selectedCategory === category
                              ? 'bg-primary-500 text-white'
                              : 'bg-white text-neutral-700'
                          }`}
                        >
                          {CATEGORY_LABELS[category]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </form>
            </div>

            {actionError ? (
              <div className="border-b border-coral-500/20 bg-coral-50 px-6 py-4 text-sm text-coral-500">
                {actionError}
              </div>
            ) : null}

            <div className="border-b border-neutral-200 px-6 py-3 text-sm text-neutral-500">
              {REGION_LABELS[selectedRegion]} · {CATEGORY_LABELS[selectedCategory]}
              {submittedQuery.trim() ? ` · “${submittedQuery.trim()}” 검색 결과` : ''}
            </div>

            <div className="space-y-4 px-4 py-5 sm:px-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`place-skeleton-${index}`}
                    className="h-[130px] rounded-2xl border border-neutral-200 bg-neutral-50"
                  />
                ))
              ) : error ? (
                <div className="rounded-2xl border border-coral-500/30 bg-coral-50 px-5 py-4 text-sm text-coral-500">
                  {error}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-500">
                  현재 조건에 맞는 장소가 없습니다.
                </div>
              ) : (
                items.map((item, index) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-[0_4px_14px_rgba(38,70,83,0.04)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-1 sm:flex-row sm:items-center">
                      <div
                        className="h-36 w-full shrink-0 rounded-xl bg-cover bg-center sm:h-28 sm:w-40"
                        style={{ backgroundImage: `url(${getPlaceImage(item, index)})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="break-keep text-2xl font-bold leading-tight tracking-tight text-primary-900 sm:text-3xl">
                          {item.name}
                        </h2>
                        <p className="mt-1 text-[1rem] text-neutral-500">
                          {REGION_LABELS[item.region as RegionFilter] ?? item.region}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(item.tags.length > 0
                            ? item.tags
                            : [getCategoryLabel(item.category)])
                            .slice(0, 3)
                            .map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => void handleSaveToggle(item)}
                        disabled={authLoading || isMutating(item.id)}
                        className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-7 text-[1.02rem] font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.18)] transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {authLoading
                          ? '확인 중'
                          : isMutating(item.id)
                            ? '처리 중'
                            : isSaved(item.id)
                              ? '담음'
                              : '담기'}
                      </button>
                      <Link
                        href={`/places/${item.id}`}
                        className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-[1.02rem] font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        상세 보기
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="relative hidden min-h-[760px] overflow-hidden rounded-2xl border border-white/90 bg-white/82 shadow-[0_16px_40px_rgba(38,70,83,0.10)] xl:flex">
            <BusanSummaryPanel count={items.length} />
            <Link
              href="/plans"
              className="absolute bottom-6 right-6 inline-flex h-14 items-center justify-center rounded-full bg-primary-500 px-6 text-xl font-semibold text-white shadow-[0_16px_28px_rgba(42,157,143,0.24)] transition hover:bg-primary-700"
            >
              + 새 계획 만들기
            </Link>
          </aside>
        </div>
      </div>
    </main>
  )
}
