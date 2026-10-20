import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useSnapshot } from '@/app/hooks'
import { Card, Chip, H1, H2, Stat } from '@/components/ui'
import { TYPE_ORDER } from '@/components/types'
import { latestByOutcome } from '@/lib'
import { shiftDate } from '@/lib/time'
import { LEVELS } from '@/model'
import { currentPlans, pct, targetShares, typeShares } from './shared'

/** The funder view (Spec 5): is Summit 3.0 running here. */
export function ModelDashboard() {
  const c = useCopy()
  const snap = useSnapshot()
  const data = useMemo(() => {
    const plans = currentPlans(snap)
    const actual = typeShares(plans)
    const target = targetShares(snap)
    const rows = TYPE_ORDER.map((t) => ({ type: t, actual: pct(actual[t]), target: pct(target[t]) }))
    const rwShare = plans.filter((p) => p.slots.some((s) => s.experience_type === 'RW' && s.status !== 'cancelled')).length
    const workshops = snap.offerings.filter((o) => o.kind === 'workshop' && o.day >= snap.meta.week_start && o.status === 'published')
    const traced = workshops.filter((o) => o.source_ref.startsWith('prop_')).length
    const weeks = 9
    const meanTp = snap.touchpoints.length / snap.students.length / weeks
    const byLevel = LEVELS.map((l) => ({ level: c.app.levels[l], n: snap.students.filter((s) => s.level === l).length }))
    const levelMoves = snap.touchpoints.filter((t) => t.kind === 'goal' && /Level: /.test(t.notes)).length
    const termStart = shiftDate(snap.meta.week_start, -56)
    let moved = 0
    for (const s of snap.students) {
      const mine = snap.evidence.filter((e) => e.student_id === s.id && typeof e.value === 'number')
      const now = latestByOutcome(mine)
      const before = latestByOutcome(mine, `${termStart}T00:00`)
      for (const [oid, e] of now) {
        const b = before.get(oid)
        if (b && typeof b.value === 'number' && (e.value as number) > b.value) moved++
      }
    }
    return { rows, rwShare, workshops: workshops.length, traced, meanTp, byLevel, levelMoves, moved }
  }, [snap, c])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.model} <Explain id="lead.model" /></H1>
        <p className="text-sm text-ink-2">{c.lead.modelLede}</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <li><Stat label={c.lead.rwShare} value={`${data.rwShare}%`} /></li>
        <li><Stat label={c.lead.workshopsShare} value={c.lead.share(data.traced, data.workshops)} /></li>
        <li><Stat label={c.lead.meanTouchpoints} value={data.meanTp.toFixed(1)} /></li>
        <li><Stat label={c.lead.levelMovement} value={data.levelMoves} /></li>
        <li><Stat label={c.lead.outcomesMoved} value={data.moved} /></li>
      </ul>
      <Card as="section">
        <H2>{c.lead.studentHours}</H2>
        <div className="mt-2 h-64" role="img" aria-label={data.rows.map((r) => `${c.types[r.type]} ${r.actual}% against ${r.target}%`).join('; ')}>
          <ResponsiveContainer>
            <BarChart data={data.rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="type" tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} />
              <YAxis unit="%" tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} />
              <Tooltip formatter={(v) => `${String(v)}%`} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' }} />
              <Bar dataKey="actual" name={c.lead.actual} fill="#4b4b96" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name={c.lead.target} fill="#96a0ab" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card as="section">
        <H2>{c.lead.studentsByLevel}</H2>
        <ul className="mt-2 grid grid-cols-4 gap-2">{data.byLevel.map((r) => <li key={r.level}><Stat label={r.level} value={r.n} /></li>)}</ul>
      </Card>
      <Card as="section">
        <H2>Sierra metrics</H2>
        <ul className="mt-2 grid gap-2 md:grid-cols-3">
          {Object.entries(c.lead.sierraMetrics).map(([k, label]) => <li key={k} className="rounded-xl border border-dashed border-line p-3"><p className="text-sm text-ink-2">{label}</p><Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.lead.surveyPlaceholder}</Chip></li>)}
        </ul>
      </Card>
    </div>
  )
}
