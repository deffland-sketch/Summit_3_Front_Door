import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Card, H1, H2, LinkButton, Stat } from '@/components/ui'
import { COGNITIVE_DOMAINS } from '@/graph/authored/cognitive-skills'
import { HABIT_BLOCKS } from '@/graph/authored/habits'
import { latestByOutcome } from '@/lib'
import { shiftDate } from '@/lib/time'
import { LEVELS } from '@/model'

export function Outcomes() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const data = useMemo(() => {
    const termStart = shiftDate(snap.meta.week_start, -56)
    const perStudent = snap.students.map((s) => {
      const mine = snap.evidence.filter((e) => e.student_id === s.id)
      return { s, latest: latestByOutcome(mine), beforeWeek: latestByOutcome(mine, `${shiftDate(snap.meta.week_start, -1)}T23:59`), beforeTerm: latestByOutcome(mine, `${termStart}T00:00`), mine }
    })
    const domainRows = COGNITIVE_DOMAINS.map((d) => {
      let at = 0, n = 0, sum = 0, movedWeek = 0, movedTerm = 0
      for (const { s, latest, beforeWeek, beforeTerm } of perStudent) {
        for (const sk of d.skills) {
          const e = latest.get(sk.id)
          if (!e || typeof e.value !== 'number' || e.value_kind !== 'score_1_8') continue
          n++
          sum += e.value
          const exp = idx.outcomes.get(sk.id)?.level_expectations?.[s.level] ?? 4
          if (e.value >= exp) at++
          const bw = beforeWeek.get(sk.id)
          if (bw && typeof bw.value === 'number' && e.value > bw.value && e.recorded_at >= snap.meta.week_start) movedWeek++
          const bt = beforeTerm.get(sk.id)
          if (bt && typeof bt.value === 'number' && e.value > bt.value) movedTerm++
        }
      }
      return { d, at, n, mean: n ? sum / n : 0, movedWeek, movedTerm }
    })
    const unitRows = snap.units.filter((u) => u.course_id.startsWith('crs_im')).map((u) => {
      let mastered = 0, practicing = 0, notYet = 0
      for (const { latest } of perStudent) for (const oid of u.outcomes_served) {
        const e = latest.get(oid)
        if (!e || typeof e.value !== 'number') notYet++
        else if (e.value >= 85) mastered++
        else practicing++
      }
      return { u, mastered, practicing, notYet }
    }).filter((r) => r.mastered + r.practicing > 0)
    const habitRows = HABIT_BLOCKS.map((b) => ({ b, reflections: snap.evidence.filter((e) => e.value_kind === 'text' && b.habits.some((h) => h.id === e.outcome_id)).length, focus: snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.focus_habits.some((h) => b.habits.some((x) => x.id === h))).length }))
    const byLevel = LEVELS.map((l) => ({ l, n: snap.students.filter((s) => s.level === l).length }))
    return { domainRows, unitRows, habitRows, byLevel, movedWeek: domainRows.reduce((a, r) => a + r.movedWeek, 0), movedTerm: domainRows.reduce((a, r) => a + r.movedTerm, 0) }
  }, [snap, idx])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.outcomes} <Explain id="lead.outcomes" /></H1>
        <p className="text-sm text-ink-2">{c.lead.outcomesLede}</p>
        <div className="mt-2"><LinkButton to="/l/graph">{c.lead.openGraph}</LinkButton></div>
      </div>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {data.byLevel.map((r) => <li key={r.l}><Stat label={c.app.levels[r.l]} value={r.n} /></li>)}
        <li><Stat label={c.lead.movedThisWeek} value={data.movedWeek} /></li>
        <li><Stat label={c.lead.movedThisTerm} value={data.movedTerm} /></li>
      </ul>
      <section aria-labelledby="dom">
        <H2 id="dom">{c.lead.byDomain}</H2>
        <Card className="mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink-2"><th className="font-bold">Domain</th><th className="font-bold">{c.lead.atOrAbove}</th><th className="font-bold">{c.lead.meanScore}</th><th className="font-bold">{c.lead.movedThisWeek}</th><th className="font-bold">{c.lead.movedThisTerm}</th></tr></thead>
            <tbody>
              {data.domainRows.map((r) => (
                <tr key={r.d.id} className="border-t border-line"><td className="py-1">{r.d.name}</td><td>{c.lead.share(r.at, r.n)}</td><td>{r.mean.toFixed(1)}</td><td>{r.movedWeek}</td><td>{r.movedTerm}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <section aria-labelledby="units">
        <H2 id="units">{c.lead.byUnit}</H2>
        <Card className="mt-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-ink-2"><th className="font-bold">Unit</th><th className="font-bold">{c.progress.mastered}</th><th className="font-bold">{c.progress.practicing}</th><th className="font-bold">{c.progress.notYet}</th></tr></thead>
            <tbody>
              {data.unitRows.map((r) => (
                <tr key={r.u.id} className="border-t border-line"><td className="py-1">{idx.courses.get(r.u.course_id)?.title} · {r.u.title}</td><td>{r.mastered}</td><td>{r.practicing}</td><td>{r.notYet}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <section aria-labelledby="hab">
        <H2 id="hab">{c.lead.habitsBlock}</H2>
        <ul className="mt-2 grid gap-2 md:grid-cols-5">
          {data.habitRows.map((r) => <li key={r.b.id}><Stat label={r.b.name} value={r.reflections} sub={`${r.focus} students focus here`} /></li>)}
        </ul>
      </section>
    </div>
  )
}
