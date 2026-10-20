import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, H1, inputClass } from '@/components/ui'
import { TYPE_STYLE } from '@/components/types'
import { dayName } from '@/components/WeekGrid'
import { weekDates, formatTime12 } from '@/lib/time'
import { LEVELS } from '@/model'
import { currentPlans } from './shared'

export function LiveBoard() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const [day, setDay] = useState(today)
  const [level, setLevel] = useState('')
  const [group, setGroup] = useState('')
  const [family, setFamily] = useState('')
  const [print, setPrint] = useState(false)
  const rows = useMemo(() => {
    const plans = currentPlans(snap).filter((p) => {
      const s = idx.students.get(p.student_id)!
      return (!level || s.level === level) && (!group || s.community_group_id === group)
    })
    const counts = new Map<string, { names: string[] }>()
    for (const p of plans) for (const s of p.slots) if (s.day === day && s.offering_id && s.status !== 'cancelled' && s.status !== 'moved') counts.set(s.offering_id, { names: [...(counts.get(s.offering_id)?.names ?? []), idx.students.get(p.student_id)?.display_name ?? ''] })
    return snap.offerings
      .filter((o) => o.day === day && o.status === 'published' && counts.has(o.id))
      .filter((o) => !family || o.outcomes_served.some((x) => idx.outcomes.get(x)?.family === family))
      .map((o) => ({ o, n: counts.get(o.id)!.names.length, names: counts.get(o.id)!.names.sort() }))
      .sort((a, b) => a.o.start.localeCompare(b.o.start) || a.o.title.localeCompare(b.o.title))
  }, [snap, idx, day, level, group, family])
  const hours = [...new Set(rows.map((r) => r.o.start.slice(0, 2)))]
  return (
    <div className="space-y-4">
      <div className="no-print">
        <H1>{c.lead.live} <Explain id="lead.live" /></H1>
        <p className="text-sm text-ink-2">{c.lead.liveLede}</p>
      </div>
      <div className="no-print flex flex-wrap gap-2 text-sm">
        <div className="flex gap-1" role="group" aria-label={c.week.swipeHint}>
          {weekDates(snap.meta.week_start).map((d) => <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} className={`rounded-lg px-3 py-1 font-bold ${day === d ? 'bg-indigo text-white' : 'border border-line'}`}>{dayName(d).slice(0, 3)}</button>)}
        </div>
        <select aria-label={c.lead.filterLevel} className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}><option value="">{c.lead.filterLevel}: {c.app.all}</option>{LEVELS.map((l) => <option key={l} value={l}>{c.app.levels[l]}</option>)}</select>
        <select aria-label={c.lead.filterGroup} className={inputClass} value={group} onChange={(e) => setGroup(e.target.value)}><option value="">{c.lead.filterGroup}: {c.app.all}</option>{snap.groups.filter((g) => g.kind === 'community').map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select aria-label={c.lead.filterFamily} className={inputClass} value={family} onChange={(e) => setFamily(e.target.value)}><option value="">{c.lead.filterFamily}: {c.app.all}</option>{['cognitive', 'content', 'durable'].map((f) => <option key={f} value={f}>{c.app.families[f]}</option>)}</select>
        <Button kind="secondary" onClick={() => { setPrint(true); setTimeout(() => window.print(), 50) }}>{c.lead.printRoster}</Button>
        <Link to="/board" target="_blank" className="rounded-lg border border-indigo px-3 py-2 font-bold text-indigo dark:text-indigo-1">{c.lead.board}</Link>
      </div>
      {print ? <h2 className="text-xl">{c.lead.doorRoster} · {dayName(day)}</h2> : null}
      {hours.map((h) => (
        <section key={h} aria-labelledby={`hour-${h}`}>
          <h2 id={`hour-${h}`} className="text-base">{formatTime12(`${h}:00`)}</h2>
          <Card className="mt-1">
            <ul className="divide-y divide-line text-sm">
              {rows.filter((r) => r.o.start.slice(0, 2) === h).map(({ o, n, names }) => (
                <li key={o.id} className="py-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${TYPE_STYLE[o.experience_type].fill}`} />
                      <span className="font-bold">{formatTime12(o.start)} to {formatTime12(o.end)}</span> · {o.title} <span className="text-ink-2">· {idx.places.get(o.place_id)?.name} · {o.adult_ids.map((a) => idx.adults.get(a)?.display_name).filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="font-bold">{c.lead.count(n)}</span>
                  </div>
                  {print ? <p className="text-xs text-ink-2">{names.join(', ')}</p> : null}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  )
}
