import type { Offering, Plan, Sandbox, Slot, Student } from '@/model'
import { byId } from '@/lib'
import { minutesBetween, overlaps } from '@/lib/time'
import { getGraph, whatServes } from '@/graph'
import { EXPERIENCE_TEMPLATES, PATHWAYS } from '@/graph/authored/pathways'
import type { CapacityLedger, Need, RankedOption } from './types'
import { collisionsFor } from './collisions'

export interface RankContext {
  student: Student
  plan: Pick<Plan, 'goals' | 'slots'>
  needs: Need[]
  ledger: CapacityLedger
  day: string
  start: string
  end: string
}

/** Outcomes the student's Futre CNS points at, through the pathway graph. */
export function cnsOutcomes(studentId: string, snap: Sandbox): Set<string> {
  const f = snap.futre.find((x) => x.student_id === studentId)
  const out = new Set<string>()
  if (!f) return out
  const pw = PATHWAYS.find((p) => p.id === f.cns.pathway_id)
  if (pw) {
    for (const r of pw.requires) out.add(r)
    for (const xid of pw.experiences) for (const t of EXPERIENCE_TEMPLATES.find((x) => x.id === xid)?.teaches ?? []) out.add(t)
  }
  return out
}

/** Score every published offering with capacity for this student in the window (Spec 6 ranking). */
export function rankOptions(snap: Sandbox, ctx: RankContext, limit = 5): RankedOption[] {
  const { student, plan, needs, ledger, day, start, end } = ctx
  const outcomes = byId(snap.outcomes)
  const graph = getGraph()
  const targets = snap.settings.level_targets[student.level]
  const cns = cnsOutcomes(student.id, snap)
  const goalOutcomes = new Set(plan.goals.map((g) => g.outcome_id).filter((x): x is string => Boolean(x)))
  const inReach = new Set(needs.filter((n) => n.kind === 'in_reach').map((n) => n.outcome_id))
  const inReachServed = new Map<string, Set<string>>()
  for (const oid of inReach) inReachServed.set(oid, new Set(whatServes(graph, oid).map((w) => w.node.id)))

  const live = plan.slots.filter((s) => s.status !== 'cancelled' && s.status !== 'moved' && s.offering_id !== null)
  const weekMinutes = Math.max(1, live.reduce((m, s) => m + minutesBetween(s.start, s.end), 0))
  const typeMinutes = (t: string) => live.filter((s) => s.experience_type === t).reduce((m, s) => m + minutesBetween(s.start, s.end), 0)
  const dayMinutes = Math.max(1, live.filter((s) => s.day === day).reduce((m, s) => m + minutesBetween(s.start, s.end), 0))

  const options: RankedOption[] = []
  for (const o of snap.offerings) {
    if (o.status !== 'published' || o.day !== day) continue
    if (!(o.start >= start && o.end <= end)) continue
    if (o.kind === 'community' || o.kind === 'event' || o.kind === 'assessment' || o.experience_type === 'RG') continue
    if (o.entry === 'assigned' || o.entry === 'invited') continue
    if ((ledger.fill.get(o.id) ?? 0) >= o.capacity_max) continue
    if (o.experience_type === 'DI' && o.lesson_id && !needs.some((n) => n.lesson_id === o.lesson_id)) continue
    let score = 0
    const reasons: string[] = []
    const builds: string[] = []
    const served = new Set(o.outcomes_served)
    if (o.lesson_id) for (const oid of snap.lessons.find((l) => l.id === o.lesson_id)?.outcomes_served ?? []) served.add(oid)
    if ([...served].some((x) => goalOutcomes.has(x))) {
      score += 3
      reasons.push('goal')
    }
    const servesInReach = [...inReach].some((oid) => served.has(oid) || (o.lesson_id && inReachServed.get(oid)?.has(o.lesson_id)) || (o.source_ref && inReachServed.get(oid)?.has(o.source_ref)))
    if (servesInReach) {
      score += 2
      reasons.push('in_reach')
    }
    if ([...served].some((x) => cns.has(x)) || (o.source_ref && cns.size && EXPERIENCE_TEMPLATES.some((x) => x.id === o.source_ref && x.teaches.some((t) => cns.has(t))))) {
      score += 2
      reasons.push('cns')
    }
    const target = (targets[o.experience_type] ?? 0) * weekMinutes
    if (typeMinutes(o.experience_type) < target) {
      score += 1
      reasons.push('under_target')
    }
    if (typeMinutes(o.experience_type) > 0 && live.filter((s) => s.day === day && s.experience_type === o.experience_type).reduce((m, s) => m + minutesBetween(s.start, s.end), 0) > dayMinutes / 2) {
      score -= 2
      reasons.push('same_type_day')
    }
    const coll = collisionsFor(student, o.day, o.start, o.end, plan.slots.filter((s) => s.status !== 'cancelled' && s.status !== 'moved' && (s.offering_id !== null || s.entry !== 'chosen')), snap)
    if (coll.length) {
      score -= 5
      reasons.push('collides')
    }
    for (const x of served) {
      const oc = outcomes.get(x)
      if (oc) builds.push(oc.name)
    }
    options.push({ offering: o, score, reasons, builds: builds.slice(0, 3) })
  }
  return options.sort((a, b) => b.score - a.score || a.offering.title.localeCompare(b.offering.title)).slice(0, limit)
}

export function slotsCollide(a: Slot, o: Offering): boolean {
  return a.day === o.day && overlaps(a.start, a.end, o.start, o.end)
}
