import { expect, test } from '@playwright/test'
import { buildWeek, newLedger, validatePlans } from '../../src/engine'
import { currentPlan, fresh } from './helpers'

test('06 a lesson marked mastered drops its Required slot on rebuild', () => {
  const snap = fresh()
  const plan = snap.plans.find((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.entry === 'required' && s.offering_id && snap.offerings.find((o) => o.id === s.offering_id)?.lesson_id))!
  const slot = plan.slots.find((s) => s.entry === 'required' && s.offering_id && snap.offerings.find((o) => o.id === s.offering_id)?.lesson_id)!
  const lessonId = snap.offerings.find((o) => o.id === slot.offering_id)!.lesson_id!
  const asg = snap.assignments.find((a) => a.student_id === plan.student_id && a.lesson_id === lessonId)!
  asg.status = 'mastered'
  asg.mastered_at = `${snap.meta.today}T20:00:00.000Z`
  snap.evidence.push({ id: 'ev_s06', student_id: plan.student_id, outcome_id: snap.lessons.find((l) => l.id === lessonId)!.outcomes_served[0], source: 'kira', source_ref: lessonId, value_kind: 'mastery_pct', value: 92, artifact_url: null, recorded_by: 'system', recorded_at: `${snap.meta.today}T20:00:00.000Z`, slot_id: null })
  const ledger = newLedger(snap)
  for (const s of plan.slots) if (s.offering_id) ledger.fill.set(s.offering_id, Math.max(0, (ledger.fill.get(s.offering_id) ?? 0) - 1))
  const rebuilt = buildWeek(plan.student_id, snap, { ledger, rwPlacements: plan.slots.filter((s) => s.experience_type === 'RW' && s.offering_id).map((s) => s.offering_id!), goals: plan.goals, focusHabits: plan.focus_habits })
  expect(rebuilt.slots.some((s) => s.entry === 'required' && snap.offerings.find((o) => o.id === s.offering_id)?.lesson_id === lessonId)).toBe(false)
  expect(asg.status).toBe('mastered')
  expect(validatePlans([rebuilt], snap)).toEqual([])
  void currentPlan
})
