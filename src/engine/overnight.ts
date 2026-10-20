import type { Plan, Sandbox, Slot, TracePart } from '@/model'
import { en } from '@/copy/en'
import { byId } from '@/lib'
import { overlaps, shiftDate, weekDates } from '@/lib/time'
import { needs as computeNeeds } from './needs'
import { newLedger, optionsForSlot, slotId } from './build'
import type { CapacityLedger, OvernightMove } from './types'

export interface OvernightContext {
  /** Evidence recorded after this moment counts as new. */
  since: string
  /** The night runs after this day; moves land on the next school day or later. */
  today?: string
  weekStart?: string
  now?: string
}

function covered(plan: Plan, lessonId: string | null, outcomeId: string, snap: Sandbox, fromDay: string): boolean {
  return plan.slots.some((s) => {
    if (s.status === 'cancelled' || s.status === 'moved' || s.day < fromDay) return false
    if (s.entry !== 'required' && s.entry !== 'recommended') return false
    const o = s.offering_id ? snap.offerings.find((x) => x.id === s.offering_id) : null
    return (lessonId && o?.lesson_id === lessonId) || o?.outcomes_served.includes(outcomeId) || false
  })
}

/** Small overnight adjustments only; the week holds (Spec 6). Returns new plan versions and the move list. */
export function adjustOvernight(snap: Sandbox, ctx: OvernightContext): { plans: Plan[]; moves: OvernightMove[] } {
  const weekStart = ctx.weekStart ?? snap.meta.week_start
  const today = ctx.today ?? snap.meta.today
  const now = ctx.now ?? `${today}T23:30:00.000Z`
  const tomorrow = shiftDate(today, 1)
  const dates = weekDates(weekStart)
  const settings = snap.settings
  const ledger: CapacityLedger = newLedger(snap, weekStart)
  const offerings = byId(snap.offerings)
  const moves: OvernightMove[] = []
  const plans: Plan[] = []
  if (!settings.overnight_adjustments) return { plans: [], moves: [] }

  const newEvidence = snap.evidence.filter((e) => e.recorded_at > ctx.since)
  const newEvidenceIds = new Set(newEvidence.map((e) => e.id))
  const newEvidenceStudents = new Set(newEvidence.map((e) => e.student_id))
  const cancelledIds = new Set(snap.offerings.filter((o) => o.status === 'cancelled').map((o) => o.id))

  for (const student of snap.students) {
    const plan = snap.plans.find((p) => p.student_id === student.id && p.week_start === weekStart)
    if (!plan) continue
    let next: Plan = { ...plan, slots: plan.slots.map((s) => ({ ...s })) }
    let count = 0
    const can = () => count < settings.max_overnight_moves
    const futureDays = dates.filter((d) => d >= tomorrow)
    const live = (s: Slot) => s.status === 'planned' || s.status === 'confirmed'
    const openSlot = (day?: string) => next.slots.find((s) => s.offering_id === null && s.entry === 'chosen' && live(s) && s.day >= tomorrow && (!day || s.day === day))
    const displaceable = () => next.slots.find((s) => s.entry === 'chosen' && s.offering_id && live(s) && s.day >= tomorrow)

    // Students moved out of cancelled offerings.
    for (const s of next.slots) {
      if (!can()) break
      if (!s.offering_id || !cancelledIds.has(s.offering_id) || s.day < tomorrow || !live(s)) continue
      const o = offerings.get(s.offering_id)!
      s.status = 'cancelled'
      const replacement: Slot = {
        ...s,
        id: slotId(plan.id),
        offering_id: null,
        entry: 'chosen',
        status: 'planned',
        why: en.why.movedOut(o.title),
        added_at: now,
        evidence_id: null,
      }
      const options = optionsForSlot(next, replacement, student, snap, ledger).filter((r) => !r.reasons.includes('collides'))
      if (options[0]) {
        const ro = options[0].offering
        replacement.offering_id = ro.id
        replacement.experience_type = ro.experience_type
        replacement.start = ro.start
        replacement.end = ro.end
        ledger.fill.set(ro.id, (ledger.fill.get(ro.id) ?? 0) + 1)
        replacement.entry = o.entry === 'required' ? 'required' : 'chosen'
        replacement.why = en.why.movedTo(o.title, ro.title, options[0].builds[0] ?? null)
      }
      next = { ...next, slots: [...next.slots, replacement] }
      const trace: TracePart = { evidence_ids: [], settings: { max_overnight_moves: settings.max_overnight_moves, cancelled_offering: o.id }, edges: [], candidates: options.slice(0, 5).map((r, i) => ({ id: r.offering.id, label: r.offering.title, score: r.score, lost_because: i === 0 ? null : 'ranked lower' })), decision: `${o.title} was cancelled; moved to ${options[0]?.offering.title ?? 'an open slot'}` }
      moves.push({ student_id: student.id, kind: 'moved', slot: replacement, replaced_slot_id: s.id, why: replacement.why, trace })
      count++
    }

    // New Required needs from new evidence.
    if (newEvidenceStudents.has(student.id)) {
      const ns = computeNeeds(student.id, snap, { weekStart, asOf: today })
      for (const n of ns) {
        if (!can()) break
        // Only a need the new evidence created is acted on; needs the week already answered stay as planned.
        if (n.kind === 'required' && n.evidence_id && newEvidenceIds.has(n.evidence_id) && !covered(next, n.lesson_id, n.outcome_id, snap, tomorrow)) {
          const why = n.family === 'content' && n.value !== null && n.evidence_ref ? en.why.newRequired(n.outcome_name, n.value, n.evidence_ref) : n.why
          // A workshop for the lesson on a later day with room, else a practice block in an open slot.
          const ws = n.lesson_id
            ? snap.offerings.find((o) => o.status === 'published' && o.kind === 'workshop' && o.lesson_id === n.lesson_id && o.day >= tomorrow && (ledger.fill.get(o.id) ?? 0) < o.capacity_max && !next.slots.some((s) => s.day === o.day && live(s) && overlaps(s.start, s.end, o.start, o.end) && s.entry !== 'chosen'))
            : undefined
          let target: Slot | undefined
          if (ws) {
            const overlapping = next.slots.filter((s) => s.day === ws.day && live(s) && overlaps(s.start, s.end, ws.start, ws.end))
            for (const s of overlapping) s.status = 'moved'
            target = { id: slotId(plan.id), plan_id: plan.id, day: ws.day, start: ws.start, end: ws.end, experience_type: 'DI', offering_id: ws.id, entry: 'required', why, goal: null, status: 'planned', rating: null, bring: null, evidence_id: n.evidence_id, added_at: now }
            ledger.fill.set(ws.id, (ledger.fill.get(ws.id) ?? 0) + 1)
            next = { ...next, slots: [...next.slots, target] }
            moves.push({ student_id: student.id, kind: 'added', slot: target, replaced_slot_id: overlapping[0]?.id ?? null, why, trace: { ...n.trace, settings: { ...n.trace.settings, max_overnight_moves: settings.max_overnight_moves }, candidates: [{ id: ws.id, label: `${ws.title} on ${ws.day}`, score: null, lost_because: null }, ...n.trace.candidates], decision: `new Required need; a workshop for the lesson had room on ${ws.day}` } })
            count++
            continue
          }
          const slot = openSlot() ?? displaceable()
          if (!slot) continue
          const pb = snap.offerings.find((o) => o.status === 'published' && o.kind === 'practice' && o.day === slot.day && o.start === slot.start && (ledger.fill.get(o.id) ?? 0) < o.capacity_max)
          if (!pb) continue
          const replaced = slot.offering_id ? slot.id : null
          if (replaced) slot.status = 'moved'
          const added: Slot = { ...slot, id: slotId(plan.id), offering_id: pb.id, experience_type: 'PF', entry: 'required', why, evidence_id: n.evidence_id, added_at: now, status: 'planned', goal: null, rating: null }
          ledger.fill.set(pb.id, (ledger.fill.get(pb.id) ?? 0) + 1)
          next = { ...next, slots: replaced ? [...next.slots, added] : next.slots.map((s) => (s.id === slot.id ? added : s)) }
          moves.push({ student_id: student.id, kind: 'added', slot: added, replaced_slot_id: replaced, why, trace: { ...n.trace, settings: { ...n.trace.settings, max_overnight_moves: settings.max_overnight_moves }, candidates: [{ id: pb.id, label: `${pb.title} ${pb.day} ${pb.start}`, score: null, lost_because: null }, { id: 'workshop', label: 'a workshop for the lesson', score: null, lost_because: 'none with room on a later day' }, ...n.trace.candidates], decision: replaced ? `new Required need; displaced a chosen slot into the earliest open block` : `new Required need; took the earliest open slot` } })
          count++
        } else if (n.kind === 'readiness' && n.evidence_id && newEvidenceIds.has(n.evidence_id) && can()) {
          const a = snap.offerings.find((o) => o.status === 'published' && o.kind === 'assessment' && o.source_ref === `assess:${student.id}` && o.outcomes_served.includes(n.outcome_id) && o.day >= tomorrow)
          if (!a || next.slots.some((s) => s.offering_id === a.id)) continue
          const overlapping = next.slots.filter((s) => s.day === a.day && live(s) && overlaps(s.start, s.end, a.start, a.end) && s.entry === 'chosen')
          if (next.slots.some((s) => s.day === a.day && live(s) && overlaps(s.start, s.end, a.start, a.end) && s.entry !== 'chosen')) continue
          for (const s of overlapping) s.status = 'moved'
          const booked: Slot = { id: slotId(plan.id), plan_id: plan.id, day: a.day, start: a.start, end: a.end, experience_type: a.experience_type, offering_id: a.id, entry: 'assigned', why: en.why.assessment(n.outcome_name, n.evidence_ref ?? 'your latest strong scores'), goal: null, status: 'planned', rating: null, bring: 'The evidence you want in the room', evidence_id: n.evidence_id, added_at: now }
          next = { ...next, slots: [...next.slots, booked] }
          moves.push({ student_id: student.id, kind: 'booked', slot: booked, replaced_slot_id: overlapping[0]?.id ?? null, why: booked.why, trace: { ...n.trace, settings: { ...n.trace.settings, max_overnight_moves: settings.max_overnight_moves }, decision: `readiness; the booked assessment went onto the week` } })
          count++
        }
      }
    }
    void futureDays
    if (count > 0) {
      next.slots.sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day)))
      plans.push({ ...next, version: plan.version + 1 })
    }
  }
  return { plans, moves }
}
