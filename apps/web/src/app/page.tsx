'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGuestState } from '@/hooks/use-guest-state'
import { useSavedPlaces } from '@/hooks/use-saved-places'
import {
  buildHomeTripCards,
  HOME_CATEGORIES,
  POPULAR_DESTINATIONS,
} from '@/lib/home-view'
import type { TravelMode } from '@tripcart/types'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=1800&q=80'

const DEST_COPY: Record<string, string> = {
  'popular-gamcheon': '새벽빛 골목, 담으면 하루가 채워집니다',
  'popular-haeundae': '파도 소리 맞춰 하루 동선 시작',
  'popular-momos': '원두 향으로 마무리하는 부산 일정',
}

type HomePlanResponse = {
  data: Array<{
    id: string
    title: string
    start_at: string | null
    transport_mode: TravelMode
    updated_at: string
  }>
}

type HomeIconName = (typeof HOME_CATEGORIES)[number]['icon']

function NavIcon({ name }: { name: HomeIconName }): React.JSX.Element {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-[1.42rem] w-[1.42rem]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'cafe') {
    return (
      <svg {...common}>
        <path d="M5 10h9v3.2A4.8 4.8 0 0 1 9.2 18H9a4 4 0 0 1-4-4V10Z" />
        <path d="M14 11h1.9a2.3 2.3 0 1 1 0 4.6H14" />
        <path d="M7.2 4.6c-.9.9-.3 1.8.2 2.6" />
        <path d="M10.8 4.6c-.9.9-.3 1.8.2 2.6" />
        <path d="M4.5 20h13.5" />
      </svg>
    )
  }

  if (name === 'food') {
    return (
      <svg {...common}>
        <path d="M5 4v7" />
        <path d="M7.4 4v7" />
        <path d="M5 7.2h2.4" />
        <path d="M6.2 11.2V20" />
        <path d="M15.5 4c1.9 2.4 1.8 5.7 0 7.6" />
        <path d="M15.5 11.6V20" />
        <path d="M18.7 4v16" />
      </svg>
    )
  }

  if (name === 'lodging') {
    return (
      <svg {...common}>
        <path d="M4.5 18.5v-7.2h15v7.2" />
        <path d="M4.5 14.5h15" />
        <path d="M7 11.3V8.7a2.2 2.2 0 0 1 2.2-2.2h2.1a2.2 2.2 0 0 1 2.2 2.2v2.6" />
        <path d="M4.5 20v-1.5" />
        <path d="M19.5 20v-1.5" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M12 3.8 7 6v5.2c0 4.2 2.7 7.8 5 9 2.3-1.2 5-4.8 5-9V6Z" />
      <path d="M12 8.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z" />
      <path d="m10.2 13.9 1.8 1.5 1.8-1.5" />
    </svg>
  )
}

function CartIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.28rem] w-[1.28rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
      <path d="M2.8 4h2.8l2.1 9.3a1 1 0 0 0 1 .7h8.6a1 1 0 0 0 1-.7L20.6 8H7.3" />
      <path d="M8.3 8h12" />
      <path d="M8.9 11.2h10.2" />
    </svg>
  )
}

function PlusIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function categoryLabel(value: string): string {
  if (value === 'restaurant') return '맛집'
  if (value === 'cafe') return '카페'
  if (value === 'attraction') return '명소'
  if (value === 'lodging' || value === 'accommodation') return '숙소'
  return value
}

