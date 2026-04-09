'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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

export default function PlaceDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>()
  const placeId = typeof params.id === 'string' ? params.id : ''

  const [place, setPlace] = useState<PlaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!placeId) {
      setError('Missing place id')
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
          throw new Error(`Failed to load place (${response.status})`)
        }

        const payload = (await response.json()) as PlaceDetailResponse
        if (!cancelled) {
          setPlace(payload.data ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load place'
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

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Places detail</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              {loading ? 'Loading...' : place?.name ?? 'Place detail'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/places"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Back to list
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
          </div>
        </div>

        {loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 p-5 text-sm text-primary-700">
            Loading place detail...
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {error}
          </section>
        ) : !place ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            Place detail is not available.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {place.category}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-primary-900">{place.name}</h2>
                <div className="mt-4 space-y-2 text-sm text-neutral-500">
                  <p>Region: {place.region}</p>
                  <p>Address: {place.address ?? 'Address not provided yet'}</p>
                  <p>Phone: {place.phone ?? 'Not provided yet'}</p>
                  <p>
                    Website:{' '}
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
                      'Not provided yet'
                    )}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-neutral-500">Data quality score</p>
                <p className="mt-2 text-4xl font-bold text-primary-900">{place.data_quality_score}</p>
                <p className="mt-4 text-sm text-neutral-500">
                  Typical dwell:{' '}
                  {place.typical_dwell_minutes ? `${place.typical_dwell_minutes} min` : 'Not set yet'}
                </p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-primary-900">Open hours</h3>
                <div className="mt-4 space-y-3">
                  {place.open_hours.length > 0 ? (
                    place.open_hours.map((item) => (
                      <div
                        key={`${place.id}-hour-${item.day_of_week}-${item.open_time}`}
                        className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-primary-900">
                          {DAY_LABELS[item.day_of_week] ?? item.day_of_week}
                        </span>
                        <span className="font-mono text-neutral-500">
                          {item.open_time} - {item.close_time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No open hours registered yet.</p>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-primary-900">Break windows</h3>
                <div className="mt-4 space-y-3">
                  {place.break_windows.length > 0 ? (
                    place.break_windows.map((item) => (
                      <div
                        key={`${place.id}-break-${item.day_of_week}-${item.start_time}`}
                        className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-primary-900">
                          {DAY_LABELS[item.day_of_week] ?? item.day_of_week}
                        </span>
                        <span className="font-mono text-coral-500">
                          {item.start_time} - {item.end_time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No break windows registered yet.</p>
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
