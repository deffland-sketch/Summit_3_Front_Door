import type { Sandbox, Student } from '@/model'
import { latestByOutcome } from '@/lib'
import { schoolDaysBetween, shiftDate } from '@/lib/time'
import { needs } from './needs'
import { suggestLevelReview } from './level'

export type FlagKind = 'nudge' | 'ready' | 'grew' | 'family' | 'level_review'
export interface StudentFlags {
  student: Student
  flags: { kind: FlagKind; detail: string }[]
}

/** Spec 3 caseload flags. */
export function flagsFor(student: Student, snap: Sandbox): StudentFlags['flags'] {
  const flags: StudentFlags['flags'] = []
  const today = snap.meta.today
  const weekStart = snap.meta.week_start
  const plan = snap.plans.find((p) => p.student_id === student.id && p.week_start === weekStart)
  const missed = plan?.slots.filter((s) => s.status === 'missed').length ?? 0
  const lastTp = snap.touchpoints.filter((t) => t.student_id === student.id && t.when <= `${today}T23:59:59`).sort((a, b) => (a.when < b.when ? 1 : -1))[0]
  const daysSinceTp = lastTp ? schoolDaysBetween(lastTp.when.slice(0, 10), today) : 99
  const goalUnchecked = plan ? plan.slots.filter((s) => s.day < today && s.goal && s.status === 'missed').length >= 3 : false
  if (missed >= 2) flags.push({ kind: 'nudge', detail: `${missed} missed slots this week` })
  else if (daysSinceTp >= 5) flags.push({ kind: 'nudge', detail: `No touchpoint in ${daysSinceTp} school days` })
  else if (goalUnchecked) flags.push({ kind: 'nudge', detail: 'A goal unchecked three days running' })
  const ready = needs(student.id, snap).filter((n) => n.kind === 'readiness')
  if (ready.length) flags.push({ kind: 'ready', detail: ready[0].outcome_name })
  // Grew: a cognitive skill or standard moved up since Monday.
  const mine = snap.evidence.filter((e) => e.student_id === student.id && typeof e.value === 'number')
  const before = latestByOutcome(mine, `${shiftDate(weekStart, -1)}T23:59:59`)
  const since = mine.filter((e) => e.recorded_at >= weekStart)
  const grew = since.find((e) => {
    const prev = before.get(e.outcome_id)
    return prev && typeof prev.value === 'number' && (e.value as number) > prev.value
  })
  if (grew) flags.push({ kind: 'grew', detail: snap.outcomes.find((o) => o.id === grew.outcome_id)?.name ?? grew.outcome_id })
  const family = snap.touchpoints.find((t) => t.student_id === student.id && t.kind === 'family' && t.follow_up && t.follow_up.due >= today && snap.adults.find((a) => a.id === t.mentor_id)?.capacities.some((c) => c === 'case_manager' || c === 'leader'))
  if (family) flags.push({ kind: 'family', detail: family.follow_up!.text })
  const lr = suggestLevelReview(student.id, snap)
  if (lr) flags.push({ kind: 'level_review', detail: `${lr.from} to ${lr.to}` })
  return flags
}

export function caseloadFlags(snap: Sandbox, mentorId?: string): StudentFlags[] {
  return snap.students.filter((s) => !mentorId || s.mentor_id === mentorId).map((student) => ({ student, flags: flagsFor(student, snap) }))
}
