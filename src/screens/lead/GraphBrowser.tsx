import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { Card, H1, H2, inputClass } from '@/components/ui'
import { getGraph, neighborhood, shortestPath, type GraphEdge, type GraphNode } from '@/graph'
import { LC_MATH } from '@/graph/catalog'

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
  /** The source label on an edge: the Learning Commons export version for its edges, the source name for the rest. */
  const sourceOf = (e: GraphEdge) => (e.source === 'learning_commons' ? `learning_commons ${LC_MATH.version}` : e.source)
  const [from, setFrom] = useState('CS.WRI.CLAIM')
  const [to, setTo] = useState('CS.WRI.COUNTER')
  const outcomes = useMemo(() => [...graph.nodes.values()].filter((n) => n.type === 'CognitiveSkill' || n.type === 'MathStandard' || n.type === 'Habit').sort((a, b) => a.name.localeCompare(b.name)), [graph])
  const path = useMemo(() => shortestPath(graph, from, to), [graph, from, to])
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
            <ul className="text-sm">{hood.out.map((e, i) => <li key={i}><span className="text-ink-2">{e.type} →</span> <button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.to)}>{graph.nodes.get(e.to)?.name}</button> <span className="text-xs text-ink-2">· {sourceOf(e)} · {e.confidence}</span></li>)}</ul>
            <p className="mt-3 text-sm font-bold">{c.lead.edgesIn} ({hood.in.length})</p>
            <ul className="max-h-72 overflow-y-auto text-sm">{hood.in.map((e, i) => <li key={i}><button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.from)}>{graph.nodes.get(e.from)?.name}</button> <span className="text-ink-2">→ {e.type}</span> <span className="text-xs text-ink-2">· {sourceOf(e)} · {e.confidence}</span></li>)}</ul>
          </Card>
        ) : null}
      </div>
      <Card as="section">
        <H2>{c.lead.pathFinder}</H2>
        <p className="text-sm text-ink-2">{c.lead.pathLede}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <label className="text-sm"><span className="font-bold">{c.lead.pathFrom}</span><select aria-label={c.lead.pathFrom} className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)}>{outcomes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select></label>
          <label className="text-sm"><span className="font-bold">{c.lead.pathTo}</span><select aria-label={c.lead.pathTo} className={inputClass} value={to} onChange={(e) => setTo(e.target.value)}>{outcomes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select></label>
        </div>
        <div className="mt-3 text-sm" aria-live="polite" data-testid="path-result">
          {path ? (
            <p>{c.lead.pathHops(path.via.length)}: {path.via.length ? path.via.map((e, i) => <span key={i}>{i === 0 ? <button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.from)}>{graph.nodes.get(e.from)?.name}</button> : null} <span className="text-ink-2">→ builds toward →</span> <button type="button" className="text-indigo underline dark:text-indigo-1" onClick={() => setId(e.to)}>{graph.nodes.get(e.to)?.name}</button></span>) : graph.nodes.get(from)?.name}</p>
          ) : <p className="text-ink-2">{c.lead.pathNone}</p>}
        </div>
      </Card>
    </div>
  )
}
