import { expect, test } from '@playwright/test'
import { adjustOvernight, needs } from '../../src/engine'
import { fresh } from './helpers'

test('05 a lowered math score and adjustOvernight add exactly one Required slot with the right why', () => {
  const snap = fresh()
  const student = snap.students.find((s) => {
    const n = needs(s.id, snap)
    const plan = snap.plans.find((p) => p.student_id === s.id && p.week_start === snap.meta.week_start)!
    const hasOpen = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    return hasOpen && !n.some((x) => x.kind === 'required' || x.kind === 'recommended') && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  const asg = snap.assignments.find((a) => a.student_id === student.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))!
  const lesson = snap.lessons.find((l) => l.id === asg.lesson_id)!
  const outcome = snap.outcomes.find((o) => o.id === lesson.outcomes_served[0])!
  snap.evidence.push({ id: 'ev_s05', student_id: student.id, outcome_id: outcome.id, source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: 41, artifact_url: null, recorded_by: 'system', recorded_at: `${snap.meta.today}T20:00:00.000Z`, slot_id: null })
  const { moves } = adjustOvernight(snap, { since: `${snap.meta.today}T12:00:00.000Z` })
  expect(moves.filter((m) => m.student_id === student.id)).toHaveLength(1)
  expect(moves[0].slot.entry).toBe('required')
  expect(moves[0].slot.why).toContain('41')
  expect(moves.filter((m) => m.student_id !== student.id)).toHaveLength(0)
})
