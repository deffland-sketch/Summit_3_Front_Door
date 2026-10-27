import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Button, Card, Chip, H1, H2 } from '@/components/ui'
import { hubLoad, needs, proposeWorkshops, newLedger } from '@/engine'
import { BLOCKS } from '@/engine/types'
import { runWeeklyBuild } from '@/store/actions'
import { useUi } from '@/store/ui'
import { minutesBetween, weekDates } from '@/lib/time'
import { format, parseISO } from 'date-fns'
import { dayName } from '@/components/WeekGrid'

export function WeeklyBuild({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const toast = useUi((u) => u.toast)
  const lastBuildAt = useUi((u) => u.lastBuildAt)
  const lastBuildCount = useUi((u) => u.lastBuildCount)
  const decisions = useUi((u) => u.decisions)
  const read = useMemo(() => {
    const all = snap.students.map((s) => needs(s.id, snap))
    const required = all.filter((n) => n.some((x) => x.kind === 'required')).length
    const inReach = all.reduce((a, n) => a + n.filter((x) => x.kind === 'in_reach').length, 0)
    const ready = all.filter((n) => n.some((x) => x.kind === 'readiness')).length
    const proposals = proposeWorkshops(snap)
    const shared = proposals.filter((p) => p.kind === 'workshop').length
    const current = snap.plans.filter((p) => p.week_start === snap.meta.week_start)
    const protectedMin = current.flatMap((p) => p.slots).filter((s) => s.entry === 'protected').reduce((m, s) => m + minutesBetween(s.start, s.end), 0)
    const requiredMin = current.flatMap((p) => p.slots).filter((s) => s.entry === 'required').reduce((m, s) => m + minutesBetween(s.start, s.end), 0)
    const ledger = newLedger(snap)
    const blocks = hubLoad(snap)
    const hub = weekDates(snap.meta.week_start).map((d) => ({ day: d, blocks: blocks.filter((h) => h.day === d) }))
    const partners = snap.offerings.filter((o) => o.experience_type === 'RW' && o.day >= snap.meta.week_start && o.status === 'published').map((o) => ({ o, fill: ledger.fill.get(o.id) ?? 0 }))
    const published = current.filter((p) => p.published_at).length
    return { required, inReach, ready, shared, proposals, protectedMin, requiredMin, hub, partners, published, drafts: current.length - published }
  }, [snap])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.build} <Explain id="expert.build" /></H1>
        <p className="text-sm text-ink-2">{c.expert.buildLede}</p>
      </div>
      <Card accent="border-t-tan-grey">
        <H2>{c.expert.gather}</H2>
        <p className="text-sm text-ink-2">{c.expert.gatheringLog}</p>
        <table className="mt-2 w-full text-sm">
          <thead><tr className="text-left text-ink-2"><th className="font-bold">Source</th><th className="font-bold">{c.expert.received}</th><th className="font-bold">{c.expert.unmapped}</th><th className="font-bold">{c.expert.refused}</th><th className="font-bold">{c.expert.stale}</th></tr></thead>
          <tbody>
            {snap.gathering_log.map((g) => (
              <tr key={g.id} className="border-t border-line"><td className="py-1">{g.source}</td><td>{g.received}</td><td>{g.unmapped}</td><td>{g.refused}</td><td>{g.stale ? <Chip className="bg-tan-grey-2 text-tan-grey-ink">{c.expert.stale}</Chip> : <Chip className="bg-teal-2 text-teal-ink">{c.expert.fresh}</Chip>}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card accent="border-t-light-blue">
        <H2>{c.expert.read}</H2>
        <p className="mt-1 text-sm">{c.expert.readLine(read.required, read.shared, read.inReach, read.ready)}</p>
        <p className="text-sm">{c.expert.protectedVsRequired(read.protectedMin, read.requiredMin)}</p>
      </Card>
      <Card accent="border-t-indigo">
        <H2>{c.expert.propose}</H2>
        <p className="mt-1 text-sm">{c.expert.proposalsWaiting(read.proposals.filter((p) => p.kind === 'workshop' && !decisions[p.id]).length)}.</p>
        <ul className="mt-1 text-sm text-ink-2">
          {read.proposals.slice(0, 8).map((p) => <li key={p.id}>{p.lesson_title} · {p.student_ids.length} · {dayName(p.day)} {p.start} · {p.kind}</li>)}
        </ul>
      </Card>
      <Card accent="border-t-teal">
        <H2>{c.expert.buildStep}</H2>
        <p className="mt-1 text-sm">{lastBuildAt ? c.expert.built(lastBuildCount, format(parseISO(lastBuildAt), 'h:mm a')) : c.expert.notRun}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={() => { const n = runWeeklyBuild(false); toast(c.expert.built(n, 'now')) }}>{lastBuildAt ? c.expert.rebuild : c.expert.runBuild}</Button>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold">{c.expert.hubLoad}</p>
            <p className="text-xs text-ink-2">{c.expert.hubLoadHint}</p>
            <table className="mt-1 w-full text-xs" aria-label={c.expert.hubLoad}>
              <thead><tr><th></th>{BLOCKS.map((b) => <th key={b.start} className="font-bold">{b.start}</th>)}</tr></thead>
              <tbody>
                {read.hub.map((h) => (
                  <tr key={h.day}><td className="font-bold">{dayName(h.day).slice(0, 3)}</td>{h.blocks.map((b) => <td key={b.start} data-adults={b.adults} data-short={b.adults_short ? 'true' : 'false'} title={b.adults_short ? c.expert.hubAdultsShort(b.adults, b.adults_required) : b.over_capacity ? c.expert.hubOver(b.placed, b.capacity) : `${b.adults} ${c.expert.adultsInHub}`} className={`text-center ${b.over_capacity || b.adults_short ? 'text-red-ink font-bold' : ''}`}>{b.placed}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-sm font-bold">{c.expert.partnerFill}</p>
            <ul className="mt-1 max-h-48 overflow-y-auto text-xs">
              {read.partners.map(({ o, fill }) => <li key={o.id} className={fill < o.capacity_min ? 'text-orange-ink' : ''}>{dayName(o.day).slice(0, 3)} {o.start} {o.title}: {fill} / {o.capacity_max}</li>)}
            </ul>
          </div>
        </div>
      </Card>
      <Card accent="border-t-orange">
        <H2>{c.expert.publishStep}</H2>
        <p className="mt-1 text-sm">{read.drafts ? `${read.drafts} drafts, ${read.published} published.` : c.expert.neverPublished}</p>
        <Button className="mt-2" kind="secondary" onClick={() => { const n = runWeeklyBuild(true); toast(c.expert.published(n)) }}>{c.expert.publishWeek}</Button>
        <p className="mt-1 text-xs text-ink-2">{idx.adults.get(adultId)?.display_name}</p>
      </Card>
    </div>
  )
}
