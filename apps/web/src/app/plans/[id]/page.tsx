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

function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled yet'

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
        throw new Error(`Failed to load plan (${response.status})`)
      }

      const payload = (await response.json()) as PlanDetailResponse
      const nextItem = payload.data
      setItem(nextItem)
      setTitle(nextItem.title)
      setStartAt(toDatetimeLocal(nextItem.start_at))
      setTransportMode(nextItem.transport_mode)
      setOriginName(nextItem.origin_name ?? '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plan'
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
      setSaveError('Title is required')
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
        throw new Error(payload?.error?.message ?? `Failed to save plan (${response.status})`)
      }

      await loadPlan()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || deleting) return
    if (!window.confirm('Delete this plan?')) return

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
        throw new Error(payload?.error?.message ?? `Failed to delete plan (${response.status})`)
      }

      router.push('/plans')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete plan'
      setSaveError(message)
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gold-700">Phase 1 draft planning</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">Plan detail and edit</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              This screen consumes the existing authenticated detail API and exposes the
              minimal PATCH and DELETE flow for draft plans.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/plans"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Back to plans
            </Link>
            <Link
              href={`/api/v1/plans/${id}`}
              prefetch={false}
              className="inline-flex h-10 items-center justify-center rounded-md border border-plum-300 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-50"
            >
              View API detail
            </Link>
          </div>
        </div>

        {loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            Loading plan...
          </section>
        ) : error || !item ? (
          <section className="rounded-2xl border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
            {error ?? 'Plan not found'}
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                    {item.status}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-primary-900">{item.title}</h2>
                </div>
                <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                  v{item.version}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-neutral-500 sm:grid-cols-2">
                <p>Region: {item.region ?? 'n/a'}</p>
                <p>Transport: {item.transport_mode}</p>
                <p>Start: {formatDate(item.start_at)}</p>
                <p>Updated: {formatDate(item.updated_at)}</p>
                <p>Origin name: {item.origin_name ?? 'n/a'}</p>
                <p>
                  Origin lat/lng:{' '}
                  {item.origin_lat != null && item.origin_lng != null
                    ? `${item.origin_lat}, ${item.origin_lng}`
                    : 'n/a'}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary-900">Edit draft plan</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Minimal edit flow over PATCH /api/v1/plans/[id]. Region stays read-only in this
                  slice.
                </p>
              </div>

              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSave}>
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-primary-900">Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-primary-900">Start at</span>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-primary-900">
                    Transport mode
                  </span>
                  <select
                    value={transportMode}
                    onChange={(event) => setTransportMode(event.target.value as TravelMode)}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  >
                    {TRANSPORT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-primary-900">
                    Origin name
                  </span>
                  <input
                    value={originName}
                    onChange={(event) => setOriginName(event.target.value)}
                    placeholder="e.g. 부산역"
                    className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
                  />
                </label>

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-coral-500 px-4 text-sm font-semibold text-coral-500 transition hover:bg-coral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? 'Deleting...' : 'Delete plan'}
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
                <h2 className="text-xl font-bold text-primary-900">Stops summary</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Read-only snapshot from the current detail payload.
                </p>
              </div>

              {item.stops.length === 0 ? (
                <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                  No stops yet. Stop editing is still outside this slice.
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
                            {stop.kind}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-primary-900">
                            #{stop.sequence} {stop.custom_name ?? stop.place_id ?? 'Unnamed stop'}
                          </h3>
                        </div>
                        {stop.locked ? (
                          <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                            locked
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-neutral-500 sm:grid-cols-2">
                        <p>Place ID: {stop.place_id ?? 'n/a'}</p>
                        <p>Dwell minutes: {stop.dwell_minutes ?? 'n/a'}</p>
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
