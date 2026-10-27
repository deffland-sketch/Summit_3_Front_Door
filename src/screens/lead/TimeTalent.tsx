import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCopy } from '@/copy'
import { Assumed } from '@/components/Assumed'
import { Explain } from '@/components/Explain'
import { useSnapshot } from '@/app/hooks'
import { Card, Chip, H1, H2, Stat } from '@/components/ui'
import { TYPE_ORDER, TYPE_STYLE } from '@/components/types'
import { minutesBetween } from '@/lib/time'
import { currentPlans, pct, targetShares, typeShares } from './shared'
import { proposeWorkshops } from '@/engine'

export function TimeTalent() {
  const c = useCopy()
  const snap = useSnapshot()
  const data = useMemo(() => {
    const plans = currentPlans(snap)
    const actual = typeShares(plans)
    const target = targetShares(snap)
    const rows = TYPE_ORDER.map((t) => ({ type: t, label: c.types[t], actual: pct(actual[t]), target: pct(target[t]) }))
    const outside = rows.filter((r) => Math.abs(r.actual - r.target) > 10).map((r) => `${r.label} (${r.actual}% against ${r.target}%)`)
    const within = outside.length === 0
    const adultHours: Record<string, number> = {}
    for (const o of snap.offerings) {
      if (o.day < snap.meta.week_start || o.status !== 'published') continue
      for (const a of o.adult_ids) {
        const adult = snap.adults.find((x) => x.id === a)
        const cap = adult?.capacities[0] ?? 'other'
        adultHours[cap] = (adultHours[cap] ?? 0) + minutesBetween(o.start, o.end) / 60
      }
    }
    const workshops = snap.offerings.filter((o) => o.kind === 'workshop' && o.day >= snap.meta.week_start && o.status === 'published')
    const traced = workshops.filter((o) => o.source_ref.startsWith('prop_')).length
    const proposals = proposeWorkshops(snap).filter((p) => p.kind === 'workshop').length
    return { rows, within, outside, adultHours, workshops: workshops.length, traced, proposals }
  }, [snap, c])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.time} <Explain id="lead.time" /></H1>
        <p className="text-sm text-ink-2">{c.lead.timeLede}</p>
      </div>
      <Card as="section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H2>{c.lead.studentHours} <Assumed q={6} /> <Assumed q={19} /></H2>
          <Chip className={data.within ? 'bg-teal-2 text-teal-ink' : 'bg-orange-2 text-orange-ink'}>{data.within ? c.lead.withinTen : c.lead.outsideTen}</Chip>
        </div>
        <p className="mt-1 text-sm" data-testid="outside-ten">{data.within ? c.lead.allWithin : c.lead.outsideList(data.outside)}</p>
        <div className="mt-2 h-72" role="img" aria-label={data.rows.map((r) => `${r.label}: ${r.actual}% this week, target ${r.target}%`).join('; ')}>
          <ResponsiveContainer>
            <BarChart data={data.rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="type" tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} />
              <YAxis unit="%" tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} />
              <Tooltip formatter={(v) => `${String(v)}%`} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }} />
              <Legend />
              <Bar dataKey="actual" name={c.lead.actual} fill="#508278" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name={c.lead.target} fill="#96a0ab" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="mt-2 w-full text-sm">
          <thead><tr className="text-left text-ink-2"><th className="font-bold">Type</th><th className="font-bold">{c.lead.actual}</th><th className="font-bold">{c.lead.target}</th></tr></thead>
          <tbody>{data.rows.map((r) => <tr key={r.type} className="border-t border-line"><td className="py-1"><span aria-hidden="true" className={`mr-2 inline-block h-3 w-3 rounded-sm ${TYPE_STYLE[r.type].fill}`} />{r.label}</td><td>{r.actual}%</td><td>{r.target}%</td></tr>)}</tbody>
        </table>
      </Card>
      <section aria-labelledby="ws">
        <H2 id="ws">{c.lead.workshopsTraced}</H2>
        <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <li><Stat label={c.lead.workshopsTraced} value={c.lead.share(data.traced, data.workshops)} /></li>
          <li><Stat label={c.expert.proposed} value={data.proposals} /></li>
        </ul>
      </section>
      <section aria-labelledby="adults">
        <H2 id="adults">{c.lead.adultHours}</H2>
        <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(data.adultHours).map(([k, h]) => <li key={k}><Stat label={k.replace('_', ' ')} value={`${Math.round(h)} h`} /></li>)}
        </ul>
      </section>
    </div>
  )
}
