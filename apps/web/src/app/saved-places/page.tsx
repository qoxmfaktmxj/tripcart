'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSavedPlaces } from '@/hooks/use-saved-places'

export default function SavedPlacesPage(): React.JSX.Element {
  const router = useRouter()
  const { user, authLoading, loading, error, items, isMutating, remove } =
    useSavedPlaces()

  const handleRemove = async (placeId: string) => {
    const result = await remove(placeId)
    if (!result.ok && result.reason === 'AUTH_REQUIRED') {
      router.push('/login?next=/saved-places')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Saved places</p>
            <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              Your saved list
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500 sm:text-base">
              This page consumes the authenticated saved places API and lets you
              remove places from the list.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/places"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Browse places
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              Back home
            </Link>
          </div>
        </div>

        {authLoading || loading ? (
          <section className="rounded-2xl border border-primary-300 bg-primary-50 p-5 text-sm text-primary-700">
            Loading saved places...
          </section>
        ) : !user ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            Sign in to view your saved places.
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-coral-500 bg-white p-5 text-sm text-coral-500">
            {error}
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-neutral-300 bg-white p-5 text-sm text-neutral-500">
            No saved places yet. Browse the places list and save a few first.
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
                      {item.place.category}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-primary-900">
                      {item.place.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                    saved
                  </span>
                </div>

                <div className="space-y-2 text-sm text-neutral-500">
                  <p>{item.place.region}</p>
                  <p>{item.note ?? 'No note yet'}</p>
                </div>

                <div className="mt-auto flex gap-3 pt-2">
                  <Link
                    href={`/places/${item.place.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    View detail
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.place.id)}
                    disabled={isMutating(item.place.id)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMutating(item.place.id) ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
