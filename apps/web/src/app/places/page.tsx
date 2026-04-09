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
          throw new Error(`Failed to load places (${response.status})`)
        }

        const payload = (await response.json()) as PlacesResponse
        if (!cancelled) {
          setItems(payload.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load places'
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
      setActionError(result.message ?? 'Failed to update saved places')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Phase 1 starting point</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">Browse places</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              This screen consumes the existing places read API and renders a simple
              browse flow for the Busan seed set.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Back home
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
            <span className="mb-2 block text-sm font-medium text-primary-900">Search name</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 해운대"
              className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
            />
          </label>
          <div className="flex gap-3 sm:items-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Search
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              onClick={() => {
                setQuery('')
                setSubmittedQuery('')
              }}
            >
              Reset
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
            Loading places...
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {error}
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            No places found for the current filters.
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
                      {item.category}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-primary-900">{item.name}</h2>
                  </div>
                  <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                    score {item.data_quality_score}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-neutral-500">
                  <p>{item.region}</p>
                  <p>{item.address ?? 'Address not provided yet'}</p>
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
                      no tags
                    </span>
                  )}
                </div>

                <div className="mt-auto flex gap-3 pt-2">
                  <Link
                    href={`/places/${item.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    View detail
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSaveToggle(item.id)}
                    disabled={authLoading || isMutating(item.id)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading
                      ? 'Checking...'
                      : isMutating(item.id)
                        ? 'Saving...'
                        : !user
                          ? 'Sign in to save'
                          : isSaved(item.id)
                            ? 'Saved'
                            : 'Save'}
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


