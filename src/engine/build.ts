import type { Offering, Plan, Sandbox, Slot, Student, TraceEdge, TracePart } from '@/model'
import { en } from '@/copy/en'
import { byId } from '@/lib'
import { overlaps, weekDates, weekdayOf } from '@/lib/time'
import { PATHWAYS } from '@/graph/authored/pathways'
import { needs as computeNeeds } from './needs'
import { collisionsFor } from './collisions'
import { rankOptions } from './rank'
import { BLOCKS, makeTrace, type CapacityLedger, type Need, type RankedOption, type TraceSink } from './types'

export interface BuildContext {
  weekStart?: string
  asOf?: string
  ledger?: CapacityLedger
  /** RW offering ids the coordinator placed this student into (kept across rebuilds). */
  rwPlacements?: string[]
  goals?: Plan['goals']
  focusHabits?: string[]
  needs?: Need[]
  version?: number
  planId?: string
  /** Where the placed slots' traces go. */
  traces?: TraceSink
  runId?: string
  now?: string
}

export function newLedger(snap?: Sandbox, weekStart?: string): CapacityLedger {
  const ledger: CapacityLedger = { fill: new Map() }
  if (snap) {
    const ws = weekStart ?? snap.meta.week_start
    for (const p of snap.plans) {
      if (p.week_start !== ws) continue
      for (const s of p.slots) if (s.offering_id && s.status !== 'cancelled' && s.status !== 'moved') ledger.fill.set(s.offering_id, (ledger.fill.get(s.offering_id) ?? 0) + 1)
    }
  }
  return ledger
}

let slotCounter = 0
export function slotId(planId: string): string {
  slotCounter++
  return `${planId}_s${String(slotCounter).padStart(3, '0')}`
}
export function resetSlotCounter() {
  slotCounter = 0
}

function makeSlot(planId: string, partial: Omit<Slot, 'id' | 'plan_id' | 'goal' | 'status' | 'rating' | 'bring' | 'evidence_id' | 'added_at'> & Partial<Slot>): Slot {
  return {
    id: slotId(planId),
    plan_id: planId,
    goal: null,
    status: 'planned',
    rating: null,
    bring: null,
    evidence_id: null,
    added_at: null,
    ...partial,
  }
}

function free(slots: Slot[], day: string, start: string, end: string): boolean {
  return !slots.some((s) => s.day === day && s.status !== 'cancelled' && s.status !== 'moved' && overlaps(s.start, s.end, start, end))
}

function take(ledger: CapacityLedger, o: Offering): boolean {
  const n = ledger.fill.get(o.id) ?? 0
  if (n >= o.capacity_max) return false
  ledger.fill.set(o.id, n + 1)
  return true
}

function hasRoom(ledger: CapacityLedger, o: Offering): boolean {
  return (ledger.fill.get(o.id) ?? 0) < o.capacity_max
}

