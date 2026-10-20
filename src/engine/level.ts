import type { Sandbox } from '@/model'
import { en } from '@/copy/en'
import { latestByOutcome } from '@/lib'
import { daysBetween } from '@/lib/time'
import { gapsTo, getGraph } from '@/graph'
import type { LevelReviewSuggestion } from './types'

const SIX_WEEKS = 42

/** Suggest a level review when the evidence pattern over six weeks fits Spec 6. Never suggests downward. */
export function suggestLevelReview(studentId: string, snap: Sandbox, asOf = snap.meta.today): LevelReviewSuggestion | null {
  const student = snap.students.find((s) => s.id === studentId)
  const futre = snap.futre.find((f) => f.student_id === studentId)
  if (!student || !futre) return null
  const within = (iso: string | null) => Boolean(iso && daysBetween(iso, asOf) <= SIX_WEEKS && daysBetween(iso, asOf) >= 0)
  const reasons: string[] = []
  const mine = snap.evidence.filter((e) => e.student_id === studentId)
  const latest = latestByOutcome(mine, `${asOf}T23:59:59.999Z`)

  if (student.level === 'expose') {
    const reflected = futre.experiences.filter((x) => x.status === 'complete' && x.reflection_text && within(x.reflection_at))
    if (reflected.length >= 2 && futre.cns.cns_type !== 'undecided') {
      reasons.push(en.levelReview.toExplore)
      return { student_id: studentId, from: 'expose', to: 'explore', reasons }
    }
    return null
  }
  if (student.level === 'explore') {
    const stable = futre.cns.cns_type !== 'undecided' && daysBetween(futre.cns.updated_at, asOf) >= SIX_WEEKS
    const domainsAtExplore = new Set<string>()
    for (const [oid, e] of latest) {
      const o = snap.outcomes.find((x) => x.id === oid)
      if (o?.family === 'cognitive' && typeof e.value === 'number' && e.value >= (o.level_expectations?.explore ?? 4)) domainsAtExplore.add(o.domain)
    }
    const started = futre.experiences.some((x) => x.type === 'pursue' && (x.status === 'in_progress' || x.status === 'complete')) || mine.some((e) => e.source === 'external' && within(e.recorded_at))
    if (stable && domainsAtExplore.size >= 4 && started) {
      reasons.push(en.levelReview.toPursue)
      return { student_id: studentId, from: 'explore', to: 'pursue', reasons }
    }
    return null
  }
  if (student.level === 'pursue' && futre.cns.pathway_id) {
    const validated = new Set<string>()
    for (const [oid, e] of latest) {
      const o = snap.outcomes.find((x) => x.id === oid)
      if (!o) continue
      if (o.family === 'cognitive' && typeof e.value === 'number' && e.value >= (o.level_expectations?.pursue ?? 5)) validated.add(oid)
      if (o.family === 'content' && typeof e.value === 'number' && e.value >= 85) validated.add(oid)
      if (o.family === 'durable') validated.add(oid)
    }
    for (const e of mine) if (e.source === 'external' && e.value_kind === 'pass_fail' && e.value === 'pass' && e.source_ref) validated.add(e.source_ref)
    const gaps = gapsTo(getGraph(), futre.cns.pathway_id, validated)
    const booked = snap.plans.some((p) => p.student_id === studentId && p.slots.some((s) => snap.offerings.find((o) => o.id === s.offering_id)?.kind === 'assessment'))
    const launchPlan = futre.portfolio.latest_item?.title.toLowerCase().includes('launch plan') ?? false
    const defense = snap.plans.some((p) => p.student_id === studentId && p.slots.some((s) => snap.offerings.find((o) => o.id === s.offering_id)?.title.toLowerCase().includes('defense')))
    const firstStep = futre.experiences.some((x) => x.type === 'pursue' && x.status === 'in_progress') || mine.some((e) => e.source === 'external' && within(e.recorded_at))
    if ((gaps.length === 0 || (gaps.length <= 1 && booked)) && launchPlan && defense && firstStep) {
      reasons.push(en.levelReview.toLaunch)
      return { student_id: studentId, from: 'pursue', to: 'launch', reasons }
    }
  }
  return null
}
