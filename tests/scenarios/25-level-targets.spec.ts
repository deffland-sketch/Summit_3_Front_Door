import { expect, test } from '@playwright/test'
import { buildWeek, needs } from '../../src/engine'
import type { EngineTrace, Offering } from '../../src/model'
import { weekDates } from '../../src/lib/time'
import { fresh } from './helpers'

test('25 the weekly build reads the level targets: with practice over target a Recommended need goes to a serving session first, under it to the practice block, and every slot trace records the targets', () => {
  const base = fresh()
  const asOf = base.meta.today
  // A student with a Recommended content need, and a seminar that serves that outcome on Thursday with room.
  const pick = base.students.map((s) => ({ s, n: needs(s.id, base).find((x) => x.kind === 'recommended' && x.family === 'content') })).find((x) => x.n)!
  const thursday = weekDates(base.meta.week_start)[3]
  const seminar: Offering = { id: 'sem_s25', experience_type: 'DD', kind: 'seminar', title: 'Problem-solving seminar', lesson_id: null, outcomes_served: [pick.n!.outcome_id], adult_ids: ['adu_math'], place_id: 'pl_sem_a', day: thursday, start: '10:00', end: '10:45', capacity_min: 1, capacity_max: 20, entry: 'open', source: 'homebase', source_ref: 'sem_s25', standing: false, status: 'published' }
  const run = (pf: number) => {
    const snap = fresh()
    snap.offerings.push(seminar)
    for (const level of ['expose', 'explore', 'pursue', 'launch'] as const) snap.settings.level_targets[level] = { ...snap.settings.level_targets[level], PF: pf }
    const traces: EngineTrace[] = []
    const plan = buildWeek(pick.s.id, snap, { weekStart: snap.meta.week_start, asOf, traces, runId: `s25_${pf}`, now: `${asOf}T00:00:00.000Z` })
    const slot = plan.slots.find((x) => x.entry === 'recommended' && traces.find((t) => t.ref_id === x.id)?.evidence_ids.includes(pick.n!.evidence_id!))
    return { plan, traces, slot, trace: slot ? traces.find((t) => t.ref_id === slot.id)! : null, snap }
  }
  const over = run(0)
  expect(over.slot, 'the Recommended need was placed with practice over target').toBeDefined()
  expect(over.slot!.offering_id).toBe('sem_s25')
  expect(over.trace!.decision).toMatch(/against a 0% target, so a session of another kind came first/)
  const under = run(1)
  expect(under.slot, 'the Recommended need was placed with practice under target').toBeDefined()
  expect(under.snap.offerings.find((o) => o.id === under.slot!.offering_id)?.kind).toBe('practice')
  expect(under.trace!.decision).toMatch(/against a 100% target, so practice came first/)
  // Every slot trace records the level targets that applied.
  for (const t of over.traces) expect(t.settings.target_PF).toBe(0)
  for (const t of under.traces) {
    expect(t.settings.target_PF).toBe(1)
    expect(t.settings.target_RW).toBe(base.settings.level_targets[pick.s.level]!.RW)
  }
})

test('25b the lead edits a level target in Settings, the change is logged by cell, and Time and Talent names the types outside ten points', async ({ page }) => {
  await page.goto('/l/settings')
  const cell = page.getByLabel('Pursue Real-world experience target (%)')
  await expect(cell).toHaveValue('25')
  await cell.fill('60')
  await expect(page.getByText(/level_targets\.pursue\.RW: 0\.25 to 0\.6/)).toBeVisible()
  await page.getByRole('link', { name: 'Time and Talent' }).click()
  await expect(page.getByTestId('outside-ten')).toContainText(/Outside ten points: .*\(\d+% against \d+%\)/)
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Reset to the How Summit 3.0 Works defaults' }).click()
  await expect(page.getByLabel('Pursue Real-world experience target (%)')).toHaveValue('25')
})