/** Build one student's draft week (Spec 6 placement order). Pure apart from the shared ledger. */
export function buildWeek(studentId: string, snap: Sandbox, ctx: BuildContext = {}): Plan {
  const student = snap.students.find((s) => s.id === studentId)
  if (!student) throw new Error(`no student ${studentId}`)
  const weekStart = ctx.weekStart ?? snap.meta.week_start
  const dates = weekDates(weekStart)
  const ledger = ctx.ledger ?? newLedger()
  const planId = ctx.planId ?? `plan_${studentId.replace('stu_', '')}_${weekStart.replace(/-/g, '')}`
  const offerings = snap.offerings.filter((o) => o.status === 'published' && o.day >= dates[0] && o.day <= dates[4])
  const lessons = byId(snap.lessons)
  const needs = ctx.needs ?? computeNeeds(studentId, snap, { weekStart, asOf: ctx.asOf })
  const slots: Slot[] = []
  const runId = ctx.runId ?? 'build'
  const now = ctx.now ?? `${weekStart}T00:00:00.000Z`
  const targets = snap.settings.level_targets[student.level] ?? {}
  const baseSettings = { level: student.level, plan_autonomy: student.plan_autonomy, ...Object.fromEntries(Object.entries(targets).map(([k, v]) => [`target_${k}`, v])) }
  const place = (partial: Parameters<typeof makeSlot>[1], o?: Offering, trace?: Partial<TracePart>) => {
    if (o && !take(ledger, o)) return null
    const s = makeSlot(planId, partial)
    slots.push(s)
    ctx.traces?.push(makeTrace('slot', studentId, s.id, { evidence_ids: trace?.evidence_ids ?? [], settings: { ...baseSettings, ...(trace?.settings ?? {}) }, edges: trace?.edges ?? [], candidates: trace?.candidates ?? [], decision: trace?.decision ?? partial.why }, runId, now))
    return s
  }
  const collides = (day: string, start: string, end: string) => collisionsFor(student, day, start, end, slots, snap).length > 0
  const lifeBlocks = (day: string, start: string, end: string) => student.life_constraints.some((c) => c.day === weekdayOf(day) && overlaps(c.start, c.end, start, end))

  // 1. Community every morning, lunch together.
  for (const day of dates) {
    for (const o of offerings.filter((x) => x.day === day && x.kind === 'community' && x.experience_type === 'WC')) {
      if (o.source_ref.startsWith('grp_') && o.source_ref !== student.community_group_id) continue
      if (!free(slots, day, o.start, o.end) || lifeBlocks(day, o.start, o.end)) continue
      place({ day, start: o.start, end: o.end, experience_type: 'WC', offering_id: o.id, entry: 'whole_group', why: en.why.community }, o, { decision: 'community every morning for everyone (placement step 1)' })
    }
  }

  // 2. Protected slots and whole-group events.
  for (const day of dates) {
    const wd = weekdayOf(day)
    for (const p of student.protected_slots.filter((x) => x.day === wd)) {
      if (!free(slots, day, p.start, p.end)) continue
      place({ day, start: p.start, end: p.end, experience_type: 'WC', offering_id: null, entry: 'protected', why: en.why.protectedTime }, undefined, { decision: 'protected time; the reason is never stored (step 2)' })
    }
    for (const o of offerings.filter((x) => x.day === day && x.kind === 'event' && x.experience_type !== 'RG')) {
      if (!free(slots, day, o.start, o.end) || collides(day, o.start, o.end) || lifeBlocks(day, o.start, o.end)) continue
      place({ day, start: o.start, end: o.end, experience_type: o.experience_type, offering_id: o.id, entry: 'whole_group', why: en.why.wholeGroup }, o, { decision: 'whole-group event (step 2)' })
    }
  }

  // 3. RW placements confirmed with partners.
  const futre = snap.futre.find((f) => f.student_id === studentId)
  const pathway = PATHWAYS.find((p) => p.id === futre?.cns.pathway_id)
  for (const oid of ctx.rwPlacements ?? []) {
    const o = offerings.find((x) => x.id === oid)
    if (!o || !free(slots, o.day, o.start, o.end)) continue
    const taught = o.outcomes_served[0] ? snap.outcomes.find((x) => x.id === o.outcomes_served[0]) : undefined
    const onPathway = pathway && (o.outcomes_served.some((x) => pathway.requires.includes(x)) || o.source_ref.startsWith('XT.'))
    const why = onPathway ? en.why.rwPathway(o.title, pathway.title) : en.why.rwPlacement(o.title, taught?.name ?? null)
    const edges: TraceEdge[] = onPathway ? [{ from: o.source_ref, to: pathway.id, type: 'leads_to', source: 'authored' }] : taught ? [{ from: o.source_ref, to: taught.id, type: 'teaches', source: 'authored' }] : []
    place({ day: o.day, start: o.start, end: o.end, experience_type: 'RW', offering_id: o.id, entry: 'assigned', why }, o, { decision: 'placement confirmed by the coordinator, kept across rebuilds (step 3)', edges })
  }

  // 4. Required, then 5. Recommended.
  const practiceBlocks = offerings.filter((o) => o.kind === 'practice' && o.experience_type === 'PF')
  const placedLessonsByDay = new Set<string>()
  const placeNeed = (n: Need, entry: 'required' | 'recommended'): boolean => {
    const lesson = n.lesson_id ? lessons.get(n.lesson_id) : null
    const tried: TracePart['candidates'] = []
    const needTrace = (chosen: Offering, decision: string): Partial<TracePart> => ({ evidence_ids: n.trace.evidence_ids.length ? n.trace.evidence_ids : n.evidence_id ? [n.evidence_id] : [], settings: n.trace.settings, edges: n.trace.edges, candidates: [...tried, { id: chosen.id, label: `${chosen.title} ${chosen.day} ${chosen.start}`, score: null, lost_because: null }, ...n.trace.candidates].slice(0, 12), decision })
    // A workshop for the lesson, if one exists with room and no collision.
    if (lesson) {
      const wsAll = offerings.filter((o) => o.kind === 'workshop' && o.lesson_id === lesson.id)
      for (const o of wsAll) {
        if (!hasRoom(ledger, o)) tried.push({ id: o.id, label: `${o.title} ${o.day} ${o.start}`, score: null, lost_because: 'full' })
        else if (!free(slots, o.day, o.start, o.end) || collides(o.day, o.start, o.end)) tried.push({ id: o.id, label: `${o.title} ${o.day} ${o.start}`, score: null, lost_because: 'collides with something already placed' })
      }
      const ws = wsAll.filter((o) => hasRoom(ledger, o)).find((o) => free(slots, o.day, o.start, o.end) && !collides(o.day, o.start, o.end) && !placedLessonsByDay.has(`${lesson.id}:${o.day}`))
      if (ws) {
        placedLessonsByDay.add(`${lesson.id}:${ws.day}`)
        return Boolean(place({ day: ws.day, start: ws.start, end: ws.end, experience_type: 'DI', offering_id: ws.id, entry, why: n.why, evidence_id: n.evidence_id, bring: null }, ws, needTrace(ws, `${entry}: a workshop for ${lesson.title} had room (step ${entry === 'required' ? 4 : 5})`)))
      }
      if (!wsAll.length) tried.push({ id: 'workshop', label: `a workshop for ${lesson.title}`, score: null, lost_because: 'none published this week' })
      const conf = offerings
        .filter((o) => o.kind === 'conference' && o.lesson_id === lesson.id && hasRoom(ledger, o))
        .find((o) => free(slots, o.day, o.start, o.end) && !collides(o.day, o.start, o.end))
      if (conf) return Boolean(place({ day: conf.day, start: conf.start, end: conf.end, experience_type: 'PF', offering_id: conf.id, entry, why: n.why, evidence_id: n.evidence_id }, conf, needTrace(conf, `${entry}: a 1:1 conference for ${lesson.title} had room`)))
    }
    // A published offering that serves the outcome (seminar, studio, practice).
    const serving = offerings
      .filter((o) => o.kind !== 'community' && o.kind !== 'event' && o.kind !== 'assessment' && o.kind !== 'partner_slot' && o.entry !== 'invited' && (o.outcomes_served.includes(n.outcome_id) || (o.lesson_id && lesson && o.lesson_id === lesson.id)) && hasRoom(ledger, o))
      .find((o) => free(slots, o.day, o.start, o.end) && !collides(o.day, o.start, o.end))
    if (serving) return Boolean(place({ day: serving.day, start: serving.start, end: serving.end, experience_type: serving.experience_type, offering_id: serving.id, entry, why: n.why, evidence_id: n.evidence_id }, serving, needTrace(serving, `${entry}: ${serving.title} serves ${n.outcome_name}`)))
    if (!lesson) tried.push({ id: 'serving', label: `a session serving ${n.outcome_name}`, score: null, lost_because: 'none with room this week' })
    // Practice block in the hub: the earliest free one for Required; for Recommended, from midweek on so it follows the Required work.
    const ordered = entry === 'recommended' ? [...practiceBlocks.filter((o) => o.day >= dates[2]), ...practiceBlocks.filter((o) => o.day < dates[2])] : practiceBlocks
    const pb = ordered.filter((o) => hasRoom(ledger, o)).find((o) => free(slots, o.day, o.start, o.end) && !collides(o.day, o.start, o.end))
    if (pb) {
      const why = n.kind === 'required' && n.family === 'content' && n.value !== null && n.evidence_ref ? en.why.requiredContentPractice(n.outcome_name, n.value, n.evidence_ref) : n.why
      return Boolean(place({ day: pb.day, start: pb.start, end: pb.end, experience_type: 'PF', offering_id: pb.id, entry, why, evidence_id: n.evidence_id }, pb, needTrace(pb, `${entry}: practice block in the hub, the ${entry === 'recommended' ? 'first from midweek' : 'earliest'} with room`)))
    }
    return false
  }
  for (const n of needs.filter((x) => x.kind === 'required')) placeNeed(n, 'required')
  let rec = 0
  for (const n of needs.filter((x) => x.kind === 'recommended')) {
    if (rec >= 2) break
    if (placeNeed(n, 'recommended')) rec++
  }

  // 6. Readiness: an assessment booked for this student.
  for (const n of needs.filter((x) => x.kind === 'readiness')) {
    const a = offerings.find((o) => o.kind === 'assessment' && o.source_ref === `assess:${studentId}` && o.outcomes_served.includes(n.outcome_id) && hasRoom(ledger, o))
    if (a && free(slots, a.day, a.start, a.end)) place({ day: a.day, start: a.start, end: a.end, experience_type: a.experience_type, offering_id: a.id, entry: 'assigned', why: en.why.assessment(n.outcome_name, n.evidence_ref ?? 'your latest strong scores'), evidence_id: n.evidence_id, bring: 'The evidence you want in the room' }, a, { evidence_ids: n.trace.evidence_ids, settings: n.trace.settings, candidates: n.trace.candidates, decision: 'readiness: the mentor booked this assessment (step 6)' })
  }

  // 7. Reflection at the end of every day.
  for (const day of dates) {
    const r = offerings.find((o) => o.day === day && o.experience_type === 'RG' && o.kind === 'event')
    if (r && free(slots, day, r.start, r.end) && !lifeBlocks(day, r.start, r.end)) place({ day, start: r.start, end: r.end, experience_type: 'RG', offering_id: r.id, entry: 'whole_group', why: en.why.reflection }, r, { decision: 'reflection at the end of every day (step 7)' })
  }

  // 8. Open slots: every remaining block, for the student to fill per plan_autonomy.
  for (const day of dates) {
    for (const b of BLOCKS) {
      if (!free(slots, day, b.start, b.end)) continue
      if (student.life_constraints.some((c) => c.day === weekdayOf(day) && overlaps(c.start, c.end, b.start, b.end))) continue
      place({ day, start: b.start, end: b.end, experience_type: 'IW', offering_id: null, entry: 'chosen', why: en.why.openSlot }, undefined, { decision: `open slot for the student to fill per plan_autonomy ${student.plan_autonomy} (step 8)` })
    }
  }

  slots.sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day)))
  return {
    id: planId,
    student_id: studentId,
    week_start: weekStart,
    slots,
    goals: ctx.goals ?? [],
    focus_habits: ctx.focusHabits ?? [],
    built_by: 'engine',
    confirmed_by: null,
    published_at: null,
    version: ctx.version ?? 1,
  }
}

