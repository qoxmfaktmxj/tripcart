'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function PlansPage(): React.JSX.Element {
  const [items, setItems] = useState<PlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [transportMode, setTransportMode] = useState<TravelMode>('car')

  async function loadPlans() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/plans?limit=20', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Failed to load plans (${response.status})`)
      }

      const payload = (await response.json()) as PlansResponse
      setItems(payload.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPlans()
  }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/v1/plans', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          region: region.trim(),
          transport_mode: transportMode,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(payload?.error?.message ?? `Failed to create plan (${response.status})`)
      }

      setTitle('')
      await loadPlans()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create plan'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gold-700">Phase 1 draft planning</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              Plans list and create
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              This screen consumes the authenticated plans API, lists the user&apos;s drafts,
              and creates a new draft plan with the minimal contract fields.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/saved-places"
              className="inline-flex h-10 items-center justify-center rounded-md border border-plum-300 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-50"
            >
              Saved places
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Back home
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-primary-900">Create a draft plan</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Minimal create flow for the existing POST /api/v1/plans contract.
            </p>
          </div>

          <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handleCreate}>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-primary-900">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. 부산 주말 드라이브"
                required
                className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-primary-900">Region</span>
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="busan"
                required
                className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-sm text-primary-900 outline-none transition focus:border-primary-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-primary-900">Transport mode</span>
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

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create draft plan'}
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/api/v1/plans"
                prefetch={false}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                View plans API
              </Link>
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
              <h2 className="text-xl font-bold text-primary-900">Your plans</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Backed by GET /api/v1/plans with the current lightweight list response.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPlans()}
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-primary-300 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              Loading plans...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
              No plans yet. Create your first draft plan above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-neutral-300 bg-neutral-0 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                        {item.status}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-primary-900">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                      v{item.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm text-neutral-500 sm:grid-cols-2">
                    <p>Region: {item.region ?? 'n/a'}</p>
                    <p>Transport: {item.transport_mode}</p>
                    <p>Start: {formatDate(item.start_at)}</p>
                    <p>Updated: {formatDate(item.updated_at)}</p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    <Link
                      href={`/plans/${item.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                    >
                      Open plan
                    </Link>
                    <Link
                      href={`/api/v1/plans/${item.id}`}
                      prefetch={false}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                    >
                      View API detail
                    </Link>
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

