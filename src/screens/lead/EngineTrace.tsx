import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { EngineTrace as Trace, TracePart } from '@/model'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Card, Chip, Empty, H1, H2, H3, inputClass } from '@/components/ui'
import { needs, proposeWorkshops, suggestLevelReview } from '@/engine'
import { getGraph } from '@/graph'
import { dayPart } from '@/lib/time'

/** The newest stored trace per ref (slot or move), plus every stored trace for a student. */
function latestByRef(traces: Trace[]): Map<string, Trace> {
  const out = new Map<string, Trace>()
  for (const t of traces) {
    const prev = out.get(t.ref_id)
    if (!prev || prev.at < t.at || (prev.at === t.at && prev.id < t.id)) out.set(t.ref_id, t)
  }
  return out
}

/** One trace, rendered the same way wherever it came from (Spec 6 Traceability). */
export function TraceBody({ trace, run, at }: { trace: TracePart; run?: string; at?: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const graph = getGraph()
  const name = (id: string) => graph.nodes.get(id)?.name ?? idx.outcomes.get(id)?.name ?? idx.lessons.get(id)?.title ?? idx.offerings.get(id)?.title ?? id
  const rows = trace.evidence_ids.map((id) => snap.evidence.find((e) => e.id === id)).filter((e) => e !== undefined)
  return (
    <div className="space-y-3 text-sm">
      <p><span className="font-bold">{c.lead.traceDecision}.</span> {trace.decision}</p>
      <div>
        <p className="font-bold">{c.lead.traceEvidence} ({rows.length})</p>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((e) => <li key={e.id} className="py-1">{idx.outcomes.get(e.outcome_id)?.name ?? e.outcome_id} · {e.source} · {dayPart(e.recorded_at)} · {typeof e.value === 'number' ? e.value : String(e.value).slice(0, 80)} <span className="text-xs text-ink-2">· {e.id}</span></li>)}
          </ul>
        ) : <p className="text-ink-2">{c.lead.traceNoEvidence}</p>}
      </div>
      <div>
        <p className="font-bold">{c.lead.traceSettings}</p>
        <ul className="flex flex-wrap gap-1">{Object.entries(trace.settings).map(([k, v]) => <li key={k}><Chip className="bg-tan-grey-2 text-tan-grey-ink">{k}: {String(v)}</Chip></li>)}</ul>
      </div>
      <div>
        <p className="font-bold">{c.lead.traceEdges} ({trace.edges.length})</p>
        {trace.edges.length ? <ul>{trace.edges.map((e, i) => <li key={i}>{name(e.from)} <span className="text-ink-2">→ {e.type} →</span> {name(e.to)} <span className="text-xs text-ink-2">· {e.source}</span></li>)}</ul> : <p className="text-ink-2">{c.lead.traceNoEdges}</p>}
      </div>
      <div>
        <p className="font-bold">{c.lead.traceCandidates} ({trace.candidates.length})</p>
        {trace.candidates.length ? (
          <ul className="divide-y divide-line">
            {trace.candidates.map((k, i) => <li key={`${k.id}_${i}`} className="py-1">{k.label}{k.score !== null ? <span className="text-ink-2"> · {Math.round(k.score * 100) / 100}</span> : null} · {k.lost_because ? <span className="text-tan-grey-ink">{c.lead.traceLost}: {k.lost_because}</span> : <span className="text-teal-ink">{c.lead.traceChosen}</span>}</li>)}
          </ul>
        ) : <p className="text-ink-2">{c.lead.traceNoCandidates}</p>}
      </div>
      {run ? <p className="text-xs text-ink-2">{c.lead.traceRun}: {run}{at ? ` · ${at.slice(0, 16).replace('T', ' ')}` : ''}</p> : null}
    </div>
  )
}

