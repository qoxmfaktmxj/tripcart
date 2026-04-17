import type { PlanStatus } from '@tripcart/types'

type StatusVariant = PlanStatus | 'sample' | 'guest' | 'locked' | 'shared'

type BadgeConfig = {
  label: string
  dotClass: string
  chipClass: string
}

const STATUS_MAP: Record<StatusVariant, BadgeConfig> = {
  draft: {
    label: '초안',
    dotClass: 'bg-neutral-400',
    chipClass: 'bg-neutral-100 text-neutral-600',
  },
  optimized: {
    label: '최적화',
    dotClass: 'bg-gold-500',
    chipClass: 'bg-gold-50 text-gold-700',
  },
  confirmed: {
    label: '예정',
    dotClass: 'bg-success',
    chipClass: 'bg-success-light text-success-dark',
  },
  in_progress: {
    label: '진행 중',
    dotClass: 'bg-primary-500',
    chipClass: 'bg-primary-50 text-primary-700',
  },
  completed: {
    label: '완료',
    dotClass: 'bg-success',
    chipClass: 'bg-success-light text-success-dark',
  },
  cancelled: {
    label: '취소됨',
    dotClass: 'bg-neutral-400',
    chipClass: 'bg-neutral-100 text-neutral-500',
  },
  shared: {
    label: '공유됨',
    dotClass: 'bg-plum-500',
    chipClass: 'bg-plum-50 text-plum-700',
  },
  locked: {
    label: '고정됨',
    dotClass: 'bg-plum-500',
    chipClass: 'bg-plum-50 text-plum-700',
  },
  sample: {
    label: '추천 예시',
    dotClass: 'bg-neutral-400',
    chipClass: 'bg-neutral-100 text-neutral-600',
  },
  guest: {
    label: '브라우저 초안',
    dotClass: 'bg-neutral-400',
    chipClass: 'bg-neutral-100 text-neutral-600',
  },
}

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: StatusVariant
  size?: 'xs' | 'sm'
}): React.JSX.Element {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.draft
  const textSize = size === 'xs' ? 'text-[0.72rem]' : 'text-[0.82rem]'
  const padding = size === 'xs' ? 'px-2.5 py-0.5' : 'px-3 py-[0.35rem]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${textSize} ${padding} ${cfg.chipClass}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  )
}
