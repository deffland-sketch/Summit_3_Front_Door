import type { FlagKind } from '@/engine/flags'
import { useCopy } from '@/copy'

const COLOR: Record<FlagKind, string> = { nudge: 'bg-orange', ready: 'bg-teal', grew: 'bg-teal', family: 'bg-red', level_review: 'bg-indigo' }

/** Color never carries meaning alone: the label travels with the dot. */
export function FlagDot({ kind, detail, compact }: { kind: FlagKind; detail?: string; compact?: boolean }) {
  const c = useCopy()
  const label = { nudge: c.flags.nudge, ready: c.flags.ready, grew: c.flags.grew, family: c.flags.family, level_review: c.flags.levelReview }[kind]
  if (kind === 'grew') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-ink" title={detail}>
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="M6 1l5 6H7v4H5V7H1z" fill="currentColor" /></svg>
        {compact ? <span className="sr-only">{label}</span> : label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold" title={detail}>
      <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR[kind]}`} />
      {compact ? <span className="sr-only">{label}</span> : label}
    </span>
  )
}
