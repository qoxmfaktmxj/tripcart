'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TravelMode } from '@tripcart/types'

type PlanStop = {
  id: string
  stop_order: number
  place_id: string | null
  custom_name: string | null
  locked: boolean
  dwell_minutes: number | null
  arrive_at: string | null
  leave_at: string | null
  place: {
    id: string
    name: string
    category: string
    lat: number
    lng: number
  } | null
}

type PlanDetail = {
  id: string
  title: string
  start_at: string | null
  region: string | null
  transport_mode: TravelMode
  status: string
  version: number
  origin_name: string | null
  origin_lat: number | null
  origin_lng: number | null
  created_at: string
  updated_at: string
  stops: PlanStop[]
}

type PlanDetailResponse = {
  data: PlanDetail
}

type IconName = 'car' | 'pin' | 'fork' | 'home' | 'clock' | 'moon' | 'bag'

type DisplayStop = {
  id: string
  label: string
  timeLabel: string
  icon: IconName
  locked: boolean
}

type DisplaySection = {
  key: string
  label: string
  stops: DisplayStop[]
}

const TRANSPORT_MODES: TravelMode[] = ['car', 'transit', 'walk', 'bicycle']
const TRANSPORT_LABELS: Record<TravelMode, string> = {
  car: '자동차',
  transit: '대중교통',
  walk: '도보',
  bicycle: '자전거',
}
const REGION_LABELS: Record<string, string> = {
  busan: '부산',
  seoul: '서울',
  sokcho: '속초',
}

function formatPlanDateTime(value: string | null): string {
  if (!value) return '날짜 미정'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatTimelineTime(value: string | null | undefined): string {
  if (!value) return '시간 미정'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '시간 미정'

  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function getHeroImage(title: string): string {
  if (title.includes('서울')) {
    return 'https://images.unsplash.com/photo-1538485399081-7c89798d8b0c?auto=format&fit=crop&w=1600&q=80'
  }
  if (title.includes('설악') || title.includes('단풍')) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80'
  }
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
}

function getStatusLabel(status: string): string {
  if (status === 'draft') return '초안'
  if (status === 'ready' || status === 'confirmed') return '예정'
  if (status === 'optimized') return '최적화 완료'
  if (status === 'in_progress') return '진행 중'
  if (status === 'completed') return '완료'
  if (status === 'cancelled' || status === 'archived') return '보관됨'
  return status
}

function buildSections(item: PlanDetail): DisplaySection[] {
  if (item.stops.length === 0) return []

  const fallbackIcons: IconName[] = [
    'car',
    'pin',
    'fork',
    'home',
    'clock',
    'moon',
    'bag',
    'pin',
  ]
  const sections = new Map<string, { date: Date | null; stops: DisplayStop[] }>()

  item.stops.forEach((stop, index) => {
    const candidate = stop.arrive_at ?? stop.leave_at ?? item.start_at
    let key = 'unscheduled'
    let date: Date | null = null

    if (candidate) {
      const parsed = new Date(candidate)
      if (!Number.isNaN(parsed.getTime())) {
        key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(parsed)
        date = parsed
      }
    }

    const current = sections.get(key) ?? { date, stops: [] }
    current.stops.push({
      id: stop.id,
      label:
        stop.custom_name?.trim() ||
        stop.place?.name ||
        (stop.place_id ? `장소 ${stop.stop_order}` : `직접 입력 스톱 ${stop.stop_order}`),
      timeLabel: formatTimelineTime(stop.arrive_at ?? stop.leave_at),
      icon: fallbackIcons[index % fallbackIcons.length] ?? 'pin',
      locked: stop.locked,
    })
    sections.set(key, current)
  })

  return Array.from(sections.entries()).map(([key, section], index) => ({
    key,
    label: section.date
      ? `Day ${index + 1} · ${new Intl.DateTimeFormat('ko-KR', {
          month: 'numeric',
          day: 'numeric',
          weekday: 'short',
        }).format(section.date)}`
      : '방문 후보',
    stops: section.stops,
  }))
}

function TimelineIcon({ name }: { name: IconName }): React.JSX.Element {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-[1.25rem] w-[1.25rem] text-[#7a9697]',
  }
  if (name === 'car') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 16v-3l2-5h10l2 5v3" />
        <path d="M7 16v2" />
        <path d="M17 16v2" />
        <path d="M4 13h16" />
        <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (name === 'pin') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-5-4.8-5-10a5 5 0 1 1 10 0c0 5.2-5 10-5 10Z" />
        <circle cx="12" cy="11" r="1.7" />
      </svg>
    )
  }
  if (name === 'fork') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 3v7" />
        <path d="M8 3v7" />
        <path d="M5 7h3" />
        <path d="M6.5 10v11" />
        <path d="M15 3v18" />
        <path d="M19 3c1.2 1.7 1.2 4.4 0 6.2" />
      </svg>
    )
  }
  if (name === 'home') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 11 8-6 8 6" />
        <path d="M6 10v9h12v-9" />
        <path d="M10 19v-5h4v5" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    )
  }
  if (name === 'moon') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 14.5A7 7 0 0 1 9.5 6 7.5 7.5 0 1 0 18 14.5Z" />
      </svg>
    )
  }
  return (
    <svg
      {...common}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5h10" />
      <path d="M7 9h10" />
      <path d="M8 3v6" />
      <path d="M16 3v6" />
      <path d="M6 10v10h12V10" />
      <path d="M10 14h4" />
    </svg>
  )
}