/** Options for one open slot, honoring the ledger. */
export function optionsForSlot(plan: Plan, slot: Slot, student: Student, snap: Sandbox, ledger: CapacityLedger, needs?: Need[]): RankedOption[] {
  const n = needs ?? computeNeeds(student.id, snap, { weekStart: plan.week_start })
  // The window is this open slot plus any open slots that follow it without a gap, so longer offerings fit.
  let end = slot.end
  const open = plan.slots.filter((s) => s.day === slot.day && s.offering_id === null && s.entry === 'chosen' && s.status === 'planned').sort((a, b) => a.start.localeCompare(b.start))
  for (const s of open) if (s.start === end) end = s.end
  return rankOptions(snap, { student, plan: { goals: plan.goals, slots: plan.slots.filter((s) => s.id !== slot.id) }, needs: n, ledger, day: slot.day, start: slot.start, end })
}

/** Fill an open slot with a chosen offering; a longer offering absorbs the open slots it spans. */
export function chooseForSlot(plan: Plan, slot: Slot, offering: Offering, ledger: CapacityLedger, why = en.why.chosen, traces?: TraceSink, options?: RankedOption[], run: { runId?: string; now?: string } = {}): Plan {
  if (!take(ledger, offering)) return plan
  const picked = (options ?? []).find((r) => r.offering.id === offering.id)
  traces?.push(makeTrace('slot', plan.student_id, slot.id, { evidence_ids: [], settings: { plan_autonomy: 'student pick' }, edges: picked?.edges ?? [], candidates: (options ?? []).map((r) => ({ id: r.offering.id, label: r.offering.title, score: r.score, lost_because: r.offering.id === offering.id ? null : 'the student picked another' })), decision: `the student chose ${offering.title}${(options ?? []).length ? ` from ${(options ?? []).length} ranked options` : ''}` }, run.runId ?? 'pick', run.now ?? new Date().toISOString()))
  const absorbed = plan.slots.filter((s) => s.id !== slot.id && s.day === offering.day && s.offering_id === null && s.entry === 'chosen' && overlaps(s.start, s.end, offering.start, offering.end))
  const slots = plan.slots
    .filter((s) => !absorbed.includes(s))
    .map((s) => (s.id === slot.id ? { ...s, start: offering.start, end: offering.end, experience_type: offering.experience_type, offering_id: offering.id, entry: 'chosen' as const, why } : s))
  return { ...plan, slots }
}

