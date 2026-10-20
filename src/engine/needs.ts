import type { Evidence, Lesson, Outcome, Sandbox, Student } from '@/model'
import { en } from '@/copy/en'
import { byId, latestByOutcome } from '@/lib'
import { daysBetween } from '@/lib/time'
import { getGraph, whatServes, describeWalk } from '@/graph'
import { subjectOfCourse } from '@/graph/catalog'
import type { Need, NeedsYouItem } from './types'

const NEXT: Record<string, string> = { expose: 'explore', explore: 'pursue', pursue: 'launch', launch: 'launch' }
const MASTERED_AT = 85
const MIN_FINAL_PRODUCT_SOURCES = new Set(['assessment', 'gradebook', 'exhibition', 'adult_note', 'external'])

export interface NeedsContext {
  asOf?: string
  weekStart?: string
}

function isScore(e: Evidence): e is Evidence & { value: number } {
  return e.value_kind === 'score_1_8' && typeof e.value === 'number'
}
function isMastery(e: Evidence): e is Evidence & { value: number } {
  return e.value_kind === 'mastery_pct' && typeof e.value === 'number'
}

/** A ranked list of what the student needs this week (Spec 6). Pure. */
export function needs(studentId: string, snap: Sandbox, ctx: NeedsContext = {}): Need[] {
  const student = snap.students.find((s) => s.id === studentId)
  if (!student) return []
  const asOf = ctx.asOf ?? snap.meta.today
  const weekStart = ctx.weekStart ?? snap.meta.week_start
  const outcomes = byId(snap.outcomes)
  const lessons = byId(snap.lessons)
  const settings = snap.settings
  const mine = snap.evidence.filter((e) => e.student_id === studentId && e.recorded_at <= `${asOf}T23:59:59.999Z`)
  const latest = latestByOutcome(mine)
  const graph = getGraph()
  const out: Need[] = []
  const seen = new Set<string>()

  const fresh = (e: Evidence) => daysBetween(e.recorded_at, asOf) <= settings.stale_days

  const servingFor = (outcomeId: string): { text: string | null; offering_id: string | null } => {
    const walks = whatServes(graph, outcomeId)
    const lessonIds = new Set(walks.filter((w) => w.node.type === 'Lesson').map((w) => w.node.id))
    const offering = snap.offerings.find(
      (o) =>
        o.status === 'published' &&
        o.day >= weekStart &&
        ((o.lesson_id && lessonIds.has(o.lesson_id)) || o.outcomes_served.includes(outcomeId)),
    )
    const w = walks[0]
    return { text: w ? describeWalk(graph, w) : null, offering_id: offering?.id ?? null }
  }

  // Content: active math lessons.
  const active = snap.assignments.filter(
    (a) => a.student_id === studentId && (a.status === 'active' || a.status === 'practiced' || a.status === 'needs_workshop'),
  )
  for (const a of active) {
    const lesson = lessons.get(a.lesson_id)
    if (!lesson) continue
    for (const oid of lesson.outcomes_served) {
      const outcome = outcomes.get(oid)
      if (!outcome || outcome.family !== 'content' || !oid.startsWith('CCSS.HS')) continue
      const rows = mine.filter((e) => e.outcome_id === oid && isMastery(e) && (e.source_ref === lesson.id || !e.source_ref)).sort((x, y) => (x.recorded_at < y.recorded_at ? 1 : -1))
      const e = rows[0]
      if (!e || !isMastery(e)) continue
      if (!fresh(e)) continue
      const key = `${a.lesson_id}:${oid}`
      if (seen.has(key)) continue
      seen.add(key)
      const v = Math.round(e.value)
      if (v < settings.required_rule.mastery_below_pct) {
        out.push(need(student, outcome, lesson, 'required', en.why.requiredContent(outcome.name, v), e.id, settings.required_rule.mastery_below_pct - v, v, null))
      } else if (v < settings.required_rule.mastery_below_pct + settings.recommended_rule.within_points) {
        out.push(need(student, outcome, lesson, 'recommended', en.why.recommendedClose(outcome.name), e.id, 1, v, null))
      } else if (a.status === 'practiced' && rows.length >= 2 && v < MASTERED_AT) {
        out.push(need(student, outcome, lesson, 'recommended', en.why.recommendedPracticed(outcome.name), e.id, 2, v, null))
      } else if (v < MASTERED_AT) {
        const s = servingFor(oid)
        const offeringTitle = s.offering_id ? snap.offerings.find((o) => o.id === s.offering_id)?.title ?? lesson.title : lesson.title
        out.push(need(student, outcome, lesson, 'in_reach', en.why.inReach(outcome.name, 'mastered', offeringTitle), e.id, MASTERED_AT - v, v, s.text, s.offering_id))
      }
    }
  }

  // Cognitive: latest final product score against the level expectation.
  for (const [oid, e] of latest) {
    const outcome = outcomes.get(oid)
    if (!outcome || outcome.family !== 'cognitive' || !isScore(e) || !MIN_FINAL_PRODUCT_SOURCES.has(e.source)) continue
    if (!fresh(e)) continue
    const exp = outcome.level_expectations?.[student.level] ?? 4
    const nextExp = student.level === 'launch' ? exp + 1 : (outcome.level_expectations?.[NEXT[student.level] as keyof typeof outcome.level_expectations] ?? exp + 1)
    const v = e.value
    if (v < exp) {
      const s = servingFor(oid)
      out.push(need(student, outcome, null, 'required', en.why.requiredCognitive(outcome.name, v, exp), e.id, exp - v, v, s.text, s.offering_id))
    } else if (v >= exp && v < nextExp) {
      const s = servingFor(oid)
      const title = s.offering_id ? snap.offerings.find((o) => o.id === s.offering_id)?.title ?? 'this week’s session' : 'a session this week'
      out.push(need(student, outcome, null, 'in_reach', en.why.inReach(outcome.name, en.app.levels[NEXT[student.level]], title), e.id, nextExp - v, v, s.text, s.offering_id))
    }
  }

  // Readiness: three fresh rows at or above the next level (cognitive) or two at 90 plus (content), with no assessment booked.
  const booked = new Set(
    snap.plans
      .filter((p) => p.student_id === studentId && p.week_start === weekStart)
      .flatMap((p) => p.slots)
      .map((s) => snap.offerings.find((o) => o.id === s.offering_id))
      .filter((o) => o && o.kind === 'assessment')
      .flatMap((o) => o!.outcomes_served),
  )
  const byOutcome = new Map<string, Evidence[]>()
  for (const e of mine) byOutcome.set(e.outcome_id, [...(byOutcome.get(e.outcome_id) ?? []), e])
  for (const [oid, rows] of byOutcome) {
    const outcome = outcomes.get(oid)
    if (!outcome || booked.has(oid)) continue
    if (outcome.family === 'cognitive') {
      const nextExp = student.level === 'launch' ? (outcome.level_expectations?.launch ?? 6) + 1 : (outcome.level_expectations?.[NEXT[student.level] as 'explore'] ?? 5)
      const strong = rows.filter((r) => isScore(r) && r.value >= nextExp && MIN_FINAL_PRODUCT_SOURCES.has(r.source))
      if (strong.length >= 3 && !out.some((n) => n.outcome_id === oid && n.kind === 'required')) {
        out.push(need(student, outcome, null, 'readiness', en.why.readiness(outcome.name), strong[strong.length - 1].id, 0, (strong[strong.length - 1] as Evidence & { value: number }).value, null))
      }
    }
  }

  const rank: Record<string, number> = { required: 0, recommended: 1, in_reach: 2, readiness: 3 }
  return out.sort((a, b) => rank[a.kind] - rank[b.kind] || (a.kind === 'required' ? b.distance - a.distance : a.distance - b.distance))
}

