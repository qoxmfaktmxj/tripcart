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

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-[2.16rem] w-[2.16rem]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
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
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(223,242,240,0.88),_rgba(248,250,251,1)_42%,_rgba(252,247,235,0.92)_100%)] text-neutral-900">
      <section
        className="relative min-h-[510px] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.14) 0%, rgba(15, 23, 42, 0.42) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto flex min-h-[510px] max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-12">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/18 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/28"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 text-white">
                <CartIcon />
              </span>
              담은 여행지
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-[#2f6f73]">
                {savedLoading ? '…' : savedPlaces.length}
              </span>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="rounded-full border border-white/50 bg-white/18 px-4 py-1.5 text-[0.72rem] font-semibold tracking-[0.04em] text-white/92 backdrop-blur-sm">
              담을수록 설레는 나만의 여행
            </span>
            <h1 className="mt-5 text-[4.2rem] font-bold tracking-tight text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.25)] sm:text-[5.2rem]">
              TRIP CART
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-medium text-white/92 sm:text-[1.35rem]">
              여행 장소를 장바구니에 담고, 실행 가능한 일정으로 정리하세요.
            </p>

            <Link
              href="/places"
              className="mt-10 flex w-full max-w-[760px] items-center justify-between rounded-full border border-white/65 bg-white/24 px-7 py-[1.05rem] text-left text-xl font-medium text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-md transition hover:bg-white/30"
            >
              <span className="text-[1.1rem] sm:text-[1.2rem]">어디로 떠나시나요?</span>
              <span className="flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full bg-[#2f8a88] text-white shadow-[0_12px_24px_rgba(42,157,143,0.28)]">
                <SearchIcon />
              </span>
            </Link>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/places"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#2f8a88] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.24)] transition hover:bg-[#2a7674]"
              >
                바로 담아보기
              </Link>
              <Link
                href="/plans"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 bg-white/18 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/28"
              >
                플랜 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white/96 px-6 py-5 sm:px-8 lg:px-12">
        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <div className="mx-auto flex w-max min-w-full items-center gap-8 whitespace-nowrap sm:w-auto sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-10">
          {HOME_CATEGORIES.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-2.5 border-b-[4px] border-transparent px-1 pb-3 text-[1.38rem] font-semibold text-neutral-800 transition hover:border-[#2f8a88] hover:text-[#2f5f6c] sm:text-[1.82rem]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center text-[#2f6f73] sm:h-8 sm:w-8">
                <NavIcon name={action.icon} />
              </span>
              <span>{action.label}</span>
            </Link>
          ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
          <div>
            <h2 className="text-[3.1rem] font-bold tracking-tight text-primary-900">내 여행</h2>
            <p className="mt-2 text-lg text-neutral-600">
              {user ? '계정에 연결된 플랜과 초안을 여기서 바로 확인할 수 있습니다.' : '비로그인 상태의 여행 초안도 브라우저에 유지됩니다.'}
            </p>
          </div>

          <div className="sm:hidden">
            <div className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4">
                {myTrips.map((card) =>
                  card.kind === 'plan' ? (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group block w-[84vw] max-w-[336px] shrink-0 overflow-hidden rounded-[1.85rem] border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(38,70,83,0.16)]"
                    >
                      <div
                        className="relative flex min-h-[228px] items-end px-6 pb-6 pt-7 text-white"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.58) 100%), url(${card.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <span className="absolute right-5 top-5 rounded-full border border-[#6ca8a2] bg-[#eaf8f5] px-3 py-[0.35rem] text-[0.82rem] font-semibold text-[#2f6f73] shadow-sm">
                          {card.statusLabel}
                        </span>
                        <div className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                          <h3 className="text-[1.8rem] font-bold tracking-tight">{card.title}</h3>
                          <p className="mt-2 text-[1.35rem] font-medium text-white/92">{card.period}</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="flex min-h-[228px] w-[84vw] max-w-[336px] shrink-0 flex-col items-center justify-center rounded-[1.9rem] border border-white/85 bg-white shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1"
                    >
                      <span className="text-[#2f6f73]">
                        <PlusIcon />
                      </span>
                      <span className="mt-4 text-[2rem] font-bold tracking-tight text-primary-900">{card.title}</span>
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className={`hidden sm:grid ${myTripsGridClass}`}>
            {myTrips.map((card) =>
              card.kind === 'plan' ? (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group overflow-hidden rounded-[1.85rem] border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(38,70,83,0.16)]"
                >
                  <div
                    className="relative flex min-h-[236px] items-end px-6 pb-6 pt-7 text-white"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.58) 100%), url(${card.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="absolute right-5 top-5 rounded-full border border-[#6ca8a2] bg-[#eaf8f5] px-3 py-[0.35rem] text-[0.82rem] font-semibold text-[#2f6f73] shadow-sm">
                      {card.statusLabel}
                    </span>
                    <div className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                      <h3 className="text-[1.95rem] font-bold tracking-tight">{card.title}</h3>
                      <p className="mt-2 text-[1.55rem] font-medium text-white/92">{card.period}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  key={card.id}
                  href={card.href}
                  className="flex min-h-[236px] flex-col items-center justify-center rounded-[1.9rem] border border-white/85 bg-white shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1"
                >
                  <span className="text-[#2f6f73]">
                    <PlusIcon />
                  </span>
                  <span className="mt-4 text-[2.3rem] font-bold tracking-tight text-primary-900">{card.title}</span>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
          <div>
            <h2 className="text-[3.1rem] font-bold tracking-tight text-primary-900">인기 여행지</h2>
            <p className="mt-2 text-lg text-neutral-600">
              바로 담아보고 플랜으로 이어가기 좋은 대표 여행지를 모았습니다.
            </p>
          </div>

          <div className="sm:hidden">
            <div className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4">
                {POPULAR_DESTINATIONS.map((place) => (
                  <Link
                    key={place.id}
                    href={place.href}
                    className="group block w-[84vw] max-w-[336px] shrink-0 overflow-hidden rounded-[1.85rem] border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(38,70,83,0.16)]"
                  >
                    <div
                      className="min-h-[236px] bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.48) 100%), url(${place.image})` }}
                    >
                      <div className="flex min-h-[236px] flex-col justify-end px-7 pb-8 pt-8 text-white">
                        <div className="mb-3 flex gap-2">
                          <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-[#2f6f73]">
                            {place.region}
                          </span>
                          <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold text-white">
                            {place.categoryLabel}
                          </span>
                        </div>
                        <h3 className="text-[1.85rem] font-bold tracking-tight">{place.title}</h3>
                        <p className="mt-2 text-base font-medium text-white/88">둘러보고 바로 담아보세요.</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden gap-6 xl:grid-cols-3 sm:grid">
            {POPULAR_DESTINATIONS.map((place) => (
              <Link
                key={place.id}
                href={place.href}
                className="group overflow-hidden rounded-[1.85rem] border border-white/85 bg-white/92 shadow-[0_18px_42px_rgba(38,70,83,0.12)] transition hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(38,70,83,0.16)]"
              >
                <div
                  className="min-h-[248px] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.48) 100%), url(${place.image})` }}
                >
                  <div className="flex min-h-[248px] flex-col justify-end px-7 pb-8 pt-8 text-white">
                    <div className="mb-3 flex gap-2">
                      <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-[#2f6f73]">
                        {place.region}
                      </span>
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold text-white">
                        {place.categoryLabel}
                      </span>
                    </div>
                    <h3 className="text-[2rem] font-bold tracking-tight">{place.title}</h3>
                    <p className="mt-2 text-base font-medium text-white/88">둘러보고 바로 담아보세요.</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
                <h2 className="text-[2rem] font-bold tracking-tight text-primary-900">담은 여행지</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {savedPlaces.length > 0 ? `${savedPlaces.length}곳을 담아 두었습니다.` : '아직 담아 둔 여행지가 없습니다.'}
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
                  className="flex items-center gap-3 rounded-[1.2rem] border border-neutral-200 bg-white px-3 py-3 shadow-sm transition hover:border-[#2f8a88]"
                >
                  <div
                    className="h-16 w-16 shrink-0 rounded-[1rem] bg-neutral-100 bg-cover bg-center"
                    style={item.place.thumbnail_url ? { backgroundImage: `url(${item.place.thumbnail_url})` } : undefined}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[1.1rem] font-semibold text-primary-900">{item.place.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">{item.place.region}</p>
                    <p className="mt-1 text-xs font-medium text-[#2f6f73]">{categoryLabel(item.place.category)}</p>
                  </div>
                </Link>
              ))}

              {savedPlaces.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
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
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#2f8a88] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.18)] transition hover:bg-[#2a7674]"
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
