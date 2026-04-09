import Link from 'next/link'

export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-6 py-10 sm:px-8">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold text-primary-900 sm:text-5xl">
          TripCart
        </h1>
        <p className="text-base text-neutral-500 sm:text-lg">
          Travel planning and execution, optimized.
        </p>
      </div>

      <div className="w-full max-w-full rounded-lg border border-primary-300 bg-primary-50 px-5 py-4 text-center sm:max-w-md sm:px-6">
        <p className="font-semibold text-primary-700">
          Phase 0 bootstrap complete
        </p>
        <p className="mt-1 text-sm text-primary-500">
          design-tokens{' '}
          <span aria-hidden="true">|</span>{' '}
          types{' '}
          <span aria-hidden="true">|</span>{' '}
          monorepo
        </p>
      </div>

      <div className="grid w-full max-w-full grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex h-12 w-full items-center justify-center rounded-md bg-primary-500">
          <span className="text-xs font-mono text-white">primary</span>
        </div>
        <div className="flex h-12 w-full items-center justify-center rounded-md bg-plum-700">
          <span className="text-xs font-mono text-white">plum</span>
        </div>
        <div className="flex h-12 w-full items-center justify-center rounded-md bg-coral-500">
          <span className="text-xs font-mono text-white">coral</span>
        </div>
        <div className="flex h-12 w-full items-center justify-center rounded-md bg-gold-500">
          <span className="text-xs font-mono text-neutral-900">gold</span>
        </div>
      </div>

      <div className="flex w-full max-w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:flex-wrap">
        <Link
          href="/places"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          Browse places
        </Link>
        <Link
          href="/api/v1/places?region=busan&limit=12"
          prefetch={false}
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
        >
          View places API
        </Link>
        <Link
          href="/saved-places"
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-plum-300 bg-plum-50 px-4 text-sm font-semibold text-plum-700 transition hover:bg-plum-100"
        >
          Saved places
        </Link>
        <Link
          href="/plans"
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-gold-500 bg-gold-50 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-gold-100"
        >
          Plans
        </Link>
      </div>
    </main>
  )
}

