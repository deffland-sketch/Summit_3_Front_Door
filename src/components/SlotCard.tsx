import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Adult, Offering, Place, Slot } from '@/model'
import { useCopy } from '@/copy'
import { formatTime12 } from '@/lib/time'
import { TYPE_STYLE } from './types'
import { Chevron, Chip } from './ui'

export function WhyLine({ why, entry }: { why: string; entry: Slot['entry'] }) {
  const c = useCopy()
  const word = entry === 'required' ? c.app.required : entry === 'recommended' ? c.app.recommended : entry === 'chosen' ? c.app.yourChoice : entry === 'protected' ? c.app.protectedTime : entry === 'assigned' ? c.app.assigned : c.app.everyoneHere
  return (
    <p className="text-sm">
      <span className="font-bold">{word}.</span> {why}
    </p>
  )
}

export function ProtectedBlock({ slot, label }: { slot: Slot; label: string }) {
  return (
    <div className="rounded-xl bg-tan-grey-2 p-4 text-sm" aria-label={`${label}, ${formatTime12(slot.start)} to ${formatTime12(slot.end)}`}>
      <p className="font-bold">{label}</p>
      <p className="text-ink-2">
        {formatTime12(slot.start)} to {formatTime12(slot.end)}
      </p>
    </div>
  )
}

export function TypeChip({ type }: { type: Slot['experience_type'] }) {
  const c = useCopy()
  return <Chip className={TYPE_STYLE[type].chip}>{c.types[type]}</Chip>
}

export interface SlotCardProps {
  slot: Slot
  offering?: Offering | null
  place?: Place | null
  leads?: Adult[]
  peopleCount?: number
  pinned?: boolean
  children?: ReactNode
  onOpen?: () => void
  struck?: boolean
}

/** One slot as the student sees it: type color on the edge, title, time, place, who leads, and one line of why. */
export function SlotCard({ slot, offering, place, leads = [], peopleCount, pinned, children, struck }: SlotCardProps) {
  const c = useCopy()
  const [open, setOpen] = useState(Boolean(pinned))
  if (slot.entry === 'protected') return <ProtectedBlock slot={slot} label={c.app.protectedTime} />
  const style = TYPE_STYLE[slot.experience_type]
  const isOpen = slot.offering_id === null && slot.entry === 'chosen'
  const title = isOpen ? c.app.openSlot : offering?.title ?? c.types[slot.experience_type]
  const isNew = Boolean(slot.added_at)
  return (
    <article className={`rounded-xl border border-line bg-surface border-l-4 ${isOpen ? 'border-dashed' : ''} ${style.edge} ${struck ? 'opacity-60 line-through' : ''} ${pinned ? 'ring-2 ring-orange' : ''}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {!isOpen ? <TypeChip type={slot.experience_type} /> : null}
            {isNew ? <Chip className="bg-orange-2 text-orange-ink">{c.app.newSinceYesterday}</Chip> : null}
            {slot.status === 'missed' ? <Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.slot.status.missed}</Chip> : null}
            {slot.status === 'attended' && !isOpen ? <Chip className="bg-teal-2 text-teal-ink">{c.slot.status.attended}</Chip> : null}
            {slot.status === 'cancelled' ? <Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.slot.status.cancelled}</Chip> : null}
          </div>
          <h3 className="text-base text-ink">{title}</h3>
          <p className="text-sm text-ink-2">
            {formatTime12(slot.start)} to {formatTime12(slot.end)}
            {place ? ` · ${place.name}` : ''}
            {leads.length ? ` · ${c.slot.leads} ${leads.map((a) => a.display_name).join(', ')}` : ''}
            {typeof peopleCount === 'number' && peopleCount > 0 ? ` · ${c.slot.people(peopleCount)}` : ''}
          </p>
          <WhyLine why={slot.why} entry={slot.entry} />
        </div>
        <span className="mt-1 shrink-0 text-ink-2">
          <Chevron open={open} />
        </span>
      </button>
      {open && children ? <div className="border-t border-line p-4">{children}</div> : null}
      {!isOpen ? <p className="px-4 pb-3 text-xs"><Link to={`/l/trace?slot=${slot.id}`} className="text-indigo underline dark:text-indigo-1">{c.lead.whyThis}</Link></p> : null}
    </article>
  )
}
