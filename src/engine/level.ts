import type { Sandbox, TracePart } from '@/model'
import { en } from '@/copy/en'
import { latestByOutcome } from '@/lib'
import { daysBetween } from '@/lib/time'
import { gapsTo, getGraph } from '@/graph'
import { validatedOutcomes } from './validated'
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
      const trace: TracePart = { evidence_ids: mine.filter((e) => e.source === 'futre' && within(e.recorded_at)).map((e) => e.id), settings: { six_weeks_days: SIX_WEEKS, cns_type: futre.cns.cns_type }, edges: [], candidates: reflected.map((x) => ({ id: x.experience_id, label: `${x.title}, reflected ${x.reflection_at?.slice(0, 10)}`, score: null, lost_because: null })), decision: `${reflected.length} reflected experiences in six weeks and a CNS set` }
      return { student_id: studentId, from: 'expose', to: 'explore', reasons, trace }
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
      const trace: TracePart = { evidence_ids: [...latest.values()].filter((e) => snap.outcomes.find((o) => o.id === e.outcome_id)?.family === 'cognitive').map((e) => e.id), settings: { six_weeks_days: SIX_WEEKS, domains_needed: 4, cns_updated: futre.cns.updated_at.slice(0, 10) }, edges: [], candidates: [...domainsAtExplore].map((d) => ({ id: d, label: `${d} at Explore expectation`, score: null, lost_because: null })), decision: `CNS stable, ${domainsAtExplore.size} domains at Explore, a Pursue experience started` }
      return { student_id: studentId, from: 'explore', to: 'pursue', reasons, trace }
    }
    return null
  }
  if (student.level === 'pursue' && futre.cns.pathway_id) {
    const validated = validatedOutcomes(studentId, snap, { asOf, level: 'pursue' })
    const gaps = gapsTo(getGraph(), futre.cns.pathway_id, validated)
    const booked = snap.plans.some((p) => p.student_id === studentId && p.slots.some((s) => snap.offerings.find((o) => o.id === s.offering_id)?.kind === 'assessment'))
    const launchPlan = futre.portfolio.latest_item?.title.toLowerCase().includes('launch plan') ?? false
    const defense = snap.plans.some((p) => p.student_id === studentId && p.slots.some((s) => snap.offerings.find((o) => o.id === s.offering_id)?.title.toLowerCase().includes('defense')))
    const firstStep = futre.experiences.some((x) => x.type === 'pursue' && x.status === 'in_progress') || mine.some((e) => e.source === 'external' && within(e.recorded_at))
    if ((gaps.length === 0 || (gaps.length <= 1 && booked)) && launchPlan && defense && firstStep) {
      reasons.push(en.levelReview.toLaunch)
      if (gaps.length) reasons.push(en.levelReview.gapsLeft(gaps.map((g) => g.node.name)))
      const trace: TracePart = { evidence_ids: [...latest.values()].map((e) => e.id).slice(0, 40), settings: { pathway: futre.cns.pathway_id, gaps_left: gaps.length, launch_plan: launchPlan, defense_scheduled: defense }, edges: gaps.flatMap((g) => g.via.map((e) => ({ from: e.from, to: e.to, type: e.type, source: e.source }))), candidates: gaps.map((g) => ({ id: g.node.id, label: g.node.name, score: null, lost_because: 'still a gap' })), decision: `every pathway requirement validated or booked, launch plan drafted, defense scheduled, first step taken` }
      return { student_id: studentId, from: 'pursue', to: 'launch', reasons, trace }
    }
  }
  return null
}
