'use client'

import Link from 'next/link'
import { useSavedPlaces } from '@/hooks/use-saved-places'

const CATEGORY_LABELS: Record<string, string> = {
  attraction: '관광지',
  restaurant: '맛집',
  cafe: '카페',
  beach: '해변',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
}
const SAVED_IMAGES = [
  'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520201163981-8cc95007dd2e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80',
]

export default function SavedPlacesPage(): React.JSX.Element {
  const { user, authLoading, loading, error, items, isMutating, remove, storageMode } =
    useSavedPlaces()

  const handleRemove = async (placeId: string) => {
    await remove(placeId)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(205,237,233,0.82),_rgba(248,250,251,1)_38%,_rgba(252,247,235,0.88)_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-primary-700">저장한 장소</p>
            <h1 className="text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl">
              여행 장바구니
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-neutral-600">
              {user
                ? '계정에 저장한 장소를 한 화면에서 정리하고 플랜으로 넘깁니다.'
                : '이 브라우저에 임시 저장된 장소입니다. 로그인하면 그대로 계정으로 가져옵니다.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/places"
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white/80 px-5 text-sm font-semibold text-neutral-900 transition hover:bg-white"
            >
              장소 둘러보기
            </Link>
            <Link
              href="/plans"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              플랜으로 보기
            </Link>
          </div>
        </div>

        {authLoading || loading ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`saved-skeleton-${index}`}
                  className="h-[260px] rounded-[1.75rem] bg-white/80"
                />
              ))}
            </div>
            <div className="h-[260px] rounded-[1.75rem] bg-white/80" />
          </section>
        ) : error ? (
          <section className="rounded-[1.75rem] border border-coral-500/30 bg-coral-50 px-5 py-4 text-sm text-coral-500">
            {error}
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
            <div>
              {items.length === 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-[1.85rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_48px_rgba(38,70,83,0.12)]">
                    <p className="text-sm font-semibold tracking-[0.18em] text-primary-700">
                      EMPTY CART
                    </p>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-900">
                      아직 저장한 장소가 없습니다
                    </h2>
                    <p className="mt-4 text-base leading-7 text-neutral-600">
                      장소 목록에서 마음에 드는 후보를 담아 두면 여기서 한눈에 정리하고
                      바로 플랜으로 넘길 수 있습니다.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/places"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
                      >
                        장소 둘러보기
                      </Link>
                      <Link
                        href="/plans"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        플랜 화면 보기
                      </Link>
                    </div>
                  </article>
                  <article className="rounded-[1.85rem] border border-dashed border-neutral-300 bg-white/72 p-6">
                    <p className="text-sm font-semibold tracking-[0.18em] text-primary-700">
                      QUICK FLOW
                    </p>
                    <ol className="mt-4 space-y-4 text-sm leading-6 text-neutral-600">
                      <li>1. 장소를 담고</li>
                      <li>2. 저장 목록에서 후보를 정리한 뒤</li>
                      <li>3. 플랜 화면으로 넘겨 출발 시간과 이동 수단을 정합니다.</li>
                    </ol>
                  </article>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {items.map((item, index) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[1.85rem] border border-white/80 bg-white/88 shadow-[0_18px_48px_rgba(38,70,83,0.12)]"
                    >
                      <div
                        className="relative min-h-[190px] bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.36) 100%), url(${item.place.thumbnail_url ?? SAVED_IMAGES[index % SAVED_IMAGES.length]})`,
                        }}
                      >
                        <span className="absolute right-4 top-4 rounded-full border border-[#6ca8a2] bg-[#eaf8f5] px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                          {storageMode === 'guest' ? '브라우저에 담음' : '저장됨'}
                        </span>
                      </div>
                      <div className="space-y-4 px-5 py-5">
                        <div>
                          <p className="text-sm font-semibold text-primary-700">
                            {CATEGORY_LABELS[item.place.category] ?? item.place.category}
                          </p>
                          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900">
                            {item.place.name}
                          </h2>
                          <p className="mt-2 text-lg text-neutral-500">
                            {REGION_LABELS[item.place.region] ?? item.place.region}
                          </p>
                        </div>
                        <p className="text-sm leading-7 text-neutral-600">
                          {item.note ?? '메모 없음'}
                        </p>
                        <div className="flex gap-3 pt-2">
                          <Link
                            href={`/places/${item.place.id}`}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
                          >
                            상세 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleRemove(item.place.id)}
                            disabled={isMutating(item.place.id)}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMutating(item.place.id)
                              ? storageMode === 'guest'
                                ? '빼는 중...'
                                : '해제 중...'
                              : storageMode === 'guest'
                                ? '장바구니에서 빼기'
                                : '해제'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-[1.85rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_48px_rgba(38,70,83,0.12)]">
              <p className="text-sm font-semibold tracking-[0.18em] text-primary-700">
                SUMMARY
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary-900">
                {items.length === 0 ? '다음 후보를 담아 보세요' : `${items.length}곳이 담겨 있습니다`}
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                {items.length === 0
                  ? '장소를 한 곳만 담아도 여행 준비 흐름이 선명해집니다. 장소 목록에서 바로 담고 돌아오세요.'
                  : '여기서 후보를 정리한 뒤 플랜 화면으로 넘어가면 출발 시간과 이동 수단까지 이어서 정할 수 있습니다.'}
              </p>

              <div className="mt-6 rounded-[1.4rem] bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
                <p>저장 방식: {storageMode === 'guest' ? '브라우저 임시 저장' : '계정 저장'}</p>
                <p className="mt-2">플랜 연결: {items.length > 0 ? '바로 가능' : '장소를 먼저 담아야 함'}</p>
              </div>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/places"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  장소 더 담기
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  플랜으로 넘어가기
                </Link>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}