/** Build every student's draft plan against one shared ledger (Spec 4 step 4). */
export function buildAllWeeks(snap: Sandbox, ctx: { weekStart?: string; asOf?: string; rwPlacements?: Map<string, string[]>; goals?: Map<string, Plan['goals']>; focusHabits?: Map<string, string[]>; runId?: string; now?: string } = {}): { plans: Plan[]; ledger: CapacityLedger; traces: TraceSink } {
  const ledger = newLedger()
  const weekStart = ctx.weekStart ?? snap.meta.week_start
  const plans: Plan[] = []
  const traces: TraceSink = []
  for (const s of snap.students) {
    plans.push(
      buildWeek(s.id, snap, {
        weekStart,
        asOf: ctx.asOf,
        ledger,
        rwPlacements: ctx.rwPlacements?.get(s.id) ?? [],
        goals: ctx.goals?.get(s.id) ?? [],
        focusHabits: ctx.focusHabits?.get(s.id) ?? [],
        traces,
        runId: ctx.runId ?? `build_${weekStart}`,
        now: ctx.now,
      }),
    )
  }
  return { plans, ledger, traces }
}

export interface PlanViolation {
  student_id: string
  kind: 'overlap' | 'protected' | 'life' | 'no_community' | 'no_reflection' | 'capacity'
  detail: string
}

