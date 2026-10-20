import { useCopy } from '@/copy'
import { useUi } from '@/store/ui'

/**
 * The "assumed" chip (LOOP.md): marks a screen element that depends on an open QUESTIONS.md item.
 * Visible only while the sandbox setting show_assumptions is on (default on in sandbox mode).
 */
export function Assumed({ q, className = '' }: { q: number; className?: string }) {
  const c = useCopy()
  const show = useUi((u) => u.showAssumptions)
  if (!show) return null
  return (
    <span className={`inline-block rounded-full bg-tan-grey-2 px-1.5 py-0.5 align-middle text-[11px] font-bold text-tan-grey-ink ${className}`} title={c.assumed.title(q)} data-assumed={q}>
      {c.assumed.label} Q{q}
    </span>
  )
}