function need(
  student: Student,
  outcome: Outcome,
  lesson: Lesson | null,
  kind: Need['kind'],
  why: string,
  evidenceId: string | null,
  distance: number,
  value: number | null,
  serves: string | null,
  servingOfferingId: string | null = null,
): Need {
  return {
    kind,
    student_id: student.id,
    outcome_id: outcome.id,
    outcome_name: outcome.name,
    lesson_id: lesson?.id ?? null,
    family: outcome.family === 'durable' ? 'durable' : outcome.family === 'content' ? 'content' : 'cognitive',
    why,
    evidence_id: evidenceId,
    distance,
    value,
    serves,
    serving_offering_id: servingOfferingId,
  }
}

/** Decisions only a content expert can make: stale evidence, mastery opt-outs, students to flag (Spec 4). */
export function needsYou(snap: Sandbox, ctx: NeedsContext = {}): NeedsYouItem[] {
  const asOf = ctx.asOf ?? snap.meta.today
  const lessons = byId(snap.lessons)
  const units = byId(snap.units)
  const outcomes = byId(snap.outcomes)
  const items: NeedsYouItem[] = []
  const subjectOf = (lessonId: string) => {
    const l = lessons.get(lessonId)
    const u = l ? units.get(l.unit_id) : undefined
    return subjectOfCourse(u?.course_id ?? 'crs_aplang')
  }
  for (const a of snap.assignments) {
    if (a.status !== 'active' && a.status !== 'practiced') continue
    const lesson = lessons.get(a.lesson_id)
    if (!lesson) continue
    const rows = snap.evidence
      .filter((e) => e.student_id === a.student_id && e.source_ref === a.lesson_id && e.value_kind === 'mastery_pct')
      .sort((x, y) => (x.recorded_at < y.recorded_at ? 1 : -1))
    const latest = rows[0]
    const subject = subjectOf(a.lesson_id)
    if (!latest) continue
    const age = daysBetween(latest.recorded_at, asOf)
    if (age > snap.settings.stale_days) {
      const o = outcomes.get(lesson.outcomes_served[0])
      items.push({ kind: 'stale', student_id: a.student_id, outcome_id: o?.id ?? null, lesson_id: a.lesson_id, text: en.needsYou.stale(o?.name ?? lesson.title, age), subject })
    } else if (typeof latest.value === 'number' && latest.value >= 95 && a.status === 'active') {
      items.push({ kind: 'opt_out', student_id: a.student_id, outcome_id: null, lesson_id: a.lesson_id, text: en.needsYou.optOut(lesson.title), subject })
    } else if (a.status === 'practiced' && rows.length >= 2 && typeof latest.value === 'number' && latest.value < MASTERED_AT && latest.value >= snap.settings.required_rule.mastery_below_pct) {
      items.push({ kind: 'flag_required', student_id: a.student_id, outcome_id: null, lesson_id: a.lesson_id, text: en.needsYou.flagRequired(lesson.title), subject })
    }
  }
  return items
}
