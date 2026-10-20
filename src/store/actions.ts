/** Writes the screens make. Each one goes through the repository so a real API can replace the store. */
import type { Evidence, Offering, Plan, Slot, Student, Touchpoint } from '@/model'
import { appStore, repos } from './index'
import { adjustOvernight, buildAllWeeks, chooseForSlot, newLedger, offeringFromProposal, type WorkshopProposal } from '@/engine'
import { useUi } from './ui'

let counter = 0
export const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(++counter).toString(36)}`
export const nowIso = () => new Date().toISOString()

export function snapshot() {
  return repos.snapshot()
}

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
  const next = chooseForSlot(plan, slot, offering, ledger)
  repos.collection('plans').upsert({ ...next, version: plan.published_at ? plan.version + 1 : plan.version })
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
  const snap = snapshot()
  const offering = offeringFromProposal(p, snap, overrides)
  repos.collection('offerings').upsert(offering)
  const ledger = newLedger(snap, snap.meta.week_start)
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
    const value = snap.evidence.find((e) => e.id === evidenceId)?.value
    const why = typeof value === 'number' ? `Your ${outcome?.name ?? p.lesson_title} score is ${Math.round(value)}; this workshop is where it moves.` : `${p.lesson_title} is where this moves.`
    const slot: Slot = { id: `${plan.id}_ws_${Date.now().toString(36)}_${sid}`, plan_id: plan.id, day: offering.day, start: offering.start, end: offering.end, experience_type: offering.experience_type, offering_id: offering.id, entry: 'required', why, goal: null, status: plan.confirmed_by ? 'confirmed' : 'planned', rating: null, bring: null, evidence_id: evidenceId, added_at: nowIso() }
    repos.collection('plans').upsert({ ...plan, version: plan.version + 1, slots: [...plan.slots.map((s) => (overlapping.includes(s) ? { ...s, status: 'moved' as const } : s)), slot].sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day))) })
    const asg = snap.assignments.find((a) => a.student_id === sid && a.lesson_id === p.lesson_id)
    if (asg) repos.collection('assignments').upsert({ ...asg, mode: 'workshop' })
  }
  return offering
}

/** "I'm out today": cancel the adult's offerings for the day; overnight moves the displaced students. */
export function adultOutToday(adultId: string, day: string) {
  const snap = snapshot()
  for (const o of snap.offerings) {
    if (o.day === day && o.adult_ids.includes(adultId) && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community') repos.collection('offerings').upsert({ ...o, status: 'cancelled' })
  }
  useUi.getState().setOutToday(adultId, day)
  return runOvernight(`${day}T00:00:00.000Z`, day === snap.meta.today ? snap.meta.today : day, true)
}

/** Run overnight adjustments and apply the new plan versions. */
export function runOvernight(since?: string, today?: string, sameDay = false) {
  const snap = snapshot()
  const t = today ?? snap.meta.today
  const { plans, moves } = adjustOvernight(snap, { since: since ?? snap.meta.generated_at, today: sameDay ? shiftBack(t) : t, now: nowIso() })
  for (const p of plans) repos.collection('plans').upsert(p)
  useUi.getState().setMoves(moves)
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
  const { plans } = buildAllWeeks(snap, { weekStart, rwPlacements: rw, goals, focusHabits: habits })
  const existing = new Map(snap.plans.filter((x) => x.week_start === weekStart).map((p) => [p.student_id, p]))
  for (const p of plans) {
    const prev = existing.get(p.student_id)
    repos.collection('plans').upsert({ ...p, id: prev?.id ?? p.id, slots: p.slots.map((s) => ({ ...s, plan_id: prev?.id ?? p.id, id: s.id.replace(p.id, prev?.id ?? p.id) })), version: (prev?.version ?? 0) + 1, published_at: publish ? nowIso() : null, confirmed_by: null })
  }
  useUi.getState().setLastBuild(nowIso(), plans.length)
  return plans.length
}

export function patchSettings(patch: Record<string, unknown>, by: string) {
  const before = appStore.getState().settings
  for (const [k, v] of Object.entries(patch)) useUi.getState().logSetting({ at: nowIso(), by, key: k, from: JSON.stringify((before as Record<string, unknown>)[k]), to: JSON.stringify(v) })
  appStore.getState().patchSettings(patch as Partial<typeof before>, by)
}
