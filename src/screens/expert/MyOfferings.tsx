import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Chip, Empty, H1, H2 } from '@/components/ui'
import { TypeChip } from '@/components/SlotCard'
import { dayName } from '@/components/WeekGrid'
import { adultOutToday } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12, weekDates } from '@/lib/time'
import { rosterFor, weekOfferingsFor } from './shared'

export function MyOfferings({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const toast = useUi((u) => u.toast)
  const outToday = useUi((u) => u.outToday)
  const [day, setDay] = useState(today)
  const mine = useMemo(() => weekOfferingsFor(snap, adultId).filter((o) => o.kind !== 'community' || o.source_ref.startsWith('grp_')), [snap, adultId])
  const dates = weekDates(snap.meta.week_start)
  const todays = mine.filter((o) => o.day === day)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <H1>{c.expert.offerings}</H1>
          <p className="text-sm text-ink-2">{c.expert.offeringsLede}</p>
        </div>
        {outToday[adultId] === today ? (
          <Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.expert.outToday}</Chip>
        ) : (
          <Button kind="danger" onClick={() => { const moves = adultOutToday(adultId, today); toast(c.expert.outDone(moves.length)) }}>{c.expert.outToday}</Button>
        )}
      </div>
      <div className="flex gap-1" role="group" aria-label={c.week.swipeHint}>
        {dates.map((d) => (
          <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} className={`rounded-lg px-3 py-1 text-sm font-bold ${day === d ? 'bg-indigo text-white' : 'border border-line'}`}>
            {dayName(d).slice(0, 3)} <span className="text-xs opacity-80">({mine.filter((o) => o.day === d).length})</span>
          </button>
        ))}
      </div>
      {todays.length ? (
        <ul className="space-y-3">
          {todays.map((o) => {
            const roster = rosterFor(snap, o.id)
            const lesson = o.lesson_id ? idx.lessons.get(o.lesson_id) : null
            return (
              <Card key={o.id} as="li" className={o.status === 'cancelled' ? 'opacity-60' : ''}>
                <div className="flex flex-wrap items-center gap-2">
                  <TypeChip type={o.experience_type} />
                  <H2>{o.title}</H2>
                  {o.status === 'cancelled' ? <Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.slot.status.cancelled}</Chip> : null}
                  {o.status === 'draft' ? <Chip className="bg-orange-2 text-orange-ink">{c.mentor.draft}</Chip> : null}
                </div>
                <p className="text-sm text-ink-2">
                  {formatTime12(o.start)} to {formatTime12(o.end)} · {idx.places.get(o.place_id)?.name} · {c.expert.capacity(roster.length, o.capacity_max)}
                </p>
                {lesson ? <p className="text-sm"><span className="font-bold">{c.expert.lesson}:</span> {lesson.title}</p> : null}
                <p className="text-sm"><span className="font-bold">{c.expert.outcomes}:</span> {o.outcomes_served.map((x) => idx.outcomes.get(x)?.name).filter(Boolean).join('; ')}</p>
                <p className="mt-1 text-sm font-bold">{c.expert.roster}</p>
                {roster.length ? (
                  <ul className="flex flex-wrap gap-1 text-sm">
                    {roster.map(({ student, slot }) => (
                      <li key={student.id} className="rounded-full border border-line px-2 py-0.5">
                        {student.display_name} <span className="text-ink-2">· {slot.entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-ink-2">{c.expert.noRoster}</p>}
              </Card>
            )
          })}
        </ul>
      ) : <Empty>{c.app.none}</Empty>}
    </div>
  )
}