export default function HomePage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const { plans: guestPlans } = useGuestState()
  const { items: savedPlaces, loading: savedLoading } = useSavedPlaces()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountPlans, setAccountPlans] = useState<HomePlanResponse['data']>([])

  useEffect(() => {
    if (authLoading || !user) return

    let cancelled = false

    async function loadPlans() {
      try {
        const response = await fetch('/api/v1/plans?limit=12', { cache: 'no-store' })
        if (!response.ok) {
          if (!cancelled) setAccountPlans([])
          return
        }

        const payload = (await response.json()) as HomePlanResponse
        if (!cancelled) {
          setAccountPlans(payload.data ?? [])
        }
      } catch {
        if (!cancelled) setAccountPlans([])
      }
    }

    void loadPlans()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const myTrips = useMemo(
    () => buildHomeTripCards(user ? accountPlans : guestPlans),
    [accountPlans, guestPlans, user],
  )
  const myTripsGridClass =
    myTrips.length === 1
      ? 'grid gap-6 xl:max-w-[420px] xl:grid-cols-1'
      : myTrips.length === 2
        ? 'grid gap-6 xl:grid-cols-2'
        : 'grid gap-6 xl:grid-cols-3'

  return (
    <main
      className="min-h-screen overflow-x-hidden pb-20 text-neutral-900 sm:pb-0"
      style={{ background: 'radial-gradient(circle at 30% 0%, rgba(255,237,210,0.82), rgba(248,250,251,1) 45%, rgba(210,238,235,0.75) 100%)' }}
    >
      {/* ── HERO (A1) ── */}
      <section
        className="relative min-h-[600px] overflow-hidden lg:min-h-[680px]"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(38,70,83,0.54) 55%, rgba(15,23,42,0.18) 100%)' }}
        />

        {/* Nav bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-10 lg:px-14">
          <span className="text-[0.68rem] font-bold tracking-[0.24em] text-white/60 uppercase">TripCart</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/35 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            <CartIcon />
            <span className="font-mono tabular-nums">
              {savedLoading ? '…' : savedPlaces.length}
            </span>
          </button>
        </div>

        {/* Hero content — left-anchored editorial */}
        <div className="relative z-10 mx-auto flex max-w-[1400px] min-h-[480px] items-end px-6 pb-16 sm:px-10 lg:px-14 lg:pb-24">
          <div className="max-w-[600px]">
            <p className="mb-5 text-[0.68rem] font-bold tracking-[0.24em] text-primary-300 uppercase">
              부산 · 여행 일정
            </p>
            <h1
              className="font-black leading-[0.9] tracking-tight text-white"
              style={{ fontSize: 'clamp(3.8rem, 8vw, 6.5rem)' }}
            >
              담아두면<br />일정이 된다
            </h1>
            <p className="mt-6 max-w-[440px] text-[1.05rem] font-medium leading-relaxed text-white/78">
              카페·맛집·명소를 담고 — 출발 시간을 정하면 영업시간과 동선까지 맞춰 정렬됩니다.
            </p>
            <div className="mt-9 flex items-center gap-7">
              <Link
                href="/places"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-7 text-base font-semibold text-white shadow-[0_12px_32px_rgba(42,157,143,0.32)] transition hover:bg-primary-700"
              >
                장소 탐색하기
              </Link>
              <Link
                href="/plans"
                className="text-sm font-semibold text-white/80 transition hover:text-white"
              >
                내 계획 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category nav ── */}
      <section className="border-b border-neutral-200 bg-white/96 px-6 py-5 sm:px-8 lg:px-12">
        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <div className="mx-auto flex w-max min-w-full items-center gap-8 whitespace-nowrap sm:w-auto sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-10">
            {HOME_CATEGORIES.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-2.5 border-b-[4px] border-transparent px-1 pb-3 text-[1.38rem] font-semibold text-neutral-800 transition hover:border-primary-500 hover:text-primary-900 sm:text-[1.82rem]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center text-primary-700 sm:h-8 sm:w-8">
                  <NavIcon name={action.icon} />
                </span>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── My trips ── */}
      <section className="tc-animate tc-delay-1 px-6 pb-8 pt-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
          <div>
            <h2
              className="font-black tracking-tight text-primary-900"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}
            >
              {user ? '내 여행' : '여행 준비 중'}
            </h2>
            <p className="mt-2 text-base text-neutral-600">
              {user
                ? '계정에 연결된 플랜과 초안을 여기서 바로 확인할 수 있습니다.'
                : '비로그인 상태의 여행 초안도 브라우저에 유지됩니다.'}
            </p>
          </div>

          {/* Mobile horizontal swipe */}
          <div className="sm:hidden">
            <div className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex snap-x snap-mandatory gap-4">
                {myTrips.map((card) =>
                  card.kind === 'plan' ? (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group block w-[82vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1"
                    >
                      <div
                        className="relative flex min-h-[200px] items-end px-5 pb-5 pt-6 text-white"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.58) 100%), url(${card.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <span className="absolute right-4 top-4 rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                          {card.statusLabel}
                        </span>
                        <div>
                          <h3 className="text-[1.6rem] font-black tracking-tight">{card.title}</h3>
                          <p className="mt-1.5 font-mono tabular-nums text-[1.1rem] font-medium text-white/88">{card.period}</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="flex min-h-[200px] w-[82vw] max-w-[320px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-white/85 bg-white shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1"
                    >
                      <span className="text-primary-700">
                        <PlusIcon />
                      </span>
                      <span className="mt-3 text-[1.8rem] font-black tracking-tight text-primary-900">{card.title}</span>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Desktop grid */}
          <div className={`hidden sm:grid ${myTripsGridClass}`}>
            {myTrips.map((card) =>
              card.kind === 'plan' ? (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group overflow-hidden rounded-2xl border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(38,70,83,0.16)]"
                >
                  <div
                    className="relative flex min-h-[236px] items-end px-6 pb-6 pt-7 text-white"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.58) 100%), url(${card.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="absolute right-5 top-5 rounded-full border border-primary-300 bg-primary-50 px-3 py-[0.35rem] text-[0.82rem] font-semibold text-primary-700 shadow-sm">
                      {card.statusLabel}
                    </span>
                    <div className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                      <h3 className="text-[1.95rem] font-black tracking-tight">{card.title}</h3>
                      <p className="mt-2 font-mono tabular-nums text-[1.35rem] font-medium text-white/92">{card.period}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  key={card.id}
                  href={card.href}
                  className="flex min-h-[236px] flex-col items-center justify-center rounded-2xl border border-white/85 bg-white shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1"
                >
                  <span className="text-primary-700">
                    <PlusIcon />
                  </span>
                  <span className="mt-4 text-[2.3rem] font-black tracking-tight text-primary-900">{card.title}</span>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Popular destinations — asymmetric editorial grid (A2) ── */}
      <section className="tc-animate tc-delay-2 px-6 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div>
            <h2
              className="font-black tracking-tight text-primary-900"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}
            >
              인기 여행지
            </h2>
            <p className="mt-2 text-base text-neutral-600">담기 좋은 부산 대표 장소</p>
          </div>

          {/* Mobile: slim snap-x swipe (C2) */}
          <div className="sm:hidden">
            <div className="-mx-6 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex snap-x snap-mandatory gap-4">
                {POPULAR_DESTINATIONS.map((place) => (
                  <Link
                    key={place.id}
                    href={place.href}
                    className="group w-[72vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl"
                  >
                    <div
                      className="relative min-h-[220px] bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.04), rgba(15,23,42,0.66)), url(${place.image})` }}
                    >
                      <div className="absolute bottom-0 left-0 p-5 text-white">
                        <p className="mb-1 text-[0.62rem] font-bold tracking-[0.22em] text-primary-300 uppercase">
                          {place.region} · {place.categoryLabel}
                        </p>
                        <h3 className="text-[1.45rem] font-black tracking-tight">{place.title}</h3>
                        <p className="mt-1 text-xs font-medium text-white/72">
                          {DEST_COPY[place.id] ?? '지금 바로 담아보기'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: 1 large feature + 2 small stacked */}
          <div className="hidden gap-5 sm:grid sm:grid-cols-[1.4fr_1fr]">
            {/* Large feature card */}
            <Link
              href={POPULAR_DESTINATIONS[0].href}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div
                className="min-h-[400px] bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to bottom right, rgba(15,23,42,0.04), rgba(15,23,42,0.70)), url(${POPULAR_DESTINATIONS[0].image})` }}
              >
                <div className="flex min-h-[400px] flex-col justify-end p-8 text-white">
                  <p className="mb-3 text-[0.66rem] font-bold tracking-[0.24em] text-primary-300 uppercase">
                    {POPULAR_DESTINATIONS[0].region} · {POPULAR_DESTINATIONS[0].categoryLabel}
                  </p>
                  <h3
                    className="font-black leading-tight tracking-tight"
                    style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.6rem)' }}
                  >
                    {POPULAR_DESTINATIONS[0].title}
                  </h3>
                  <p className="mt-3 max-w-[280px] text-[0.95rem] font-medium leading-relaxed text-white/78">
                    {DEST_COPY[POPULAR_DESTINATIONS[0].id] ?? '지금 바로 담아보기'}
                  </p>
                  <span className="mt-5 text-sm font-semibold text-primary-300 transition group-hover:text-primary-200">
                    담아보기 →
                  </span>
                </div>
              </div>
            </Link>

            {/* Right column: 2 smaller */}
            <div className="flex flex-col gap-5">
              {([POPULAR_DESTINATIONS[1], POPULAR_DESTINATIONS[2]] as const).map((place) => (
                <Link
                  key={place.id}
                  href={place.href}
                  className="group relative flex-1 overflow-hidden rounded-2xl"
                >
                  <div
                    className="relative min-h-[185px] bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.04), rgba(15,23,42,0.66)), url(${place.image})` }}
                  >
                    <div className="flex min-h-[185px] flex-col justify-end p-6 text-white">
                      <p className="mb-2 text-[0.62rem] font-bold tracking-[0.22em] text-primary-300 uppercase">
                        {place.region} · {place.categoryLabel}
                      </p>
                      <h3 className="text-[1.65rem] font-black tracking-tight">{place.title}</h3>
                      <p className="mt-1.5 text-sm font-medium text-white/75">
                        {DEST_COPY[place.id] ?? '지금 바로 담아보기'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky bottom search bar (C1) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/96 px-4 py-3 sm:hidden"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/places"
          className="flex h-12 w-full items-center gap-3 rounded-full bg-neutral-100 px-5"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-neutral-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="text-sm text-neutral-500">카페·맛집·명소 검색...</span>
        </Link>
      </div>

      {/* ── Cart drawer ── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/28 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[380px] flex-col border-l border-white/70 bg-white/96 px-6 py-6 shadow-[-24px_0_48px_rgba(15,23,42,0.16)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[2rem] font-black tracking-tight text-primary-900">장바구니</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {savedPlaces.length === 0 ? '담아 둔 여행지가 없습니다.' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
              {savedPlaces.map((item) => (
                <Link
                  key={item.id}
                  href={`/places/${item.place.id}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 shadow-sm transition hover:border-primary-500"
                >
                  <div
                    className="h-16 w-16 shrink-0 rounded-xl bg-neutral-100 bg-cover bg-center"
                    style={item.place.thumbnail_url ? { backgroundImage: `url(${item.place.thumbnail_url})` } : undefined}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[1.1rem] font-semibold text-primary-900">{item.place.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">{item.place.region}</p>
                    <p className="mt-1 text-xs font-medium text-primary-700">{categoryLabel(item.place.category)}</p>
                  </div>
                </Link>
              ))}

              {savedPlaces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
                  카페, 맛집, 명소, 숙소를 담아 두면 여기서 바로 확인할 수 있습니다.
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                href="/saved-places"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-base font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                저장 목록 보기
              </Link>
              <Link
                href="/plans"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.18)] transition hover:bg-primary-700"
              >
                플랜 만들기
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  )
}
