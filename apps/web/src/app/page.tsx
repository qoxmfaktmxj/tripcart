import Link from 'next/link'

const FLOW_STEPS = [
  {
    title: '담기',
    description: '부산에서 가고 싶은 식당, 카페, 관광지를 먼저 담아 둡니다.',
  },
  {
    title: '정리하기',
    description: '저장한 후보를 플랜으로 모아 이동 순서와 시작 조건을 정리합니다.',
  },
  {
    title: '실행하기',
    description: '여행 당일에는 준비된 플랜을 보며 실제 이동 흐름을 이어갑니다.',
  },
] as const

const IMPLEMENTED_SCOPE = [
  '장소 조회와 상세 보기',
  '저장한 장소 목록',
  '초안 플랜 생성과 수정',
  '로그인 후 데이터 동기화 기반',
] as const

const TRUST_ITEMS = [
  '부산 시드 데이터 기반으로 바로 체험 가능',
  '비로그인으로 먼저 둘러보고, 로그인 후 이어서 관리 가능',
  '현재 구현 범위를 홈에서 바로 확인 가능',
] as const

export default function HomePage(): React.JSX.Element {
  return (
    <main className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900">
      <section className="relative isolate overflow-hidden border-b border-primary-100 bg-[radial-gradient(circle_at_top_left,_rgba(212,245,238,0.95),_rgba(248,250,251,0.65)_40%,_rgba(245,239,243,0.8)_100%)] px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(42,157,143,0.16),_transparent_72%)]" />
        <div className="absolute right-[-8rem] top-14 -z-10 h-64 w-64 rounded-full bg-plum-100/70 blur-3xl" />
        <div className="absolute left-[-6rem] bottom-[-5rem] -z-10 h-56 w-56 rounded-full bg-primary-100/80 blur-3xl" />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-primary-300 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-primary-700 shadow-sm backdrop-blur">
              로그인 없이 먼저 시작하는 여행 플랜
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight text-primary-900 sm:text-5xl lg:text-6xl">
              여행 장소를 장바구니에 담고, 실행 가능한 일정으로 정리하세요.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              로그인 없이 먼저 장소를 담아보고, 원하면 계정으로 이어서 관리할 수 있습니다.
              TripCart는 후보 저장부터 초안 플랜 정리까지 한 흐름으로 이어지는 여행 운영 도구입니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/places"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(42,157,143,0.25)] transition hover:-translate-y-0.5 hover:bg-primary-700"
              >
                바로 담아보기
              </Link>
              <Link
                href="/plans"
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white/85 px-6 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white"
              >
                플랜 보기
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-neutral-600 shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-xl justify-center lg:mx-0 lg:justify-end">
            <div className="relative w-full max-w-[420px] rounded-[2rem] border border-primary-100/70 bg-white/80 p-3 shadow-[0_24px_80px_rgba(38,70,83,0.16)] backdrop-blur">
              <div className="absolute inset-x-8 top-0 h-12 rounded-b-[1.5rem] bg-[linear-gradient(180deg,rgba(42,157,143,0.14),rgba(42,157,143,0))]" />
              <div className="overflow-hidden rounded-[1.6rem] border border-neutral-200 bg-neutral-900 p-3 text-white shadow-inner">
                <div className="rounded-[1.35rem] bg-[linear-gradient(180deg,#0f2830_0%,#17313a_48%,#faf7ef_48%,#faf7ef_100%)] p-4">
                  <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.18em] text-primary-100/90">
                    <span>TRIPCART</span>
                    <span>비로그인 체험</span>
                  </div>

                  <div className="mt-4 rounded-[1.4rem] bg-white px-4 py-4 text-neutral-900 shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-primary-700">
                          부산 주말 드라이브
                        </p>
                        <p className="mt-2 text-2xl font-bold text-primary-900">후보 8곳</p>
                        <p className="mt-1 text-sm text-neutral-500">
                          비로그인으로 담은 장소를 그대로 이어갑니다.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-plum-50 px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold text-plum-700">장바구니</p>
                        <p className="mt-1 font-mono text-lg font-bold text-plum-700">08</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold tracking-[0.18em] text-primary-700">
                              먼저 담기
                            </p>
                            <p className="mt-1 text-base font-semibold text-primary-900">장소 저장</p>
                            <p className="mt-1 text-sm text-neutral-600">
                              해운대, 광안리, 전포 카페를 먼저 담아둡니다.
                            </p>
                          </div>
                          <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
                            임시 저장
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gold-500/40 bg-[#fff9e9] p-4">
                        <p className="text-xs font-semibold tracking-[0.18em] text-gold-700">다음 단계</p>
                        <p className="mt-1 text-base font-semibold text-primary-900">초안 플랜 정리</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          저장한 장소를 바탕으로 여행 흐름을 초안 일정으로 묶습니다.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-plum-100 bg-plum-50 p-4">
                        <p className="text-xs font-semibold tracking-[0.18em] text-plum-700">이어서 관리</p>
                        <p className="mt-1 text-base font-semibold text-primary-900">로그인 후 이어서 관리</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          담아둔 장소와 초안 플랜을 계정으로 옮겨 그대로 이어서 봅니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-plum-700">이용 흐름</p>
            <h2 className="mt-3 text-3xl font-bold text-primary-900 sm:text-4xl">
              저장부터 초안 일정까지, 여행 준비가 한 화면에서 이어집니다.
            </h2>
            <p className="mt-3 text-base leading-7 text-neutral-600">
              TripCart는 여행 준비의 첫 행동을 단순하게 유지하고, 나중에 로그인해도 흐름이 끊기지 않도록 설계합니다.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {FLOW_STEPS.map((step, index) => (
              <article
                key={step.title}
                className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-500),var(--color-plum-500),var(--color-gold-500))]" />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold tracking-[0.2em] text-primary-700">
                    단계 {index + 1}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                    {step.title}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-primary-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white px-6 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-gold-700">현재 구현 범위</p>
            <h2 className="mt-3 text-3xl font-bold text-primary-900 sm:text-4xl">
              지금 바로 확인할 수 있는 기능입니다.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
              현재 로컬 개발 표면에서 장소 조회, 저장한 장소, 초안 플랜 생성과 수정까지 이어서 검증할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {IMPLEMENTED_SCOPE.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-medium text-primary-900"
              >
                {item}
              </div>
            ))}
            <Link
              href="/saved-places"
              className="inline-flex min-h-24 items-center justify-center rounded-2xl border border-plum-300 bg-plum-50 px-5 py-4 text-center text-sm font-semibold text-plum-700 transition hover:bg-plum-100"
            >
              저장한 장소 보기
            </Link>
            <Link
              href="/api/v1/places?region=busan&limit=12"
              prefetch={false}
              className="inline-flex min-h-24 items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              장소 API 확인
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 rounded-[2rem] border border-primary-100 bg-[linear-gradient(135deg,rgba(42,157,143,0.08),rgba(245,239,243,0.7))] p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-primary-700">먼저 써보고 나중에 로그인</p>
            <h2 className="mt-3 text-3xl font-bold text-primary-900 sm:text-4xl">
              비로그인으로 먼저 담아보고, 로그인 후 그대로 이어가세요.
            </h2>
            <p className="mt-3 text-base leading-7 text-neutral-600">
              공개 랜딩에서는 바로 장소를 담아보고, 로그인하면 담아둔 장소와 초안 플랜을 계정으로 이어서 관리하는 흐름을 목표로 합니다.
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/places"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(42,157,143,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-700"
            >
              장소부터 담아보기
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:border-primary-300"
            >
              로그인하고 이어서 관리
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