/** Spec 6 acceptance: no capacity breaches, no protected overlaps, community and reflection every day. */
export function validatePlans(plans: Plan[], snap: Sandbox): PlanViolation[] {
  const v: PlanViolation[] = []
  const students = byId(snap.students)
  const fill = new Map<string, number>()
  for (const p of plans) {
    const st = students.get(p.student_id)
    if (!st) continue
    const live = p.slots.filter((s) => s.status !== 'cancelled' && s.status !== 'moved')
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i]
        const b = live[j]
        if (a.day === b.day && overlaps(a.start, a.end, b.start, b.end)) v.push({ student_id: p.student_id, kind: 'overlap', detail: `${a.id} ${b.id}` })
      }
      const s = live[i]
      const wd = weekdayOf(s.day)
      if (s.entry !== 'protected' && st.protected_slots.some((x) => x.day === wd && overlaps(x.start, x.end, s.start, s.end))) v.push({ student_id: p.student_id, kind: 'protected', detail: s.id })
      if (s.offering_id && st.life_constraints.some((x) => x.day === wd && overlaps(x.start, x.end, s.start, s.end))) v.push({ student_id: p.student_id, kind: 'life', detail: s.id })
      if (s.offering_id) fill.set(s.offering_id, (fill.get(s.offering_id) ?? 0) + 1)
    }
    for (const day of weekDates(p.week_start)) {
      const wd = weekdayOf(day)
      const blocked = (start: string, end: string) => st.life_constraints.some((c) => c.day === wd && overlaps(c.start, c.end, start, end))
      if (!live.some((s) => s.day === day && s.experience_type === 'WC' && s.entry === 'whole_group') && !blocked('08:30', '09:15')) v.push({ student_id: p.student_id, kind: 'no_community', detail: day })
      if (!live.some((s) => s.day === day && s.experience_type === 'RG') && !blocked('15:00', '15:30')) v.push({ student_id: p.student_id, kind: 'no_reflection', detail: day })
    }
  }
  const offerings = byId(snap.offerings)
  for (const [oid, n] of fill) {
    const o = offerings.get(oid)
    if (o && n > o.capacity_max) v.push({ student_id: '*', kind: 'capacity', detail: `${oid} ${n}/${o.capacity_max}` })
  }
  return v
}
