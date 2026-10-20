/** Prints the distributions Spec 1 and Spec 9 ask for, from public/sandbox/sandbox.json. */
import { readFileSync } from 'node:fs'
import { SandboxSchema } from '../src/model'
import { needs, needsYou, proposeWorkshops, suggestLevelReview, validatePlans } from '../src/engine'
import { weekDates, minutesBetween } from '../src/lib/time'
import { caseloadFlags } from '../src/engine/flags'

const snap = SandboxSchema.parse(JSON.parse(readFileSync('public/sandbox/sandbox.json', 'utf8')))
const count = <T,>(arr: T[], f: (x: T) => string) => {
  const m: Record<string, number> = {}
  for (const x of arr) m[f(x)] = (m[f(x)] ?? 0) + 1
  return m
}
console.log('levels', count(snap.students, (s) => s.level))
console.log('autonomy', count(snap.students, (s) => s.plan_autonomy))
console.log('with supports', snap.students.filter((s) => s.supports.length).length, 'with protected', snap.students.filter((s) => s.protected_slots.length).length, 'life constraints', snap.students.filter((s) => s.life_constraints.length).length)
console.log('math course by level', count(snap.assignments.filter((a) => a.status === 'active' || a.status === 'practiced' || a.status === 'needs_workshop').filter((a) => a.lesson_id.startsWith('les_im')), (a) => `${snap.students.find((s) => s.id === a.student_id)!.level}:${a.lesson_id.slice(4, 7)}`))
const current = snap.plans.filter((p) => p.week_start === snap.meta.week_start)
const allNeeds = snap.students.map((s) => ({ s, n: needs(s.id, snap) }))
console.log('students with >=1 need', allNeeds.filter((x) => x.n.length).length)
console.log('students with required', allNeeds.filter((x) => x.n.some((n) => n.kind === 'required')).length, 'recommended-only', allNeeds.filter((x) => !x.n.some((n) => n.kind === 'required') && x.n.some((n) => n.kind === 'recommended')).length, 'in_reach', allNeeds.filter((x) => x.n.some((n) => n.kind === 'in_reach')).length, 'readiness', allNeeds.filter((x) => x.n.some((n) => n.kind === 'readiness')).length)
console.log('required slots this week (students)', current.filter((p) => p.slots.some((s) => s.entry === 'required')).length, 'recommended', current.filter((p) => p.slots.some((s) => s.entry === 'recommended')).length)
console.log('required traced to evidence', current.flatMap((p) => p.slots).filter((s) => s.entry === 'required').every((s) => s.evidence_id))
for (const d of weekDates(snap.meta.week_start)) console.log(d, 'RW students', current.filter((p) => p.slots.some((s) => s.day === d && s.experience_type === 'RW')).length, 'open slots', current.flatMap((p) => p.slots).filter((s) => s.day === d && s.offering_id === null && s.entry === 'chosen').length)
console.log('no RW in 4 weeks', snap.students.filter((st) => !snap.plans.filter((p) => p.student_id === st.id && p.week_start >= '2026-09-21').some((p) => p.slots.some((s) => s.experience_type === 'RW'))).length)
const flags = caseloadFlags(snap)
console.log('flags', count(flags.flatMap((f) => f.flags.map((x) => x.kind)), (x) => x))
const proposals = proposeWorkshops(snap)
console.log('proposals', proposals.length, 'workshops >=4', proposals.filter((p) => p.kind === 'workshop' && p.student_ids.length >= 4).length, 'published workshops this week', snap.offerings.filter((o) => o.kind === 'workshop' && o.day >= snap.meta.week_start).length)
console.log('needsYou', count(needsYou(snap), (x) => x.kind))
console.log('level reviews', snap.students.map((s) => suggestLevelReview(s.id, snap)).filter(Boolean).length)
console.log('violations', validatePlans(current, snap).length, validatePlans(current, snap).slice(0, 3))
const mins: Record<string, number> = {}
let total = 0
for (const s of current.flatMap((p) => p.slots)) {
  if (s.status === 'cancelled' || s.status === 'moved' || (s.offering_id === null && s.entry === 'chosen')) continue
  const m = minutesBetween(s.start, s.end)
  mins[s.experience_type] = (mins[s.experience_type] ?? 0) + m
  total += m
}
console.log('time split', Object.fromEntries(Object.entries(mins).map(([k, v]) => [k, Math.round((v / total) * 100)])))
console.log('touchpoints this week per student', (snap.touchpoints.filter((t) => t.when >= snap.meta.week_start).length / 100).toFixed(2), 'last week', (snap.touchpoints.filter((t) => t.when >= '2026-10-12' && t.when < '2026-10-19').length / 100).toFixed(2))
console.log('evidence by source', count(snap.evidence, (e) => e.source))
console.log('expert offerings per day', count(snap.offerings.filter((o) => o.day >= snap.meta.week_start && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community'), (o) => o.adult_ids[0] ?? 'none'))
