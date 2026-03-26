/**
 * Auth Layout — 로그인/회원가입 공통 레이아웃
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
