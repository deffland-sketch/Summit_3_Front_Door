import type { Offering, Slot } from '@/model'
import { useCopy } from '@/copy'
import { formatTime12, weekDates, weekdayOf } from '@/lib/time'
import { TYPE_STYLE } from './types'

const DAY_NAMES: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }
export function dayName(iso: string): string {
  return DAY_NAMES[weekdayOf(iso)]
}

/** Five columns on desktop, one swipeable day on phone. */
export function WeekGrid({ weekStart, slots, offerings, day, onDay, onSlot, today }: { weekStart: string; slots: Slot[]; offerings: Map<string, Offering>; day: string; onDay: (d: string) => void; onSlot?: (s: Slot) => void; today: string }) {
  const c = useCopy()
  const dates = weekDates(weekStart)
  const live = slots.filter((s) => s.status !== 'cancelled')
  return (
    <div>
      <div className="mb-3 flex gap-1 md:hidden" role="group" aria-label={c.week.swipeHint}>
        {dates.map((d) => (
          <button key={d} type="button" aria-pressed={day === d} onClick={() => onDay(d)} className={`flex-1 rounded-lg px-2 py-1 text-sm font-bold ${day === d ? 'bg-indigo text-white' : 'border border-line'}`}>
            {dayName(d).slice(0, 3)}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {dates.map((d) => (
          <section key={d} aria-labelledby={`day-${d}`} className={`${day === d ? '' : 'hidden md:block'}`}>
            <h3 id={`day-${d}`} className={`mb-2 text-sm ${d === today ? 'text-orange-ink' : ''}`}>
              {dayName(d)}
              {d === today ? ` · ${c.app.today}` : ''}
            </h3>
            <ol className="space-y-1.5">
              {live
                .filter((s) => s.day === d)
                .map((s) => {
                  const o = s.offering_id ? offerings.get(s.offering_id) : null
                  const isOpen = s.offering_id === null && s.entry === 'chosen'
                  const protectedSlot = s.entry === 'protected'
                  const style = TYPE_STYLE[s.experience_type]
                  const label = protectedSlot ? c.app.protectedTime : isOpen ? c.app.openSlot : o?.title ?? c.types[s.experience_type]
                  const struck = s.status === 'moved'
                  const body = (
                    <>
                      <span className="block text-xs text-ink-2">
                        {formatTime12(s.start)} to {formatTime12(s.end)}
                      </span>
                      <span className={`block text-sm font-bold ${struck ? 'line-through' : ''}`}>{label}</span>
                      {!protectedSlot ? <span className={`block text-xs ${style.ink}`}>{c.types[s.experience_type]}{s.added_at ? ` · ${c.week.newTag}` : ''}</span> : null}
                    </>
                  )
                  const cls = `block w-full rounded-lg border border-line p-2 text-left ${protectedSlot ? 'bg-tan-grey-2' : `border-l-4 ${style.edge} bg-surface`} ${isOpen ? 'border-dashed' : ''}`
                  return (
                    <li key={s.id}>
                      {onSlot && !protectedSlot ? (
                        <button type="button" onClick={() => onSlot(s)} className={cls} aria-label={`${label}, ${formatTime12(s.start)}, ${c.types[s.experience_type]}`}>
                          {body}
                        </button>
                      ) : (
                        <div className={cls}>{body}</div>
                      )}
                    </li>
                  )
                })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

export function TypeLegend() {
  const c = useCopy()
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={c.week.legend}>
      {(Object.keys(TYPE_STYLE) as (keyof typeof TYPE_STYLE)[]).map((t) => (
        <li key={t} className="flex items-center gap-1">
          <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${TYPE_STYLE[t].fill}`} />
          {c.types[t]}
        </li>
      ))}
    </ul>
  )
}
