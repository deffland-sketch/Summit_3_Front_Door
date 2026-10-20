import { expect, test } from '@playwright/test'
import { proposeWorkshops } from '../../src/engine'
import { overlaps, weekdayOf } from '../../src/lib/time'
import { fresh, sandbox } from './helpers'

const BANNED = /\b(behind|failing|at risk|deficient|low performer)\b/i

test('22 every proposal is one a content expert could accept from the card: same prerequisites, no hard overlap, 1:1 below threshold, rationale and decline line', () => {
  const snap = sandbox()
  const mastered = new Set(snap.assignments.filter((a) => a.status === 'mastered' || a.status === 'skipped_on_mastery').map((a) => `${a.student_id}|${a.lesson_id}`))
  const proposals = proposeWorkshops(snap)
  expect(proposals.length).toBeGreaterThan(3)
  for (const p of proposals) {
    const lesson = snap.lessons.find((l) => l.id === p.lesson_id)!
    // Rule 6: every grouped student has every prerequisite of the proposed lesson mastered.
    for (const sid of p.student_ids) for (const pre of lesson.prerequisites) expect(mastered.has(`${sid}|${pre}`), `${p.id} ${sid} prerequisite ${pre}`).toBe(true)
    // Rule 7: the time overlaps no grouped student's placement, protected slot, or life constraint.
    if (p.adult_id) {
      for (const sid of p.student_ids) {
        const st = snap.students.find((s) => s.id === sid)!
        const plan = snap.plans.find((x) => x.student_id === sid && x.week_start === snap.meta.week_start)!
        const wd = weekdayOf(p.day)
        expect(st.protected_slots.some((x) => x.day === wd && overlaps(x.start, x.end, p.start, p.end)), `${p.id} ${sid} protected`).toBe(false)
        expect(st.life_constraints.some((x) => x.day === wd && overlaps(x.start, x.end, p.start, p.end)), `${p.id} ${sid} life`).toBe(false)
        expect(plan.slots.some((s) => s.day === p.day && s.status !== 'cancelled' && s.status !== 'moved' && s.experience_type === 'RW' && overlaps(s.start, s.end, p.start, p.end)), `${p.id} ${sid} RW`).toBe(false)
      }
    }
    // Collisions are per student and the card says so.
    for (const k of p.collisions) expect(p.student_ids).toContain(k.student_id)
    if (p.collisions.length) expect(p.why).toMatch(/moves? aside/)
    // Rule 8: below threshold is a 1:1 conference, never a workshop.
    if (p.kind === 'workshop') expect(p.student_ids.length).toBeGreaterThanOrEqual(snap.settings.grouping_threshold)
    else expect(p.student_ids).toHaveLength(1)
    // Rule 9: a rationale that names the evidence source and day, and a decline line for every student.
    expect(p.rationale).toMatch(/kira|gradebook|teach_to_one|needs a workshop/)
    expect(p.rationale).toMatch(/Mon|Tue|Wed|Thu|Fri|content expert/)
    expect(p.rationale).not.toMatch(BANNED)
    expect(p.if_declined.map((d) => d.student_id).sort()).toEqual([...p.student_ids].sort())
    for (const d of p.if_declined) expect(d.text).toMatch(/Practice hub|conference|self-directed/)
  }
  expect(proposals.some((p) => p.kind === 'workshop')).toBe(true)
  expect(proposals.some((p) => p.kind === 'conference')).toBe(true)
})

test('22b a student whose prerequisite is still open splits off onto the prerequisite lesson, and the trace names the edge', () => {
  const snap = fresh()
  const before = proposeWorkshops(snap).find((p) => p.kind === 'workshop' && snap.lessons.find((l) => l.id === p.lesson_id)!.prerequisites.length > 0)!
  const lesson = snap.lessons.find((l) => l.id === before.lesson_id)!
  const sid = before.student_ids[0]
  const pre = lesson.prerequisites[0]
  // Reopen the prerequisite for one grouped student.
  for (const a of snap.assignments) if (a.student_id === sid && a.lesson_id === pre) a.status = 'active'
  const after = proposeWorkshops(snap)
  const same = after.find((p) => p.lesson_id === before.lesson_id && p.student_ids.length === before.student_ids.length - 1)
  const moved = after.find((p) => p.lesson_id === pre && p.student_ids.includes(sid))
  expect(same, 'the rest stay on the lesson').toBeDefined()
  expect(same!.student_ids).not.toContain(sid)
  expect(moved, 'the student moves to the prerequisite').toBeDefined()
  expect(moved!.trace.edges.some((e) => e.from === before.lesson_id && e.to === pre && e.type === 'prerequisite')).toBe(true)
  expect(moved!.why).toMatch(/prerequisite still open/)
})

test('22c the card shows the rationale, the collisions by student, and what happens on decline', async ({ page }) => {
  await page.goto('/x/adu_math/proposed')
  const first = page.locator('li').filter({ has: page.getByRole('button', { name: 'Accept', exact: true }) }).first()
  await expect(first).toContainText(/with every prerequisite mastered/)
  await expect(first).toContainText(/If you decline\./)
  await expect(first).toContainText(/Practice hub|conference|self-directed/)
})