function ActionIcon({ kind }: { kind: 'edit' | 'api' | 'delete' }): React.JSX.Element {
  if (kind === 'edit') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[1rem] w-[1rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20h4l9-9-4-4-9 9Z" />
        <path d="m13 7 4 4" />
      </svg>
    )
  }
  if (kind === 'api') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[1rem] w-[1rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 4 4 12l4 8" />
        <path d="m16 4 4 8-4 8" />
        <path d="M14 6 10 18" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1rem] w-[1rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

function MapPreview({ stopCount }: { stopCount: number }): React.JSX.Element {
  if (stopCount === 0) {
    return (
      <div className="mt-5 flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center text-sm text-neutral-500">
        아직 표시할 경로가 없습니다. 장소를 담고 저장하면 여기서 동선을 검토할 수 있습니다.
      </div>
    )
  }

  const visibleMarkers = Array.from({ length: Math.min(stopCount, 5) }, (_, index) => ({
    x: 168 + index * 20,
    y: 148 + index * 60,
    n: index + 1,
  }))

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_8px_20px_rgba(38,70,83,0.08)]">
      <svg viewBox="0 0 340 520" className="h-[420px] w-full" aria-hidden="true">
        <rect width="340" height="520" fill="#eef2db" />
        <rect x="0" y="0" width="340" height="170" fill="#f3efdb" />
        <rect x="130" y="0" width="210" height="520" fill="#eef3e1" opacity="0.45" />
        <path d="M170 0v520" stroke="#d9c58e" strokeWidth="3" opacity="0.75" />
        <path d="M0 200h340" stroke="#d9c58e" strokeWidth="3" opacity="0.75" />
        <path
          d="M40 120 C 80 130, 110 150, 150 160"
          fill="none"
          stroke="#d5ddc8"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M70 260 C 140 255, 165 260, 230 280"
          fill="none"
          stroke="#d5ddc8"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M210 70 C 250 110, 276 126, 322 132"
          fill="none"
          stroke="#d5ddc8"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M102 460 C 145 438, 180 430, 250 438"
          fill="none"
          stroke="#d5ddc8"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M180 170 C 215 220, 236 255, 252 330"
          fill="none"
          stroke="#4d93d6"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M252 330 C 228 356, 210 382, 186 420"
          fill="none"
          stroke="#4d93d6"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {visibleMarkers.map((marker) => (
          <g key={marker.n}>
            <circle cx={marker.x} cy={marker.y} r="19" fill="#2f8a88" />
            <text
              x={marker.x}
              y={marker.y + 6}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#fff"
            >
              {marker.n}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function PlanDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = useMemo(
    () => (typeof params?.id === 'string' ? params.id : ''),
    [params],
  )

  const [item, setItem] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [transportMode, setTransportMode] = useState<TravelMode>('car')
  const [originName, setOriginName] = useState('')

  const loadPlan = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`플랜을 불러오지 못했습니다. (${response.status})`)
      }

      const payload = (await response.json()) as PlanDetailResponse
      const nextItem = payload.data
      setItem(nextItem)
      setTitle(nextItem.title)
      setStartAt(toDatetimeLocal(nextItem.start_at))
      setTransportMode(nextItem.transport_mode)
      setOriginName(nextItem.origin_name ?? '')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '플랜을 불러오지 못했습니다.'
      setError(message)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadPlan()
  }, [loadPlan])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setSaveError('플랜 제목은 필수입니다.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          transport_mode: transportMode,
          origin_name: originName.trim() || null,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(
          payload?.error?.message ?? `플랜을 저장하지 못했습니다. (${response.status})`,
        )
      }

      setEditing(false)
      await loadPlan()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '플랜을 저장하지 못했습니다.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || deleting) return
    if (!window.confirm('이 플랜을 삭제할까요?')) return

    setDeleting(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/v1/plans/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(
          payload?.error?.message ?? `플랜을 삭제하지 못했습니다. (${response.status})`,
        )
      }
      router.push('/plans')
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '플랜을 삭제하지 못했습니다.'
      setSaveError(message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary-300 bg-white px-5 py-4 text-sm text-primary-700 shadow-sm">
          플랜을 불러오는 중입니다...
        </div>
      </main>
    )
  }

  if (error || !item) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-coral-500 bg-white px-5 py-4 text-sm text-coral-500 shadow-sm">
          {error ?? '플랜을 찾을 수 없습니다.'}
        </div>
      </main>
    )
  }

  const heroImage = getHeroImage(item.title)
  const sections = buildSections(item)
  const regionLabel = item.region ? REGION_LABELS[item.region] ?? item.region : '지역 미정'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,242,240,0.92),_rgba(248,250,251,1)_42%,_rgba(252,247,235,0.92)_100%)] px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-7">
        <div>
          <h1 className="text-[3.6rem] font-bold tracking-tight text-primary-900">
            나의 여행 계획
          </h1>
          <p className="mt-2 text-[1.2rem] text-neutral-700">
            저장한 장소와 출발 일시를 한 화면에서 검토하고 수정하세요.
          </p>
        </div>

        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.44fr_0.88fr]">
          <aside className="rounded-[2rem] border border-white/90 bg-white/92 p-6 shadow-[0_16px_40px_rgba(38,70,83,0.10)]">
            {sections.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-sm text-neutral-500">
                <p className="font-semibold text-primary-900">아직 추가한 장소가 없습니다.</p>
                <p className="mt-2">
                  장소 둘러보기에서 후보를 담고 돌아오면 여기에 실제 동선이 나타납니다.
                </p>
                <Link
                  href="/places"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#2f8a88] px-5 text-sm font-semibold text-white transition hover:bg-[#2a7674]"
                >
                  장소 둘러보기로 이동
                </Link>
              </div>
            ) : (
              <div className="space-y-7">
                {sections.map((section) => (
                  <div key={section.key} className="space-y-5">
                    <h2 className="text-[2.05rem] font-bold tracking-tight text-primary-900">
                      {section.label}
                    </h2>
                    <div className="space-y-5">
                      {section.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="grid grid-cols-[88px_18px_1fr] items-start gap-4"
                        >
                          <div className="pt-1 text-right text-[1.02rem] font-medium text-neutral-800">
                            {stop.timeLabel}
                          </div>
                          <div className="relative flex min-h-14 justify-center">
                            <div className="absolute top-0 h-full w-[4px] rounded-full bg-[#7ad2c6]/55" />
                            <span className="relative z-10 mt-1.5 flex h-[0.95rem] w-[0.95rem] rounded-full bg-[#2f8a88] ring-[4px] ring-[#ecfaf7]" />
                          </div>
                          <div>
                            <div className="flex items-start gap-2.5">
                              <span className="pt-[0.28rem]">
                                <TimelineIcon name={stop.icon} />
                              </span>
                              <h3 className="text-[1.58rem] font-bold leading-[1.18] tracking-tight text-primary-900">
                                {stop.label}
                              </h3>
                            </div>
                            {stop.locked ? (
                              <span className="mt-2 inline-flex rounded-full bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-700">
                                고정됨
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/92 shadow-[0_16px_40px_rgba(38,70,83,0.10)]">
            <div className="overflow-hidden rounded-t-[2rem]">
              <div
                className="relative h-[320px]"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.42) 100%), url(${heroImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                  <div className="px-8 drop-shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                    <span className="inline-flex rounded-full bg-white/18 px-4 py-1 text-sm font-semibold backdrop-blur">
                      {getStatusLabel(item.status)}
                    </span>
                    <h2 className="mt-4 text-[3.4rem] font-bold tracking-tight">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-[1.5rem] font-medium text-white/92">
                      {formatPlanDateTime(item.start_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <p className="text-[1.05rem] leading-8 text-neutral-800">
                {item.stops.length > 0
                  ? `${regionLabel} 중심으로 정리한 일정입니다. 현재 저장된 스톱 ${item.stops.length}개를 기준으로 이동 순서와 출발 정보를 검토할 수 있습니다.`
                  : `${regionLabel} 일정의 기본 정보만 먼저 저장된 상태입니다. 출발 일시를 정하고 장소를 추가하면 동선 검토가 쉬워집니다.`}
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setEditing((current) => !current)}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#2f8a88] px-5 text-[1rem] font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.2)] transition hover:bg-[#2a7674]"
                >
                  <ActionIcon kind="edit" />
                  {editing ? '수정 닫기' : '플랜 수정'}
                </button>
                <Link
                  href={`/api/v1/plans/${id}`}
                  prefetch={false}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-neutral-300 px-5 text-[1rem] font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  <ActionIcon kind="api" />
                  API 보기
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-coral-500 px-5 text-[1rem] font-semibold text-coral-500 transition hover:bg-coral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ActionIcon kind="delete" />
                  {deleting ? '삭제 중...' : '플랜 삭제'}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/90 bg-white/92 p-5 shadow-[0_16px_40px_rgba(38,70,83,0.10)]">
            <h2 className="text-[2.25rem] font-bold tracking-tight text-primary-900">
              여행 요약
            </h2>
            <MapPreview stopCount={item.stops.length} />
            <div className="mt-5 space-y-2 text-sm text-neutral-600">
              <p>상태: {getStatusLabel(item.status)}</p>
              <p>지역: {regionLabel}</p>
              <p>이동 수단: {TRANSPORT_LABELS[item.transport_mode]}</p>
              <p>출발 일시: {formatPlanDateTime(item.start_at)}</p>
              <p>출발지: {item.origin_name ?? '미정'}</p>
              <p>스톱 수: {item.stops.length}개</p>
            </div>
          </aside>
        </section>

        {editing ? (
          <section className="rounded-[2rem] border border-white/90 bg-white/92 p-6 shadow-[0_16px_40px_rgba(38,70,83,0.10)]">
            <h2 className="text-3xl font-bold text-primary-900">플랜 수정</h2>
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
              <label>
                <span className="mb-2 block text-sm font-semibold text-neutral-600">
                  제목
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-neutral-600">
                  이동 수단
                </span>
                <select
                  value={transportMode}
                  onChange={(event) => setTransportMode(event.target.value as TravelMode)}
                  className="h-12 w-full rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                >
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {TRANSPORT_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-neutral-600">
                  출발 일시
                </span>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-neutral-600">
                  출발지 이름
                </span>
                <input
                  value={originName}
                  onChange={(event) => setOriginName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-300 px-4 text-base font-medium text-primary-900 outline-none transition focus:border-[#2f8a88]"
                  placeholder="예: 부산역"
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#2f8a88] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(42,157,143,0.22)] transition hover:bg-[#2a7674] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? '저장 중...' : '변경사항 저장'}
                </button>
              </div>
            </form>
            {saveError ? (
              <p className="mt-4 rounded-2xl border border-coral-500 bg-coral-50 px-4 py-3 text-sm text-coral-500">
                {saveError}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  )
}
