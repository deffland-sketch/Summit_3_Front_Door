import { useMemo } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Chip, Empty, H1, H2, Stat } from '@/components/ui'
import { TYPE_STYLE, TYPE_ORDER } from '@/components/types'
import { alerts } from '@/engine'
import { useUi } from '@/store/ui'
import { repos } from '@/store'
import { toMin } from '@/lib/time'
import { currentPlans } from './shared'

const NOW = '10:30'

export function Dashboard() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const requests = useUi((u) => u.requests)
  const toast = useUi((u) => u.toast)
  const data = useMemo(() => {
    const plans = currentPlans(snap)
    const now = toMin(NOW)
    const byType: Record<string, number> = {}
    for (const p of plans) {
      const s = p.slots.find((x) => x.day === today && toMin(x.start) <= now && toMin(x.end) > now && x.status !== 'cancelled' && x.status !== 'moved')
      const t = s ? (s.entry === 'protected' ? 'Protected' : s.experience_type) : 'Open'
      byType[t] = (byType[t] ?? 0) + 1
    }
    const byCap: Record<string, number> = {}
    for (const a of snap.adults) for (const k of a.capacities) byCap[k] = (byCap[k] ?? 0) + 1
    return { byType, byCap, alerts: alerts(snap) }
  }, [snap, today])
  const groups = requests.filter((r) => r.kind === 'study_group')
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.dashboard}</H1>
        <p className="text-sm text-ink-2">{c.lead.dashboardLede}</p>
      </div>
      <section aria-labelledby="now">
        <H2 id="now">{c.lead.studentsNow}</H2>
        <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
          {[...TYPE_ORDER, 'Protected', 'Open'].map((t) => (
            <li key={t} className={`rounded-xl border border-line p-3 ${t in TYPE_STYLE ? `border-l-4 ${TYPE_STYLE[t as 'DI'].edge}` : 'bg-tan-grey-2'}`}>
              <p className="text-2xl font-bold text-heading-2">{data.byType[t] ?? 0}</p>
              <p className="text-xs">{t in c.types ? c.types[t] : t === 'Protected' ? c.app.protectedTime : c.app.openSlot}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="adults">
        <H2 id="adults">{c.lead.adultsByCapacity}</H2>
        <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-7">
          {Object.entries(data.byCap).map(([k, n]) => <li key={k}><Stat label={k.replace('_', ' ')} value={n} /></li>)}
        </ul>
      </section>
      <section aria-labelledby="alerts">
        <H2 id="alerts">{c.lead.alerts} ({data.alerts.length})</H2>
        {data.alerts.length ? (
          <Card className="mt-2">
            <ul className="divide-y divide-line text-sm">
              {data.alerts.map((a, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <Chip className={a.severity === 'high' ? 'bg-red-2 text-red-ink' : a.severity === 'medium' ? 'bg-orange-2 text-orange-ink' : 'bg-tan-grey-2 text-tan-grey-ink'}>{c.lead.severity[a.severity]}</Chip>
                    <span className="font-bold">{c.lead.alertKinds[a.kind]}</span> · {a.subject_name} <span className="text-ink-2">· {a.detail}</span>
                  </span>
                  <Link to={a.to} className="text-indigo underline dark:text-indigo-1">{c.lead.fix}</Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : <Empty>{c.lead.noAlerts}</Empty>}
      </section>
      <section aria-labelledby="groups">
        <H2 id="groups">{c.lead.studyGroups}</H2>
        {groups.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {groups.map((g, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-line p-2">
                <span><span className="font-bold">{idx.students.get(g.student_id)?.display_name}</span> · {g.text}</span>
                <Button kind="secondary" onClick={() => { repos.collection('groups').upsert({ id: `grp_study_${i}_${Date.now()}`, kind: 'study_group', name: g.text.slice(0, 40), student_ids: [g.student_id], adult_ids: [], approved_by: 'adu_director' }); toast(c.expert.done) }}>{c.lead.approve}</Button>
              </li>
            ))}
          </ul>
        ) : <Empty>{c.app.none}</Empty>}
      </section>
    </div>
  )
}
