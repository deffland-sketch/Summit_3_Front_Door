import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { gapsTo, getGraph, pathwaysNear } from '@/graph'
import { PATHWAYS } from '@/graph/authored/pathways'
import { cnsOutcomes } from '@/engine'
import { latestByOutcome } from '@/lib'
import { formatTime12 } from '@/lib/time'
import { futreAdapter } from '@/adapters/futre'
import { useUi } from '@/store/ui'
import { format, parseISO } from 'date-fns'

export function Pathway({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, plan, futre, evidence, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [reflectFor, setReflectFor] = useState<string | null>(null)
  const [text, setText] = useState('')
  const toast = useUi((u) => u.toast)
  const graph = getGraph()
  const validated = useMemo(() => {
    const set = new Set<string>()
    if (!student) return set
    for (const [oid, e] of latestByOutcome(evidence)) {
      const o = idx.outcomes.get(oid)
      if (!o || typeof e.value !== 'number') continue
      if (o.family === 'cognitive' && e.value >= (o.level_expectations?.[student.level] ?? 4)) set.add(oid)
      if (o.family === 'content' && e.value >= 85) set.add(oid)
    }
    for (const [oid] of latestByOutcome(evidence.filter((e) => e.value_kind === 'text' && e.outcome_id.startsWith('HOS.')))) set.add(oid)
    return set
  }, [evidence, idx, student])
  if (!student || !futre) return <Empty>{c.app.none}</Empty>
  const pathway = PATHWAYS.find((p) => p.id === futre.cns.pathway_id)
  const gaps = pathway ? gapsTo(graph, pathway.id, validated) : []
  const cns = cnsOutcomes(studentId, snap)
  const weekSlots = (plan?.slots ?? []).filter((s) => s.offering_id && s.status !== 'cancelled' && s.status !== 'moved')
  const linked = weekSlots.filter((s) => {
    const o = idx.offerings.get(s.offering_id!)
    if (!o) return false
    const served = new Set(o.outcomes_served)
    if (o.lesson_id) for (const x of idx.lessons.get(o.lesson_id)?.outcomes_served ?? []) served.add(x)
    return [...served].some((x) => cns.has(x)) || (pathway?.experiences.includes(o.source_ref) ?? false)
  })
  const gapServed = (gapId: string) => weekSlots.some((s) => idx.offerings.get(s.offering_id!)?.outcomes_served.includes(gapId))
  const near = pathwaysNear(graph, validated, futre.cns.target_careers.map((t) => t.career_id)).slice(0, 3)
  const rwDone = (plan?.slots ?? []).filter((s) => s.experience_type === 'RW' && s.status === 'attended')

  const send = (experienceId: string) => {
    futreAdapter.pushReflection(studentId, experienceId, text)
    setReflectFor(null)
    setText('')
    toast(c.pathway.sentToFutre)
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>{c.pathway.title}</H1>
        <p className="text-sm text-ink-2">{c.pathway.lede}</p>
      </div>
      <Card accent="border-t-indigo">
        <H2 id="vision">{c.pathway.vision}</H2>
        <p className="mt-1 text-lg">{futre.vision.vision_text}</p>
        <p className="mt-3 text-sm font-bold">{c.pathway.cns}</p>
        <p className="text-sm">
          {futre.cns.cns_type === 'undecided' ? c.pathway.noCns : `${c.pathway.cnsTypes[futre.cns.cns_type]} · ${futre.cns.cns_text}`}
        </p>
        {futre.cns.target_careers.length ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {futre.cns.target_careers.map((t) => (
              <li key={t.career_id} className="rounded-full bg-indigo-2 px-2 py-0.5 text-indigo dark:text-indigo-1">
                {t.title} · {c.pathway.fit(t.fit_score)}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <section aria-labelledby="week-links">
        <H2 id="week-links">{c.pathway.thisWeek}</H2>
        {linked.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {linked.map((s) => (
              <li key={s.id} className="rounded-lg border border-line p-2">
                <span className="font-bold">{dayName(s.day)}</span> · {formatTime12(s.start)} · {idx.offerings.get(s.offering_id!)?.title}
                <span className="block text-ink-2">{s.why}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{c.app.none}</Empty>
        )}
      </section>

      {pathway ? (
        <section aria-labelledby="gaps">
          <H2 id="gaps">{c.pathway.gaps}</H2>
          <p className="text-sm text-ink-2">{c.pathway.pathwayTitle(pathway.title)}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {gaps.map((g) => (
              <li key={g.node.id} className="flex items-center justify-between rounded-lg border border-line p-2">
                <span>{g.node.name}</span>
                {gapServed(g.node.id) ? <span className="rounded-full bg-teal-2 px-2 py-0.5 text-xs text-teal-ink">{c.pathway.gapServed}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="near">
          <H2 id="near">{c.pathway.nearby}</H2>
          <ul className="mt-2 space-y-1 text-sm">
            {near.map((n) => (
              <li key={n.pathway.id} className="rounded-lg border border-line p-2">
                <span className="font-bold">{n.pathway.name}</span> · {c.pathway.overlap(n.overlap, n.overlap + n.gaps)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="exp">
        <H2 id="exp">{c.pathway.experiences}</H2>
        <ul className="mt-2 space-y-2">
          {futre.experiences.map((x) => (
            <Card key={x.experience_id} as="li" accent="border-t-brown">
              <p className="font-bold">{x.title}</p>
              <p className="text-sm text-ink-2">
                {x.provider} · {c.app.levels[x.type]} · {format(parseISO(x.start), 'MMM d')} to {format(parseISO(x.end), 'MMM d')} · {x.status.replace('_', ' ')}
              </p>
              {x.reflection_text ? (
                <p className="mt-1 text-sm">
                  <span className="font-bold">{c.pathway.reflection}:</span> {x.reflection_text}
                </p>
              ) : reflectFor === x.experience_id ? (
                <div className="mt-2 space-y-2">
                  <textarea className={inputClass} rows={3} placeholder={c.pathway.reflectionPlaceholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={c.pathway.addReflection} />
                  <div className="flex gap-2">
                    <Button disabled={!text.trim()} onClick={() => send(x.experience_id)}>{c.app.save}</Button>
                    <Button kind="quiet" onClick={() => setReflectFor(null)}>{c.app.cancel}</Button>
                  </div>
                </div>
              ) : (
                <Button kind="secondary" className="mt-2" onClick={() => setReflectFor(x.experience_id)}>
                  {c.pathway.addReflection}
                </Button>
              )}
            </Card>
          ))}
          {rwDone.length && !futre.experiences.some((x) => !x.reflection_text) ? null : null}
        </ul>
      </section>

      <section aria-labelledby="careers">
        <H2 id="careers">{c.pathway.careers}</H2>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {futre.careers_explored.map((k) => (
            <li key={k.career_id} className="rounded-full border border-line px-2 py-0.5">
              {k.title} · {c.pathway.fit(k.fit_score)}
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <H2 id="portfolio">{c.pathway.portfolio}</H2>
        <p className="text-sm text-ink-2">{c.pathway.items(futre.portfolio.item_count)}</p>
        {futre.portfolio.latest_item ? (
          <p className="mt-1 text-sm">
            <span className="font-bold">{futre.portfolio.latest_item.title}</span> · {futre.portfolio.latest_item.reflection}
          </p>
        ) : null}
        <a className="mt-2 inline-block rounded-lg border border-indigo px-3 py-1.5 text-sm font-bold text-indigo dark:text-indigo-1" href={futre.portfolio.portfolio_url} target="_blank" rel="noreferrer">
          {c.pathway.openPortfolio}
        </a>
      </Card>
    </div>
  )
}
