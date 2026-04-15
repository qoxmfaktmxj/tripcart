/**
 * Auth Layout - 로그인/회원가입 공통 레이아웃
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,242,240,0.92),_rgba(248,250,251,1)_42%,_rgba(252,247,235,0.92)_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="flex w-full items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-white/85 bg-white/92 p-7 shadow-[0_22px_52px_rgba(38,70,83,0.12)] backdrop-blur">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
