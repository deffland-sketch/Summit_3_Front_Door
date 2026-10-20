import { useEffect, useMemo, useState } from 'react'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { TYPE_STYLE } from '@/components/types'
import { en } from '@/copy/en'
import { formatTime12, toMin } from '@/lib/time'
import { currentPlans } from './shared'

/** Large type, rooms only. Never a program name, never a reason. */
export function DisplayBoard() {
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const [now, setNow] = useState('10:30')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    return () => document.documentElement.removeAttribute('data-theme')
  }, [])
  const rows = useMemo(() => {
    const plans = currentPlans(snap)
    const nowMin = toMin(now)
    const counts = new Map<string, number>()
    for (const p of plans) for (const s of p.slots) if (s.day === today && s.offering_id && s.status !== 'cancelled' && s.status !== 'moved' && toMin(s.start) > nowMin - 1 && toMin(s.start) <= nowMin + 60) counts.set(s.offering_id, (counts.get(s.offering_id) ?? 0) + 1)
    return snap.offerings.filter((o) => counts.has(o.id) && o.kind !== 'community').map((o) => ({ o, n: counts.get(o.id)! })).sort((a, b) => a.o.start.localeCompare(b.o.start) || a.o.title.localeCompare(b.o.title))
  }, [snap, today, now])
  const offCampus = rows.filter((r) => r.o.experience_type === 'RW')
  const onCampus = rows.filter((r) => r.o.experience_type !== 'RW')
  return (
    <main id="main" className="min-h-screen bg-brown p-8 text-white">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-4xl text-white">{en.app.name} · {en.app.today}</h1>
        <label className="text-xl">
          <span className="mr-2">{formatTime12(now)}</span>
          <input type="time" value={now} onChange={(e) => setNow(e.target.value)} className="rounded bg-white/10 px-2 py-1 text-white" aria-label="Board time" />
        </label>
      </header>
      <section aria-labelledby="board-on" className="mt-6">
        <h2 id="board-on" className="text-2xl text-peach">Next hour on campus</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {onCampus.map(({ o, n }) => (
            <li key={o.id} className="flex items-center gap-4 rounded-xl bg-white/10 p-4 text-2xl">
              <span aria-hidden="true" className={`inline-block h-10 w-3 rounded ${TYPE_STYLE[o.experience_type].fill}`} />
              <span className="font-bold">{formatTime12(o.start)}</span>
              <span>{o.title}</span>
              <span className="ml-auto text-peach">{idx.places.get(o.place_id)?.name} · {n}</span>
            </li>
          ))}
        </ul>
      </section>
      {offCampus.length ? (
        <section aria-labelledby="board-off" className="mt-6">
          <h2 id="board-off" className="text-2xl text-peach">Out in the world</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {offCampus.map(({ o, n }) => <li key={o.id} className="rounded-xl bg-white/10 p-4 text-2xl"><span className="font-bold">{formatTime12(o.start)}</span> {o.title} <span className="text-peach">· {n}</span></li>)}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
