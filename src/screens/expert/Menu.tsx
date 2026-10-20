import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Chip, H1 } from '@/components/ui'
import { TYPE_STYLE, TYPE_ORDER } from '@/components/types'
import { dayName } from '@/components/WeekGrid'
import { upsertOffering } from '@/store/actions'
import { formatTime12, weekDates } from '@/lib/time'
import { newLedger } from '@/engine'
import { weekOfferingsFor } from './shared'

export function Menu() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const [day, setDay] = useState(today)
  const ledger = useMemo(() => newLedger(snap), [snap])
  const offerings = useMemo(() => weekOfferingsFor(snap).filter((o) => o.day === day && o.status !== 'cancelled'), [snap, day])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.menu} <Explain id="expert.menu" /></H1>
        <p className="text-sm text-ink-2">{c.expert.menuLede}</p>
      </div>
      <div className="flex gap-1" role="group" aria-label={c.week.swipeHint}>
        {weekDates(snap.meta.week_start).map((d) => (
          <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} className={`rounded-lg px-3 py-1 text-sm font-bold ${day === d ? 'bg-indigo text-white' : 'border border-line'}`}>{dayName(d).slice(0, 3)}</button>
        ))}
      </div>
      {TYPE_ORDER.map((t) => {
        const list = offerings.filter((o) => o.experience_type === t)
        if (!list.length) return null
        return (
          <section key={t} aria-labelledby={`menu-${t}`}>
            <h2 id={`menu-${t}`} className={`text-base ${TYPE_STYLE[t].ink}`}>{c.types[t]}</h2>
            <Card className="mt-1">
              <ul className="divide-y divide-line text-sm">
                {list.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                    <span>
                      <span className="font-bold">{formatTime12(o.start)}</span> · {o.title} <span className="text-ink-2">· {idx.places.get(o.place_id)?.name} · {o.adult_ids.map((a) => idx.adults.get(a)?.display_name).filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Chip className={o.status === 'published' ? 'bg-teal-2 text-teal-ink' : 'bg-orange-2 text-orange-ink'}>{o.status === 'published' ? c.expert.capacity(ledger.fill.get(o.id) ?? 0, o.capacity_max) : c.mentor.draft}</Chip>
                      {o.kind !== 'community' && o.experience_type !== 'RG' ? (
                        <Button kind="quiet" onClick={() => upsertOffering({ ...o, status: o.status === 'published' ? 'draft' : 'published' })}>{o.status === 'published' ? c.expert.unpublish : c.expert.publish}</Button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
