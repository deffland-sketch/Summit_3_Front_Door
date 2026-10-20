import { expect, test } from '@playwright/test'
import { needs, whatIf } from '../../src/engine'
import { appStore } from '../../src/store'
import { fresh, openSandboxControls, sandbox } from './helpers'

test('28 a what-if previews a score, a setting, and an adult out on a copy, diffing one student and the school, and writes nothing', () => {
  const snap = fresh()
  const before = JSON.stringify(snap.plans.filter((p) => p.week_start === snap.meta.week_start).map((p) => p.slots.map((s) => `${s.id}${s.status}`)))
  // A score: the quiet student gets one Required slot added, nobody else changes.
  const student = snap.students.find((s) => {
    const plan = snap.plans.find((x) => x.student_id === s.id && x.week_start === snap.meta.week_start)!
    const open = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    return open && !needs(s.id, snap).some((x) => x.kind === 'required' || x.kind === 'recommended') && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  const asg = snap.assignments.find((a) => a.student_id === student.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))!
  const lesson = snap.lessons.find((l) => l.id === asg.lesson_id)!
  const score = whatIf(snap, { kind: 'score', student_id: student.id, lesson_id: lesson.id, outcome_id: lesson.outcomes_served[0], value: 41 }, student.id)
  expect(score.student!.added.length).toBeGreaterThanOrEqual(1)
  expect(score.student!.added.some((s) => s.entry === 'required')).toBe(true)
  expect(score.school.after.students_changed).toBe(1)
  expect(score.ms).toBeLessThan(5000)
  // A setting: a higher grouping threshold never adds proposals; the diff is school-wide.
  const setting = whatIf(snap, { kind: 'setting', key: 'grouping_threshold', value: 8 }, student.id)
  expect(setting.school.after.proposals).toBeLessThanOrEqual(setting.school.before.proposals)
  expect(setting.school.before.proposals).toBe(score.school.before.proposals)
  // An adult out: only displaced students change.
  const renee = snap.adults.find((a) => a.id === 'adu_math')!
  const out = whatIf(snap, { kind: 'adult_out', adult_id: renee.id, day: snap.meta.today }, student.id)
  const displaced = new Set(snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.day >= snap.meta.today && s.status !== 'cancelled' && s.status !== 'moved' && snap.offerings.find((o) => o.id === s.offering_id)?.adult_ids.includes(renee.id) && !['practice', 'community'].includes(snap.offerings.find((o) => o.id === s.offering_id)!.kind))).map((p) => p.student_id))
  expect(out.school.after.students_changed).toBeLessThanOrEqual(displaced.size)
  expect(out.school.after.students_changed).toBeGreaterThan(0)
  // Nothing was written: the snapshot's plans are as they were.
  const after = JSON.stringify(snap.plans.filter((p) => p.week_start === snap.meta.week_start).map((p) => p.slots.map((s) => `${s.id}${s.status}`)))
  expect(after).toBe(before)
  expect(snap.evidence.some((e) => e.id.startsWith('ev_whatif'))).toBe(false)
  expect(snap.settings.grouping_threshold).toBe(sandbox().settings.grouping_threshold)
})

test('28b the demo driver previews a lowered score side by side, the student\'s week is untouched until Apply, then it changes', async ({ page }) => {
  const snap = sandbox()
  const student = snap.students.find((s) => {
    const plan = snap.plans.find((x) => x.student_id === s.id && x.week_start === snap.meta.week_start)!
    const open = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    return open && !needs(s.id, snap).some((x) => x.kind === 'required' || x.kind === 'recommended') && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  await page.goto(`/s/${student.id}/week`)
  await openSandboxControls(page)
  const panel = page.getByRole('dialog', { name: 'Sandbox controls' })
  await panel.getByLabel('Change').selectOption('score')
  await panel.getByRole('button', { name: 'Preview' }).click()
  const result = page.getByTestId('whatif-result')
  await expect(result).toBeVisible({ timeout: 15000 })
  await expect(result).toContainText(`For ${student.display_name}`)
  await expect(result).toContainText(/Added: .* · required/)
  await expect(result).toContainText('Students whose week changed')
  await expect(result).toContainText(/nothing written/)
  // Read-only until Apply: no new-since-yesterday slot on the week yet.
  await expect(page.getByText('New since yesterday')).toHaveCount(0)
  await panel.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.getByText('New since yesterday').first()).toBeVisible()
  await expect(result).toHaveCount(0)
  void appStore
})
