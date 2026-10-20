import { useMemo } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useSnapshot } from '@/app/hooks'
import { Card, Empty, H1, H2, Stat } from '@/components/ui'
import { shiftDate } from '@/lib/time'
import { LEVELS } from '@/model'

export function Equity() {
  const c = useCopy()
  const snap = useSnapshot()
  const data = useMemo(() => {
    const weeks = [0, 1, 2, 3].map((k) => shiftDate(snap.meta.week_start, -7 * k))
    const rows = snap.students.map((s) => {
      const plans = weeks.map((w) => snap.plans.find((p) => p.student_id === s.id && p.week_start === w))
      const requiredWeeks = plans.filter((p) => p?.slots.some((x) => x.entry === 'required')).length
      const rwAny = plans.some((p) => p?.slots.some((x) => x.experience_type === 'RW' && x.status !== 'cancelled'))
      const tps = weeks.map((w) => snap.touchpoints.filter((t) => t.student_id === s.id && t.when.slice(0, 10) >= w && t.when.slice(0, 10) < shiftDate(w, 7)).length)
      const pastWeeksMean = (tps[1] + tps[2] + tps[3]) / 3
      return { s, requiredWeeks, rwAny, pastWeeksMean }
    })
    const recurring = rows.filter((r) => r.requiredWeeks >= 3)
    const noRw = rows.filter((r) => !r.rwAny)
    const few = rows.filter((r) => r.pastWeeksMean < 2)
    const by = (pred: (r: (typeof rows)[number]) => boolean) => ({ withSupports: rows.filter((r) => r.s.supports.length && pred(r)).length, withoutSupports: rows.filter((r) => !r.s.supports.length && pred(r)).length, total: { withSupports: rows.filter((r) => r.s.supports.length).length, withoutSupports: rows.filter((r) => !r.s.supports.length).length } })
    const byLevel = (pred: (r: (typeof rows)[number]) => boolean) => LEVELS.map((l) => ({ l, n: rows.filter((r) => r.s.level === l && pred(r)).length, total: rows.filter((r) => r.s.level === l).length }))
    return { recurring, noRw, few, supports: { recurring: by((r) => r.requiredWeeks >= 3), noRw: by((r) => !r.rwAny), few: by((r) => r.pastWeeksMean < 2) }, levels: { recurring: byLevel((r) => r.requiredWeeks >= 3), noRw: byLevel((r) => !r.rwAny), few: byLevel((r) => r.pastWeeksMean < 2) } }
  }, [snap])
  const List = ({ rows, detail }: { rows: typeof data.recurring; detail: (r: (typeof data.recurring)[number]) => string }) =>
    rows.length ? (
      <ul className="mt-2 flex flex-wrap gap-1 text-sm">
        {rows.map((r) => <li key={r.s.id} className="rounded-full border border-line px-2 py-0.5"><Link className="text-indigo underline dark:text-indigo-1" to={`/m/${r.s.mentor_id}/student/${r.s.id}`}>{r.s.display_name}</Link> <span className="text-ink-2">· {c.app.levels[r.s.level]} · {detail(r)}{r.s.supports.length ? ' · supports' : ''}</span></li>)}
      </ul>
    ) : <Empty>{c.app.none}</Empty>
  const Breakdown = ({ k }: { k: 'recurring' | 'noRw' | 'few' }) => (
    <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-6 text-sm">
      <Stat label={c.lead.withSupports} value={c.lead.share(data.supports[k].withSupports, data.supports[k].total.withSupports)} />
      <Stat label={c.lead.withoutSupports} value={c.lead.share(data.supports[k].withoutSupports, data.supports[k].total.withoutSupports)} />
      {data.levels[k].map((r) => <Stat key={r.l} label={c.app.levels[r.l]} value={c.lead.share(r.n, r.total)} />)}
    </div>
  )
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.equity} <Explain id="lead.equity" /></H1>
        <p className="text-sm text-ink-2">{c.lead.equityLede}</p>
      </div>
      <Card as="section" accent="border-t-indigo">
        <H2>{c.lead.recurringRequired} ({data.recurring.length})</H2>
        <List rows={data.recurring} detail={(r) => `${r.requiredWeeks} of 4 weeks`} />
        <Breakdown k="recurring" />
      </Card>
      <Card as="section" accent="border-t-brown">
        <H2>{c.lead.noRw} ({data.noRw.length})</H2>
        <List rows={data.noRw} detail={() => ''} />
        <Breakdown k="noRw" />
      </Card>
      <Card as="section" accent="border-t-teal">
        <H2>{c.lead.fewTouchpoints} ({data.few.length})</H2>
        <List rows={data.few} detail={(r) => `${r.pastWeeksMean.toFixed(1)} a week`} />
        <Breakdown k="few" />
      </Card>
    </div>
  )
}
