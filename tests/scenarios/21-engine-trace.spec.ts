import { expect, test } from '@playwright/test'
import { adjustOvernight, needs, proposeWorkshops, suggestLevelReview } from '../../src/engine'
import { currentPlan, fresh, openSandboxControls, sandbox } from './helpers'

test('21 every engine output carries a trace: evidence read, settings applied, edges walked, candidates and why each lost', () => {
  const snap = sandbox()
  const byRef = new Map(snap.traces.map((t) => [t.ref_id, t]))
  const evidence = new Set(snap.evidence.map((e) => e.id))
  // Every live slot of the current week has a stored trace with a decision; every Required slot traces to a real evidence row of that student.
  let slots = 0
  let required = 0
  for (const p of snap.plans.filter((x) => x.week_start === snap.meta.week_start)) {
    for (const s of p.slots.filter((x) => x.status !== 'cancelled')) {
      slots++
      const t = byRef.get(s.id)
      expect(t, `${s.id} has a stored trace`).toBeDefined()
      expect(t!.decision.length, `${s.id} decision`).toBeGreaterThan(10)
      expect(t!.subject_id).toBe(p.student_id)
      if (s.entry === 'required') {
        required++
        expect(t!.evidence_ids.length, `${s.id} evidence`).toBeGreaterThan(0)
        for (const id of t!.evidence_ids) {
          expect(evidence.has(id), `${id} exists`).toBe(true)
          expect(snap.evidence.find((e) => e.id === id)!.student_id).toBe(p.student_id)
        }
        expect(t!.settings.mastery_below_pct).toBe(snap.settings.required_rule.mastery_below_pct)
      }
    }
  }
  expect(slots).toBeGreaterThan(3000)
  expect(required).toBeGreaterThan(20)
  // Needs recompute their trace on demand: evidence ids, the thresholds that mattered, and candidates with a reason for each loser.
  let edges = 0
  let needCount = 0
  for (const s of snap.students) {
    for (const n of needs(s.id, snap)) {
      needCount++
      expect(n.trace.evidence_ids.length, `${s.id} ${n.outcome_id} evidence`).toBeGreaterThan(0)
      expect(n.trace.decision.length).toBeGreaterThan(10)
      if (n.kind === 'required') expect(n.trace.settings.mastery_below_pct).toBe(snap.settings.required_rule.mastery_below_pct)
      if (n.kind === 'recommended') expect(n.trace.settings.within_points).toBe(snap.settings.recommended_rule.within_points)
      for (const k of n.trace.candidates) expect(k.lost_because === null || k.lost_because.length > 3, `${n.outcome_id} candidate ${k.id}`).toBe(true)
      edges += n.trace.edges.length
    }
  }
  expect(needCount).toBeGreaterThan(50)
  expect(edges, 'some need walked the graph').toBeGreaterThan(0)
  // Proposals name the evidence behind every grouped student and the times they weighed.
  const proposals = proposeWorkshops(snap)
  expect(proposals.length).toBeGreaterThan(3)
  for (const p of proposals) {
    expect(p.trace.evidence_ids.length, p.id).toBeGreaterThanOrEqual(p.student_ids.length)
    expect(p.trace.settings.grouping_threshold).toBe(snap.settings.grouping_threshold)
    expect(p.trace.candidates.length, `${p.id} considered times`).toBeGreaterThan(0)
    expect(p.trace.candidates.some((k) => k.lost_because === null), `${p.id} names its pick`).toBe(true)
  }
  // Level review flags carry their evidence too.
  const reviews = snap.students.map((s) => suggestLevelReview(s.id, snap)).filter((r) => r !== null)
  expect(reviews.length).toBeGreaterThan(0)
  for (const r of reviews) expect(r.trace.evidence_ids.length, r.student_id).toBeGreaterThan(0)
})

test('21b an overnight move traces to the evidence row that caused it and the move limit', () => {
  const snap = fresh()
  const student = snap.students.find((s) => {
    const plan = currentPlan(snap, s.id)
    const hasOpen = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    return hasOpen && !needs(s.id, snap).some((x) => x.kind === 'required' || x.kind === 'recommended') && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  const asg = snap.assignments.find((a) => a.student_id === student.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))!
  const lesson = snap.lessons.find((l) => l.id === asg.lesson_id)!
  snap.evidence.push({ id: 'ev_s21', student_id: student.id, outcome_id: lesson.outcomes_served[0], source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: 41, artifact_url: null, recorded_by: 'system', recorded_at: `${snap.meta.today}T20:00:00.000Z`, slot_id: null })
  const { moves } = adjustOvernight(snap, { since: `${snap.meta.today}T12:00:00.000Z` })
  expect(moves).toHaveLength(1)
  expect(moves[0].trace.evidence_ids).toContain('ev_s21')
  expect(moves[0].trace.settings.max_overnight_moves).toBe(snap.settings.max_overnight_moves)
  expect(moves[0].trace.decision.length).toBeGreaterThan(10)
})

test('21c the lead opens the trace from a Required slot and an engine run leaves a log line', async ({ page }) => {
  const snap = sandbox()
  const plan = snap.plans.find((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.entry === 'required' && s.status !== 'cancelled'))!
  const slot = plan.slots.find((s) => s.entry === 'required' && s.status !== 'cancelled')!
  const trace = snap.traces.find((t) => t.ref_id === slot.id)!
  const row = snap.evidence.find((e) => e.id === trace.evidence_ids[0])!
  // The student's Today carries the link.
  await page.goto(`/s/${plan.student_id}`)
  await expect(page.getByRole('link', { name: 'Why this' }).first()).toBeVisible()
  // The lead's trace screen shows the slot's evidence row, the settings, and the decision.
  await page.goto(`/l/trace?slot=${slot.id}`)
  await expect(page.getByRole('heading', { name: /Engine Trace/ })).toBeVisible()
  const open = page.locator(`#slot-${slot.id}`)
  await expect(open).toContainText('Decision.')
  await expect(open).toContainText(row.source)
  await expect(open).toContainText(`mastery_below_pct: ${snap.settings.required_rule.mastery_below_pct}`)
  // A proposal has a link too, and the trace screen opens it.
  await page.goto('/x/adu_math/proposed')
  const link = page.getByRole('link', { name: 'Why this' }).first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page.getByRole('heading', { name: /^Proposal:/ })).toBeVisible()
  await expect(page.getByText('Candidates considered')).toBeVisible()
  // Every engine run appends a gathering log line with what it read, wrote, and how long it took.
  await page.goto('/l/evidence')
  await expect(page.getByText(/No engine run yet/)).toBeVisible()
  await openSandboxControls(page)
  await page.getByRole('button', { name: 'Run adjustOvernight' }).click()
  await expect(page.getByRole('list', { name: 'Engine runs' })).toContainText(/overnight .* Read \d+ evidence rows .* Wrote \d+ plan versions and \d+ moves\. \d+ ms\./)
})
