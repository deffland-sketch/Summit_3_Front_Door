import type { Touchpoint } from '@/model'
import { format, parseISO } from 'date-fns'

const KIND_LABEL: Record<string, string> = { plan: 'Plan', check_in: 'Check-in', feedback: 'Feedback', reflection: 'Reflection', goal: 'Goal', family: 'Family', validation_prep: 'Validation prep' }
export const touchpointKindLabel = (k: string) => KIND_LABEL[k] ?? k

/** A small marker on the day with the time and kind. Touchpoints are never slots. */
export function TouchpointChip({ tp, who }: { tp: Touchpoint; who?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo px-2 py-0.5 text-xs text-indigo dark:text-indigo-1 dark:border-indigo-1">
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
      {format(parseISO(tp.when), 'h:mm a')} · {touchpointKindLabel(tp.kind)}
      {who ? ` · ${who}` : ''}
    </span>
  )
}
