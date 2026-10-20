import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useSnapshot } from '@/app/hooks'
import { Card, Chip, H1, H2 } from '@/components/ui'
import { getGraph } from '@/graph'
import { daysBetween } from '@/lib/time'
import { needsYou } from '@/engine'

export function EvidenceLog() {
  const c = useCopy()
  const snap = useSnapshot()
  const graph = getGraph()
  const rows = useMemo(() => snap.gathering_log.filter((g) => g.source !== 'knowledge_graph').map((g) => {
    const list = snap.evidence.filter((e) => e.source === g.source)
    const latest = list.sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0]
    const week = list.filter((e) => e.recorded_at >= snap.meta.week_start).length
    const age = latest ? daysBetween(latest.recorded_at, snap.meta.today) : null
    return { g, total: list.length, week, age, stale: g.stale || age === null || age >= 7 }
  }), [snap])
  const refused = useMemo(() => needsYou(snap).filter((i) => i.kind === 'stale'), [snap])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.evidenceLog} <Explain id="lead.evidence" /></H1>
        <p className="text-sm text-ink-2">{c.lead.evidenceLede}</p>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-ink-2"><th className="font-bold">{c.lead.source}</th><th className="font-bold">{c.expert.received}</th><th className="font-bold">{c.lead.thisWeekRows}</th><th className="font-bold">{c.lead.refused}</th><th className="font-bold">{c.expert.stale}</th><th className="font-bold">Note</th></tr></thead>
          <tbody>
            {rows.map(({ g, week, age, stale }) => (
              <tr key={g.id} className="border-t border-line"><td className="py-1">{g.source}</td><td>{g.received}</td><td>{week}</td><td>{g.unmapped + g.refused}</td><td>{stale ? <Chip className="bg-tan-grey-2 text-tan-grey-ink">{age === null ? c.expert.stale : `${age} days`}</Chip> : <Chip className="bg-teal-2 text-teal-ink">{c.expert.fresh}</Chip>}</td><td className="text-ink-2">{g.message}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card as="section">
        <H2>{c.lead.graphLoaded}</H2>
        <p className="text-sm">{graph.source_label}. {graph.counts.nodes} nodes, {graph.counts.edges} edges. {Object.entries(graph.counts.by_type).map(([k, v]) => `${k} ${v}`).join(', ')}.</p>
      </Card>
      <Card as="section">
        <H2>{c.lead.refused} ({refused.length})</H2>
        <p className="text-sm text-ink-2">{c.expert.kinds.stale}: {refused.length} active lessons with evidence older than {snap.settings.stale_days} days produced no need. They sit in Needs You for the content expert.</p>
      </Card>
    </div>
  )
}