export function EngineTrace() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const [params, setParams] = useSearchParams()
  const slotParam = params.get('slot')
  const proposalParam = params.get('proposal')
  const slotPlan = slotParam ? snap.plans.find((p) => p.slots.some((s) => s.id === slotParam)) : undefined
  const studentId = params.get('student') ?? slotPlan?.student_id ?? ''
  const student = idx.students.get(studentId)
  const proposals = useMemo(() => proposeWorkshops(snap), [snap])
  const proposal = proposalParam ? proposals.find((p) => p.id === proposalParam) : undefined
  const stored = useMemo(() => latestByRef(snap.traces), [snap.traces])
  const studentNeeds = useMemo(() => (student ? needs(student.id, snap) : []), [student, snap])
  const plan = student ? snap.plans.find((p) => p.student_id === student.id && p.week_start === snap.meta.week_start) : undefined
  const moves = useMemo(() => snap.traces.filter((t) => t.kind === 'move' && t.subject_id === studentId).sort((a, b) => (a.at < b.at ? 1 : -1)), [snap.traces, studentId])
  const level = useMemo(() => (student ? suggestLevelReview(student.id, snap) : null), [student, snap])
  const set = (k: string, v: string) => {
    const next = new URLSearchParams()
    if (v) next.set(k, v)
    setParams(next)
  }
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.trace} <Explain id="lead.trace" /></H1>
        <p className="text-sm text-ink-2">{c.lead.traceLede}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="font-bold">{c.lead.traceStudent}</span>
          <select className={inputClass} value={studentId} onChange={(e) => set('student', e.target.value)}>
            <option value="">{c.app.none}</option>
            {snap.students.map((s) => <option key={s.id} value={s.id}>{s.display_name} · {c.app.levels[s.level]}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-bold">{c.lead.traceProposal}</span>
          <select className={inputClass} value={proposalParam ?? ''} onChange={(e) => set('proposal', e.target.value)}>
            <option value="">{c.app.none}</option>
            {proposals.map((p) => <option key={p.id} value={p.id}>{p.lesson_title} · {p.day} {p.start} · {p.student_ids.length}</option>)}
          </select>
        </label>
      </div>
      {proposal ? (
        <Card as="section" accent="border-t-indigo">
          <H2>{c.lead.traceProposal}: {proposal.lesson_title}</H2>
          <p className="text-sm text-ink-2">{proposal.day} {proposal.start} to {proposal.end} · {proposal.student_ids.map((sid) => idx.students.get(sid)?.display_name).join(', ')}</p>
          <p className="mb-3 text-sm">{proposal.why}</p>
          <TraceBody trace={proposal.trace} />
        </Card>
      ) : null}
      {student ? (
        <>
          <Card as="section">
            <H2>{c.lead.traceNeeds} ({studentNeeds.length})</H2>
            {studentNeeds.length ? (
              <ul className="mt-2 space-y-4">
                {studentNeeds.map((n) => (
                  <li key={`${n.kind}_${n.outcome_id}`} className="border-t border-line pt-3">
                    <H3>{n.outcome_name} <Chip className="bg-indigo-2 text-indigo">{n.kind.replace('_', ' ')}</Chip></H3>
                    <p className="mb-2 text-sm">{n.why}</p>
                    <TraceBody trace={n.trace} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-2">{c.lead.traceNone}</p>}
          </Card>
          <Card as="section">
            <H2>{c.lead.traceSlots}</H2>
            {plan ? (
              <ul className="mt-2 space-y-4">
                {plan.slots.filter((s) => s.status !== 'cancelled' && s.entry !== 'protected').map((s) => {
                  const t = stored.get(s.id)
                  const open = s.id === slotParam
                  return (
                    <li key={s.id} id={`slot-${s.id}`} className={`border-t border-line pt-3 ${open ? 'rounded-xl bg-orange-2/40 p-3 ring-2 ring-orange' : ''}`}>
                      <H3>{s.offering_id ? idx.offerings.get(s.offering_id)?.title ?? c.types[s.experience_type] : c.app.openSlot} <span className="text-sm font-normal text-ink-2">· {s.day} {s.start} · {c.types[s.experience_type]} · {s.entry.replace('_', ' ')}</span></H3>
                      <p className="mb-2 text-sm">{s.why}</p>
                      {open || t === undefined ? (t ? <TraceBody trace={t} run={t.run_id} at={t.at} /> : <p className="text-sm text-ink-2">{c.lead.traceNoStored}</p>) : (
                        <details>
                          <summary className="cursor-pointer text-sm text-indigo underline dark:text-indigo-1">{c.lead.whyThis}</summary>
                          <div className="mt-2"><TraceBody trace={t} run={t.run_id} at={t.at} /></div>
                        </details>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : <p className="text-sm text-ink-2">{c.lead.traceNone}</p>}
          </Card>
          <Card as="section">
            <H2>{c.lead.traceMoves} ({moves.length})</H2>
            {moves.length ? <ul className="mt-2 space-y-4">{moves.map((t) => <li key={t.id} className="border-t border-line pt-3"><TraceBody trace={t} run={t.run_id} at={t.at} /></li>)}</ul> : <p className="text-sm text-ink-2">{c.lead.traceNone}</p>}
          </Card>
          <Card as="section">
            <H2>{c.lead.traceLevel}</H2>
            {level ? (
              <div className="mt-2">
                <p className="mb-2 text-sm">{c.app.levels[level.from as keyof typeof c.app.levels]} → {c.app.levels[level.to as keyof typeof c.app.levels]}. {level.reasons.join(' ')}</p>
                <TraceBody trace={level.trace} />
              </div>
            ) : <p className="text-sm text-ink-2">{c.lead.traceNone}</p>}
          </Card>
        </>
      ) : !proposal ? <Empty>{c.lead.traceNone}</Empty> : null}
    </div>
  )
}
