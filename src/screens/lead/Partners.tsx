import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Card, Chip, H1, H2 } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { newLedger } from '@/engine'
import { formatTime12 } from '@/lib/time'
import { rosterFor } from '../expert/shared'

export function Partners() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const data = useMemo(() => {
    const ledger = newLedger(snap)
    const partners = snap.adults.filter((a) => a.capacities.includes('partner') || a.id === 'adu_coordinator')
    return partners.map((p) => {
      const offs = snap.offerings.filter((o) => o.experience_type === 'RW' && o.day >= snap.meta.week_start && o.adult_ids.includes(p.id) && o.status !== 'cancelled').sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start))
      const cap = offs.reduce((n, o) => n + o.capacity_max, 0)
      const fill = offs.reduce((n, o) => n + (ledger.fill.get(o.id) ?? 0), 0)
      return { p, offs: offs.map((o) => ({ o, fill: ledger.fill.get(o.id) ?? 0, roster: rosterFor(snap, o.id) })), cap, fill }
    }).filter((r) => r.offs.length)
  }, [snap])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.partners}</H1>
        <p className="text-sm text-ink-2">{c.lead.partnersLede}</p>
      </div>
      {data.map(({ p, offs, cap, fill }) => (
        <Card key={p.id} as="section" accent="border-t-brown">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <H2>{p.external_org ?? 'Summit Sierra placements'}</H2>
            <Chip className="bg-brown-2 text-brown dark:text-brown-1">{c.lead.fillRate}: {cap ? Math.round((fill / cap) * 100) : 0}%</Chip>
          </div>
          <p className="text-sm text-ink-2">{p.display_name}</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {offs.map(({ o, fill: f, roster }) => (
              <li key={o.id} className="py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><span className="font-bold">{dayName(o.day).slice(0, 3)} {formatTime12(o.start)}</span> · {o.title} <span className="text-ink-2">· {idx.places.get(o.place_id)?.name}</span></span>
                  <span className={f < o.capacity_min ? 'font-bold text-orange-ink' : ''}>{f} / {o.capacity_max}{f < o.capacity_min ? ` · ${c.lead.unfilled}` : ''}</span>
                </div>
                <p className="text-xs text-ink-2">{roster.map((r) => r.student.display_name).join(', ')}</p>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
