import { expect, test } from '@playwright/test'
import { needs } from '../../src/engine'
import { gapsTo, getGraph, whatServes } from '../../src/graph'
import { latestByOutcome } from '../../src/lib'
import { currentPlan, sandbox } from './helpers'

test('19 whatServes and gapsTo return non-empty, sensible results for every Pursue student with a pathway', () => {
  const snap = sandbox()
  const graph = getGraph()
  const published = snap.offerings.filter((o) => o.status === 'published' && o.day >= snap.meta.week_start)
  let checked = 0
  for (const s of snap.students.filter((x) => x.level === 'pursue')) {
    const futre = snap.futre.find((f) => f.student_id === s.id)!
    if (!futre.cns.pathway_id) continue
    checked++
    const top = needs(s.id, snap).find((n) => n.kind === 'in_reach')
    if (top) {
      const served = whatServes(graph, top.outcome_id)
      const lessonIds = new Set(served.filter((w) => w.node.type === 'Lesson').map((w) => w.node.id))
      const templateIds = new Set(served.filter((w) => w.node.type === 'ExperienceTemplate').map((w) => w.node.id))
      const inMenu = published.some((o) => (o.lesson_id && lessonIds.has(o.lesson_id)) || templateIds.has(o.source_ref) || o.outcomes_served.includes(top.outcome_id))
      expect(served.length, `${s.id} ${top.outcome_id}`).toBeGreaterThan(0)
      expect(inMenu, `${s.id} menu for ${top.outcome_id}`).toBe(true)
    }
    const validated = new Set<string>()
    for (const [oid, e] of latestByOutcome(snap.evidence.filter((x) => x.student_id === s.id))) {
      const o = snap.outcomes.find((x) => x.id === oid)
      if (o?.family === 'cognitive' && typeof e.value === 'number' && e.value >= (o.level_expectations?.pursue ?? 5)) validated.add(oid)
      if (o?.family === 'content' && typeof e.value === 'number' && e.value >= 85) validated.add(oid)
    }
    const gaps = gapsTo(graph, futre.cns.pathway_id, validated)
    expect(gaps.length, s.id).toBeGreaterThan(0)
    // Served by an offering this week means somewhere on the published menu, not only the student's own plan.
    const servedGap = gaps.some((g) => published.some((o) => o.outcomes_served.includes(g.node.id) || (o.lesson_id && snap.lessons.find((l) => l.id === o.lesson_id)?.outcomes_served.includes(g.node.id))))
    expect(servedGap, `${s.id} gap served this week`).toBe(true)
    void currentPlan
  }
  expect(checked).toBeGreaterThan(5)
})
