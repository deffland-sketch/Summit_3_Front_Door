/** Writes the screens make. Each one goes through the repository so a real API can replace the store. */
import type { EngineTrace, Evidence, Offering, Plan, Slot, Student, Touchpoint, TracePart } from '@/model'
import { appStore, repos } from './index'
import { adjustOvernight, buildAllWeeks, chooseForSlot, makeTrace, newLedger, offeringFromProposal, optionsForSlot, type TraceSink, type WorkshopProposal } from '@/engine'
import { useUi } from './ui'
import { en } from '@/copy/en'
import { shortDate } from '@/lib/time'
import { PATHWAYS } from '@/graph/authored/pathways'

let counter = 0
export const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(++counter).toString(36)}`
export const nowIso = () => new Date().toISOString()

export function snapshot() {
  return repos.snapshot()
}

/** Store the traces of an engine run (Spec 6 Traceability). Append-only; the newest trace per ref wins on read. */
export function storeTraces(traces: EngineTrace[]) {
  if (traces.length) repos.collection('traces').upsertMany(traces)
}

/** Every engine run leaves a gathering log line: what it read, what it wrote, how long it took (Spec 5 Evidence Log). */
export function logRun(run: 'weekly_build' | 'overnight' | 'out_today' | 'accept_proposal' | 'choose', read: string, wrote: string, ms: number, rows: number) {
  repos.collection('gathering_log').upsert({ id: nextId('run'), source: `engine:${run}`, pulled_at: nowIso(), received: rows, unmapped: 0, refused: 0, stale: false, message: `Read ${read}. Wrote ${wrote}. ${Math.max(1, Math.round(ms))} ms.` })
}
function pathwayName(snap: ReturnType<typeof snapshot>, studentId: string): string {
  const f = snap.futre.find((x) => x.student_id === studentId)
  return PATHWAYS.find((p) => p.id === f?.cns.pathway_id)?.title ?? 'pathway'
}
const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export function updateSlot(planId: string, slotId: string, patch: Partial<Slot>) {
  const plan = repos.collection('plans').get(planId)
  if (!plan) return
  repos.collection('plans').upsert({ ...plan, slots: plan.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)) })
}

export function updatePlan(planId: string, patch: Partial<Plan>) {
  const plan = repos.collection('plans').get(planId)
  if (!plan) return
  repos.collection('plans').upsert({ ...plan, ...patch })
}

export function updateStudent(studentId: string, patch: Partial<Student>) {
  const s = repos.collection('students').get(studentId)
  if (!s) return
  repos.collection('students').upsert({ ...s, ...patch })
}

export function addEvidence(e: Omit<Evidence, 'id' | 'recorded_at'> & Partial<Pick<Evidence, 'recorded_at'>>): Evidence {
  const row: Evidence = { id: nextId('ev'), recorded_at: nowIso(), ...e }
  repos.collection('evidence').upsert(row)
  return row
}

export function addTouchpoint(t: Omit<Touchpoint, 'id'>): Touchpoint {
  const row: Touchpoint = { id: nextId('tp'), ...t }
  repos.collection('touchpoints').upsert(row)
  return row
}

export function updateTouchpoint(id: string, patch: Partial<Touchpoint>) {
  const t = repos.collection('touchpoints').get(id)
  if (t) repos.collection('touchpoints').upsert({ ...t, ...patch })
}

export function upsertOffering(o: Offering) {
  repos.collection('offerings').upsert(o)
}

/** A student fills an open slot. */
export function chooseOffering(planId: string, slotId: string, offering: Offering) {
  const snap = snapshot()
  const plan = snap.plans.find((p) => p.id === planId)
  const slot = plan?.slots.find((s) => s.id === slotId)
  if (!plan || !slot) return
  const ledger = newLedger(snap, plan.week_start)
  const student = snap.students.find((s) => s.id === plan.student_id)
  const traces: TraceSink = []
  const options = student ? optionsForSlot(plan, slot, student, snap, ledger) : []
  const picked = options.find((r) => r.offering.id === offering.id)
  const why = picked?.gap ? en.why.chosenGap(offering.title, picked.gap, pathwayName(snap, plan.student_id)) : picked?.pathway ? en.why.chosenNear(offering.title, picked.pathway) : undefined
  const next = chooseForSlot(plan, slot, offering, ledger, why, traces, options)
  repos.collection('plans').upsert({ ...next, version: plan.published_at ? plan.version + 1 : plan.version })
  storeTraces(traces)
}

/** A student swaps a Recommended slot for another offering with a reason the mentor sees. */
export function swapSlot(planId: string, slotId: string, offering: Offering, reason: string) {
  const snap = snapshot()
  const plan = snap.plans.find((p) => p.id === planId)
  const slot = plan?.slots.find((s) => s.id === slotId)
  if (!plan || !slot) return
  const ledger = newLedger(snap, plan.week_start)
  const n = ledger.fill.get(offering.id) ?? 0
  if (n >= offering.capacity_max) return
  repos.collection('plans').upsert({
    ...plan,
    version: plan.version + 1,
    slots: plan.slots.map((s) => (s.id === slotId ? { ...s, start: offering.start, end: offering.end, experience_type: offering.experience_type, offering_id: offering.id, entry: 'chosen' as const, why: `You chose this. ${reason}` } : s)),
  })
}

/** The mentor confirms a plan: it is published and confirmed. */
export function confirmPlan(planId: string, mentorId: string) {
  const plan = repos.collection('plans').get(planId)
  if (!plan) return
  repos.collection('plans').upsert({ ...plan, confirmed_by: mentorId, published_at: plan.published_at ?? nowIso(), slots: plan.slots.map((s) => (s.status === 'planned' ? { ...s, status: 'confirmed' as const } : s)) })
}

/** Accept a proposal: publish the offering and place each student into it. */
export function acceptProposal(p: WorkshopProposal, overrides: Partial<Offering> = {}) {
  const t0 = clock()
  const snap = snapshot()
  const offering = offeringFromProposal(p, snap, overrides)
  repos.collection('offerings').upsert(offering)
  const ledger = newLedger(snap, snap.meta.week_start)
  const runId = `accept_${offering.id}`
  const at = nowIso()
  const traces: EngineTrace[] = [makeTrace('proposal', p.lesson_id, offering.id, { ...p.trace, decision: `${p.trace.decision} Accepted by the content expert${overrides.day ? ` at a changed time, ${offering.day} ${offering.start}` : ''}.` }, runId, at)]
  let placed = 0
  for (const sid of p.student_ids) {
    const plan = snap.plans.find((x) => x.student_id === sid && x.week_start === snap.meta.week_start)
    if (!plan) continue
    const need = p.student_ids.includes(sid)
    if (!need) continue
    const overlapping = plan.slots.filter((s) => s.day === offering.day && (s.status === 'planned' || s.status === 'confirmed') && s.start < offering.end && offering.start < s.end)
    if (overlapping.some((s) => s.entry === 'protected' || s.experience_type === 'RW' || s.entry === 'whole_group' || s.entry === 'required')) continue
    if ((ledger.fill.get(offering.id) ?? 0) >= offering.capacity_max) break
    ledger.fill.set(offering.id, (ledger.fill.get(offering.id) ?? 0) + 1)
    const evidenceId = snap.evidence.filter((e) => e.student_id === sid && e.source_ref === p.lesson_id).sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0]?.id ?? null
    const outcome = snap.outcomes.find((o) => o.id === offering.outcomes_served[0])
    const row = snap.evidence.find((e) => e.id === evidenceId)
    const why = row && typeof row.value === 'number' ? en.why.requiredContent(outcome?.name ?? p.lesson_title, Math.round(row.value), en.why.evidenceRef(row.source, shortDate(row.recorded_at))) : en.why.acceptedWorkshop(p.lesson_title, p.rationale)
    const slot: Slot = { id: `${plan.id}_ws_${Date.now().toString(36)}_${sid}`, plan_id: plan.id, day: offering.day, start: offering.start, end: offering.end, experience_type: offering.experience_type, offering_id: offering.id, entry: 'required', why, goal: null, status: plan.confirmed_by ? 'confirmed' : 'planned', rating: null, bring: null, evidence_id: evidenceId, added_at: nowIso() }
    repos.collection('plans').upsert({ ...plan, version: plan.version + 1, slots: [...plan.slots.map((s) => (overlapping.includes(s) ? { ...s, status: 'moved' as const } : s)), slot].sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day))) })
    const slotTrace: TracePart = { evidence_ids: evidenceId ? [evidenceId] : [], settings: { grouping_threshold: snap.settings.grouping_threshold, workshop_max: snap.settings.workshop_size.max }, edges: p.trace.edges.filter((e) => e.from === p.lesson_id || e.to === p.lesson_id), candidates: overlapping.map((s) => ({ id: s.id, label: `${s.experience_type} ${s.day} ${s.start}`, score: null, lost_because: 'moved aside for the accepted workshop' })), decision: `Placed in ${offering.title} on ${offering.day} ${offering.start} because the expert accepted the proposal for ${p.lesson_title}.` }
    traces.push(makeTrace('slot', sid, slot.id, slotTrace, runId, at))
    placed++
    const asg = snap.assignments.find((a) => a.student_id === sid && a.lesson_id === p.lesson_id)
    if (asg) repos.collection('assignments').upsert({ ...asg, mode: 'workshop' })
  }
  storeTraces(traces)
  logRun('accept_proposal', `one proposal for ${p.lesson_title} with ${p.student_ids.length} students and ${p.trace.evidence_ids.length} evidence rows`, `one offering and ${placed} Required slots`, clock() - t0, p.trace.evidence_ids.length)
  return offering
}

/** "I'm out today": cancel the adult's offerings for the day; overnight moves the displaced students. */
export function adultOutToday(adultId: string, day: string) {
  const t0 = clock()
  const snap = snapshot()
  let cancelled = 0
  for (const o of snap.offerings) {
    if (o.day === day && o.adult_ids.includes(adultId) && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community') {
      repos.collection('offerings').upsert({ ...o, status: 'cancelled' })
      cancelled++
    }
  }
  useUi.getState().setOutToday(adultId, day)
  const moves = runOvernight(`${day}T00:00:00.000Z`, day === snap.meta.today ? snap.meta.today : day, true, `out_${adultId}_${day}`, true)
  logRun('out_today', `${cancelled} offerings led by ${adultId} on ${day}`, `${cancelled} cancellations and ${moves.length} moves`, clock() - t0, cancelled)
  return moves
}

/** Run overnight adjustments and apply the new plan versions. */
export function runOvernight(since?: string, today?: string, sameDay = false, runId?: string, quiet = false) {
  const t0 = clock()
  const snap = snapshot()
  const t = today ?? snap.meta.today
  const sinceAt = since ?? snap.meta.generated_at
  const at = nowIso()
  const { plans, moves } = adjustOvernight(snap, { since: sinceAt, today: sameDay ? shiftBack(t) : t, now: at })
  for (const p of plans) repos.collection('plans').upsert(p)
  useUi.getState().setMoves(moves)
  const id = runId ?? `overnight_${at.replace(/\D/g, '').slice(0, 14)}`
  storeTraces(moves.map((m) => makeTrace('move', m.student_id, m.slot.id, m.trace, id, at)))
  const newRows = snap.evidence.filter((e) => e.recorded_at > sinceAt).length
  if (!quiet) logRun('overnight', `${newRows} evidence rows since ${sinceAt.slice(0, 16).replace('T', ' ')} and ${snap.plans.filter((p) => p.week_start === snap.meta.week_start).length} plans`, `${plans.length} plan versions and ${moves.length} moves`, clock() - t0, newRows)
  return moves
}
function shiftBack(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** The architect's weekly build: rebuild every draft plan for the week, keeping RW placements and goals. */
export function runWeeklyBuild(publish = false) {
  const snap = snapshot()
  const weekStart = snap.meta.week_start
  const rw = new Map<string, string[]>()
  const goals = new Map<string, Plan['goals']>()
  const habits = new Map<string, string[]>()
  for (const p of snap.plans.filter((x) => x.week_start === weekStart)) {
    rw.set(p.student_id, p.slots.filter((s) => s.experience_type === 'RW' && s.offering_id && s.status !== 'cancelled').map((s) => s.offering_id!))
    goals.set(p.student_id, p.goals)
    habits.set(p.student_id, p.focus_habits)
  }
  const t0 = clock()
  const at = nowIso()
  const runId = `build_${weekStart}_${at.replace(/\D/g, '').slice(0, 14)}`
  const { plans, traces } = buildAllWeeks(snap, { weekStart, rwPlacements: rw, goals, focusHabits: habits, runId, now: at })
  const existing = new Map(snap.plans.filter((x) => x.week_start === weekStart).map((p) => [p.student_id, p]))
  const planIdFor = new Map(plans.map((p) => [p.id, existing.get(p.student_id)?.id ?? p.id]))
  let placed = 0
  for (const p of plans) {
    const prev = existing.get(p.student_id)
    placed += p.slots.length
    repos.collection('plans').upsert({ ...p, id: prev?.id ?? p.id, slots: p.slots.map((s) => ({ ...s, plan_id: prev?.id ?? p.id, id: s.id.replace(p.id, prev?.id ?? p.id) })), version: (prev?.version ?? 0) + 1, published_at: publish ? nowIso() : null, confirmed_by: null })
  }
  // Slot ids were rewritten onto the existing plan ids; the traces follow.
  storeTraces(traces.map((t) => {
    const from = [...planIdFor.keys()].find((pid) => t.ref_id.startsWith(pid))
    return from ? { ...t, ref_id: t.ref_id.replace(from, planIdFor.get(from)!) } : t
  }))
  logRun('weekly_build', `${snap.evidence.length} evidence rows, ${snap.offerings.filter((o) => o.status === 'published').length} published offerings, and ${snap.students.length} students`, `${plans.length} draft plans with ${placed} slots and ${traces.length} traces`, clock() - t0, snap.evidence.length)
  useUi.getState().setLastBuild(nowIso(), plans.length)
  return plans.length
}

export function patchSettings(patch: Record<string, unknown>, by: string) {
  const before = appStore.getState().settings
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'level_targets') {
      // Log each changed cell, not the whole table.
      const next = v as Record<string, Record<string, number>>
      for (const [level, row] of Object.entries(next)) for (const [type, value] of Object.entries(row)) {
        const prev = before.level_targets[level as keyof typeof before.level_targets]?.[type as 'DI']
        if (prev !== value) useUi.getState().logSetting({ at: nowIso(), by, key: `level_targets.${level}.${type}`, from: JSON.stringify(prev), to: JSON.stringify(value) })
      }
      continue
    }
    useUi.getState().logSetting({ at: nowIso(), by, key: k, from: JSON.stringify((before as Record<string, unknown>)[k]), to: JSON.stringify(v) })
  }
  appStore.getState().patchSettings(patch as Partial<typeof before>, by)
}
