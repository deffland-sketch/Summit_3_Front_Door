import type { Sandbox } from '@/model'
import { latestByOutcome } from '@/lib'

/**
 * The outcomes a student has validated, for gapsTo() and pathwaysNear() (Spec 10): a cognitive skill at or
 * above the expectation for the given level, a content standard at 85 or above, any habit with a reflection,
 * and an external pass. The student's Pathway screen, the ranker, and the level review share this rule.
 */
export function validatedOutcomes(studentId: string, snap: Sandbox, opts: { asOf?: string; level?: 'expose' | 'explore' | 'pursue' | 'launch' } = {}): Set<string> {
  const student = snap.students.find((s) => s.id === studentId)
  const set = new Set<string>()
  if (!student) return set
  const level = opts.level ?? student.level
  const mine = snap.evidence.filter((e) => e.student_id === studentId)
  const latest = latestByOutcome(mine, opts.asOf ? `${opts.asOf}T23:59:59.999Z` : undefined)
  for (const [oid, e] of latest) {
    const o = snap.outcomes.find((x) => x.id === oid)
    if (!o) continue
    if (o.family === 'cognitive' && typeof e.value === 'number' && e.value >= (o.level_expectations?.[level] ?? 4)) set.add(oid)
    if (o.family === 'content' && typeof e.value === 'number' && e.value >= 85) set.add(oid)
    if (o.family === 'durable') set.add(oid)
  }
  for (const e of mine) if (e.source === 'external' && e.value_kind === 'pass_fail' && e.value === 'pass' && e.source_ref) set.add(e.source_ref)
  return set
}
