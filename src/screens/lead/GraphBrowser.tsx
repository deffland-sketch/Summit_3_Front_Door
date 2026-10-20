import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { Card, H1, H2, inputClass } from '@/components/ui'
import { getGraph, neighborhood, type GraphNode } from '@/graph'

export function GraphBrowser() {
  const c = useCopy()
  const graph = getGraph()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [id, setId] = useState<string>('CS.WRI.CLAIM')
  const matches = useMemo(() => {
    const list: GraphNode[] = []
    for (const n of graph.nodes.values()) if ((!type || n.type === type) && (!q || n.name.toLowerCase().includes(q.toLowerCase()) || n.id.toLowerCase().includes(q.toLowerCase()))) list.push(n)
    return list.slice(0, 60)
  }, [graph, q, type])
  const hood = neighborhood(graph, id)
  return (
    <div className="space-y-4">
      <div>
        <H1>{c.lead.graph} <Explain id="lead.graph" /></H1>
        <p className="text-sm text-ink-2">{c.lead.graphLede} {graph.source_label}.</p>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs" aria-label={c.lead.nodeTypes}>
        {Object.entries(graph.counts.by_type).map(([t, n]) => <li key={t}><button type="button" aria-pressed={type === t} onClick={() => setType(type === t ? '' : t)} className={`rounded-full px-2 py-0.5 font-bold ${type === t ? 'bg-indigo text-white' : 'border border-line'}`}>{t} {n}</button></li>)}
        {Object.entries(graph.counts.by_edge).map(([t, n]) => <li key={t} className="rounded-full bg-tan-grey-2 px-2 py-0.5">{t} {n}</li>)}
      </ul>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div>
          <input aria-label={c.lead.search} placeholder={c.lead.search} className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="mt-2 max-h-[32rem] divide-y divide-line overflow-y-auto text-sm">
            {matches.map((n) => <li key={n.id}><button type="button" onClick={() => setId(n.id)} className={`w-full py-1.5 text-left ${id === n.id ? 'font-bold text-indigo dark:text-indigo-1' : ''}`}>{n.name} <span className="text-xs text-ink-2">· {n.type}</span></button></li>)}
          </ul>
        </div>
        {hood ? (
          <Card>
            <H2>{hood.node.name}</H2>
            <p className="text-sm text-ink-2">{hood.node.id} · {hood.node.type}{hood.node.meta ? ` · ${Object.entries(hood.node.meta).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}` : ''}</p>
            <p className="mt-3 text-sm font-bold">{c.lead.edgesOut} ({hood.out.length})</p>
            <ul className="text-sm">{hood.out.map((e, i) => <li key={i}><span className="text-ink-2">{e.type} →</span> <button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.to)}>{graph.nodes.get(e.to)?.name}</button> <span className="text-xs text-ink-2">· {e.source} · {e.confidence}</span></li>)}</ul>
            <p className="mt-3 text-sm font-bold">{c.lead.edgesIn} ({hood.in.length})</p>
            <ul className="max-h-72 overflow-y-auto text-sm">{hood.in.map((e, i) => <li key={i}><button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.from)}>{graph.nodes.get(e.from)?.name}</button> <span className="text-ink-2">→ {e.type}</span> <span className="text-xs text-ink-2">· {e.source} · {e.confidence}</span></li>)}</ul>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
