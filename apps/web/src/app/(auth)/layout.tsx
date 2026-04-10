/**
 * Auth Layout — 로그인/회원가입 공통 레이아웃
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,242,240,0.92),_rgba(248,250,251,1)_42%,_rgba(252,247,235,0.92)_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/85 bg-[linear-gradient(140deg,_rgba(47,138,136,0.94),_rgba(36,74,92,0.96))] p-8 text-white shadow-[0_22px_52px_rgba(38,70,83,0.16)]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-white/72">
              GUEST TO ACCOUNT
            </p>
            <h1 className="mt-4 text-[3.3rem] font-bold tracking-tight sm:text-[4rem]">
              TripCart
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-white/88">
              브라우저에 담아둔 장소와 초안 플랜을 계정으로 이어서 관리하세요.
              여행 준비를 다시 시작하지 않게 만드는 진입 화면입니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/16 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white/72">이 화면에서 되는 일</p>
              <p className="mt-3 text-xl font-semibold">게스트 초안 이어받기</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                로그인 후에는 브라우저에 있던 저장 장소와 임시 플랜이 계정 흐름으로 이어집니다.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/16 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white/72">다음 단계</p>
              <p className="mt-3 text-xl font-semibold">장소 담기, 플랜 만들기</p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                로그인 후에는 저장 목록과 플랜 화면에서 바로 다음 액션으로 넘어갈 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-white/85 bg-white/92 p-7 shadow-[0_22px_52px_rgba(38,70,83,0.12)] backdrop-blur">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
