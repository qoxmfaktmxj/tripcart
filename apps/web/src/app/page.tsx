/**
 * TripCart — Phase 0 Hello World
 * @tripcart/design-tokens 연결 확인용
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* 헤더 — primary-500 (#2A9D8F) */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900 mb-2">🛒 TripCart</h1>
        <p className="text-neutral-500 text-lg">여행 일정 최적화 & 실행 도구</p>
      </div>

      {/* Phase 0 상태 배지 */}
      <div className="bg-primary-50 border border-primary-300 rounded-lg px-6 py-4 text-center">
        <p className="text-primary-700 font-semibold">Phase 0 — 인프라 부트스트랩 완료</p>
        <p className="text-primary-500 text-sm mt-1">
          design-tokens ✅ | types ✅ | monorepo ✅
        </p>
      </div>

      {/* 컬러 팔레트 확인 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-primary-500 rounded-md h-12 w-24 flex items-center justify-center">
          <span className="text-white text-xs font-mono">primary</span>
        </div>
        <div className="bg-plum-700 rounded-md h-12 w-24 flex items-center justify-center">
          <span className="text-white text-xs font-mono">plum</span>
        </div>
        <div className="bg-coral-500 rounded-md h-12 w-24 flex items-center justify-center">
          <span className="text-white text-xs font-mono">coral</span>
        </div>
        <div className="bg-gold-500 rounded-md h-12 w-24 flex items-center justify-center">
          <span className="text-neutral-900 text-xs font-mono">gold</span>
        </div>
      </div>
    </main>
  )
}
