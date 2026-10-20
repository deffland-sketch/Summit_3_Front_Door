import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Card, Chevron, Empty, H1, H2, H3 } from '@/components/ui'
import { OutcomeBand } from '@/components/OutcomeBand'
import { EvidenceList } from '@/components/EvidenceList'
import { needs } from '@/engine'
import { latestByOutcome } from '@/lib'
import { getGraph, whatUnlocks } from '@/graph'
import { COGNITIVE_DOMAINS } from '@/graph/authored/cognitive-skills'
import { format, parseISO } from 'date-fns'
import type { Evidence, Outcome } from '@/model'

const NEXT: Record<string, string | null> = { expose: 'explore', explore: 'pursue', pursue: 'launch', launch: null }

export function Progress({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, plan, evidence, assignments, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [open, setOpen] = useState<string | null>(null)
  const latest = useMemo(() => latestByOutcome(evidence), [evidence])
  const studentNeeds = useMemo(() => (student ? needs(student.id, snap) : []), [student, snap])
  const graph = getGraph()
  if (!student) return <Empty>{c.app.none}</Empty>
  const inReach = studentNeeds.filter((n) => n.kind === 'in_reach').slice(0, 3)
  const byOutcome = (oid: string): Evidence[] => evidence.filter((e) => e.outcome_id === oid)
  const bestScore = (oid: string): number | null => {
    const rows = byOutcome(oid).filter((e) => e.value_kind === 'score_1_8' && typeof e.value === 'number')
    return rows.length ? Math.max(...rows.map((e) => e.value as number)) : null
  }
  const levelName = c.app.levels[student.level]
  const nextLevel = NEXT[student.level]

  // Math standards by unit for the student's active math course.
  const mathAsg = assignments.filter((a) => a.lesson_id.startsWith('les_im'))
  const mathUnitIds = [...new Set(mathAsg.map((a) => idx.lessons.get(a.lesson_id)?.unit_id).filter(Boolean))] as string[]
  const unitStatus = (oid: string): 'mastered' | 'practicing' | 'notYet' => {
    const e = latest.get(oid)
    if (!e || typeof e.value !== 'number') return 'notYet'
    return e.value >= 85 ? 'mastered' : 'practicing'
  }

  const Detail = ({ o }: { o: Outcome }) => {
    const unlocks = whatUnlocks(graph, o.id).slice(0, 4)
    return (
      <div className="mt-2 space-y-2 border-t border-line pt-2">
        <H3>{c.progress.evidence}</H3>
        <EvidenceList rows={byOutcome(o.id)} adults={snap.adults} students={snap.students} />
        {unlocks.length ? (
          <p className="text-sm">
            <span className="font-bold">{c.progress.whatOpens}:</span> {unlocks.map((w) => w.node.name).join(', ')}
          </p>
        ) : null}
      </div>
    )
  }

  const Row = ({ o, children }: { o: Outcome; children: React.ReactNode }) => (
    <li className="rounded-xl border border-line p-3">
      <button type="button" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{o.name}</p>
          {children}
        </div>
        <span className="text-ink-2">
          <Chevron open={open === o.id} />
        </span>
      </button>
      {open === o.id ? <Detail o={o} /> : null}
    </li>
  )

  return (
    <div className="space-y-6">
      <div>
        <H1>{c.progress.title}</H1>
        <p className="text-sm text-ink-2">{c.progress.building}</p>
      </div>

      <section aria-labelledby="inreach">
        <H2 id="inreach">{c.progress.inReach}</H2>
        <p className="text-sm text-ink-2">{c.progress.inReachLede}</p>
        <ul className="mt-2 grid gap-3 md:grid-cols-3">
          {inReach.length ? (
            inReach.map((n) => {
              const o = idx.outcomes.get(n.outcome_id)!
              return (
                <Card key={n.outcome_id} as="li" accent="border-t-orange">
                  <p className="font-bold">{o.name}</p>
                  <p className="mt-1 text-sm">{n.why}</p>
                  {n.serves ? <p className="mt-1 text-xs text-ink-2">{n.serves}</p> : null}
                  <Button kind="quiet" className="mt-2" onClick={() => setOpen(open === o.id ? null : o.id)} ariaExpanded={open === o.id}>
                    {c.progress.evidence}
                  </Button>
                  {open === o.id ? <Detail o={o} /> : null}
                </Card>
              )
            })
          ) : (
            <Empty>{c.app.none}</Empty>
          )}
        </ul>
      </section>

      <section aria-labelledby="cog">
        <H2 id="cog">{c.progress.cognitive}</H2>
        <div className="mt-2 space-y-4">
          {COGNITIVE_DOMAINS.map((d) => {
            const skills = d.skills.map((s) => idx.outcomes.get(s.id)!).filter((o) => bestScore(o.id) !== null)
            if (!skills.length) return null
            return (
              <div key={d.id}>
                <H3 className="mb-2">{d.name}</H3>
                <ul className="space-y-2">
                  {skills.map((o) => (
                    <Row key={o.id} o={o}>
                      <OutcomeBand score={bestScore(o.id)} expected={o.level_expectations?.[student.level] ?? 4} next={nextLevel ? (o.level_expectations?.[nextLevel as 'explore'] ?? null) : null} levelName={levelName} nextName={nextLevel ? c.app.levels[nextLevel] : null} />
                    </Row>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="math">
        <H2 id="math">{c.progress.content}</H2>
        <div className="mt-2 space-y-4">
          {mathUnitIds.map((uid) => {
            const u = idx.units.get(uid)!
            return (
              <div key={uid}>
                <H3 className="mb-2">
                  {idx.courses.get(u.course_id)?.title} · {u.title}
                </H3>
                <ul className="space-y-2">
                  {u.outcomes_served.map((oid) => {
                    const o = idx.outcomes.get(oid)
                    if (!o) return null
                    const st = unitStatus(oid)
                    const e = latest.get(oid)
                    return (
                      <Row key={oid} o={o}>
                        <p className="text-sm">
                          <span className={`font-bold ${st === 'mastered' ? 'text-teal-ink' : st === 'practicing' ? 'text-orange-ink' : 'text-ink-2'}`}>{c.progress[st]}</span>
                          {e && typeof e.value === 'number' ? ` · ${c.progress.pct(Math.round(e.value))}` : ''}
                        </p>
                      </Row>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="habits">
        <H2 id="habits">{c.progress.habits}</H2>
        <p className="text-sm text-ink-2">{c.progress.focus}</p>
        <ul className="mt-2 space-y-2">
          {(plan?.focus_habits ?? []).map((hid) => {
            const o = idx.outcomes.get(hid)
            if (!o) return null
            const rows = byOutcome(hid).filter((e) => e.value_kind === 'text').sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
            return (
              <Card key={hid} as="li" accent="border-t-teal">
                <p className="font-bold">{o.name}</p>
                <p className="text-sm text-ink-2">{o.description}</p>
                <p className="mt-2 text-sm font-bold">{c.progress.timeline}</p>
                <ol className="mt-1 space-y-1 border-l-2 border-teal pl-3 text-sm">
                  {rows.map((e) => (
                    <li key={e.id}>
                      <span className="text-ink-2">{format(parseISO(e.recorded_at), 'MMM d')}:</span> {String(e.value)}
                    </li>
                  ))}
                </ol>
              </Card>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
