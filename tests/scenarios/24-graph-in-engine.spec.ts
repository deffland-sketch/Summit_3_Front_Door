import { expect, test } from '@playwright/test'
import { needs, newLedger, optionsForSlot, rankOptions, suggestLevelReview, validatedOutcomes } from '../../src/engine'
import { appStore } from '../../src/store'
import { chooseOffering } from '../../src/store/actions'
import { gapsTo, getGraph, shortestPath } from '../../src/graph'
import { currentPlan, fresh, sandbox } from './helpers'

test('24 the engine walks the graph: prerequisite-aware serving, pathway gaps in open-slot ranking, gaps on the Launch review, edges in every trace', () => {
  const snap = sandbox()
  const graph = getGraph()
  // needs(): a serving lesson whose prerequisite is still open loses, and the trace says so.
  let prereqLosses = 0
  let walked = 0
  for (const s of snap.students) {
    for (const n of needs(s.id, snap)) {
      if (n.trace.edges.length) walked++
      if (n.trace.candidates.some((k) => k.lost_because === 'its prerequisite is still open')) prereqLosses++
      // A chosen serving lesson never has an open prerequisite when a mastered alternative existed.
      const chosen = n.trace.candidates.find((k) => k.lost_because === null && snap.lessons.some((l) => l.id === k.id))
      if (chosen) {
        const lesson = snap.lessons.find((l) => l.id === chosen.id)!
        const open = lesson.prerequisites.filter((pid) => !snap.assignments.some((a) => a.student_id === s.id && a.lesson_id === pid && (a.status === 'mastered' || a.status === 'skipped_on_mastery')))
        const alternative = n.trace.candidates.some((k) => k.lost_because === 'another served it first' && !snap.lessons.find((l) => l.id === k.id)?.prerequisites.some((pid) => !snap.assignments.some((a) => a.student_id === s.id && a.lesson_id === pid && (a.status === 'mastered' || a.status === 'skipped_on_mastery'))))
        if (open.length && alternative) throw new Error(`${s.id} ${n.outcome_id} chose ${chosen.id} with an open prerequisite over a ready lesson`)
      }
    }
  }
  expect(walked, 'needs walked the graph').toBeGreaterThan(20)
  expect(prereqLosses, 'some serving lesson lost on an open prerequisite').toBeGreaterThan(0)

  // Ranker: for a student with a Futre pathway, an open real-world offering that teaches a gap scores the gap bonus, names the gap, and carries the edges.
  let gapHits = 0
  let nearHits = 0
  const ledger = newLedger(snap, snap.meta.week_start)
  for (const s of snap.students) {
    const futre = snap.futre.find((f) => f.student_id === s.id)!
    const plan = currentPlan(snap, s.id)
    const open = plan.slots.filter((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    for (const slot of open) {
      const opts = rankOptions(snap, { student: s, plan, needs: needs(s.id, snap), ledger, day: slot.day, start: '09:15', end: '15:00' }, 50)
      for (const r of opts) {
        if (r.reasons.includes('gap')) {
          gapHits++
          expect(r.gap).toBeTruthy()
          expect(r.builds[0]).toBe(r.gap)
          expect(r.edges.length).toBeGreaterThan(0)
          expect(r.edges.some((e) => e.type === 'teaches')).toBe(true)
          const gaps = gapsTo(graph, futre.cns.pathway_id!, validatedOutcomes(s.id, snap)).map((g) => g.node.name)
          expect(gaps).toContain(r.gap)
        }
        if (r.reasons.includes('near_pathway')) {
          nearHits++
          expect(r.pathway).toBeTruthy()
          expect(r.edges.length).toBeGreaterThan(0)
        }
      }
    }
  }
  expect(gapHits, 'an open real-world offering taught a pathway gap for someone').toBeGreaterThan(0)
  expect(nearHits, 'an open real-world offering sat on a nearby pathway for someone').toBeGreaterThan(0)

  // Level review: Pursue to Launch reads the Futre pathway; a flag lists what is still open.
  for (const s of snap.students.filter((x) => x.level === 'pursue')) {
    const r = suggestLevelReview(s.id, snap)
    if (!r) continue
    expect(r.trace.settings.pathway).toBe(snap.futre.find((f) => f.student_id === s.id)!.cns.pathway_id)
    if (Number(r.trace.settings.gaps_left) > 0) expect(r.reasons.join(' ')).toMatch(/Still open on the pathway/)
  }

  // shortestPath: a builds_toward chain between two math standards that the Learning Commons connects.
  const e = graph.edges.find((x) => x.type === 'builds_toward' && x.source === 'learning_commons')!
  const p = shortestPath(graph, e.from, e.to)!
  expect(p.via).toHaveLength(1)
  expect(shortestPath(graph, e.to, e.from) === null || shortestPath(graph, e.to, e.from)!.via.length > 0).toBe(true)
})

test('24b a student who picks an open experience that teaches a pathway gap gets a why that names the gap and a trace with the edge', () => {
  const snap = fresh()
  appStore.getState().load(snap)
  const ledger = newLedger(snap, snap.meta.week_start)
  for (const s of snap.students) {
    const plan = currentPlan(snap, s.id)
    for (const slot of plan.slots.filter((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)) {
      const hit = optionsForSlot(plan, slot, s, snap, ledger).find((r) => r.reasons.includes('gap') && !r.reasons.includes('collides'))
      if (!hit) continue
      chooseOffering(plan.id, slot.id, hit.offering)
      const after = appStore.getState()
      const chosen = after.plans.find((p) => p.id === plan.id)!.slots.find((x) => x.id === slot.id)!
      expect(chosen.offering_id).toBe(hit.offering.id)
      expect(chosen.why).toMatch(/You chose this\. .* teaches .*, still open on your .* pathway\./)
      expect(chosen.why).toContain(hit.gap!)
      const trace = after.traces.find((t) => t.ref_id === slot.id && t.run_id === 'pick')!
      expect(trace.edges.some((e) => e.type === 'teaches')).toBe(true)
      return
    }
  }
  throw new Error('no student could pick a gap-teaching experience')
})

test('24c the lead opens the graph from Outcomes and the path finder shows a builds_toward chain', async ({ page }) => {
  await page.goto('/l/outcomes')
  await page.getByRole('link', { name: 'Open the knowledge graph' }).click()
  await expect(page.getByRole('heading', { name: 'Path finder' })).toBeVisible()
  await page.getByLabel('From', { exact: true }).selectOption({ label: 'Argumentative claim' })
  await page.getByLabel('To', { exact: true }).selectOption({ label: 'Counterclaims' })
  await expect(page.getByTestId('path-result')).toContainText(/hop/)
  await expect(page.getByTestId('path-result')).toContainText('builds toward')
})
