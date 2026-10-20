import { expect, test } from '@playwright/test'
import type { EngineTrace } from '../../src/model'
import { adjustOvernight, buildWeek, newLedger, proposeWorkshops, validatePlans } from '../../src/engine'
import { createRng } from '../../src/lib/rng'
import { shiftDate, weekDates } from '../../src/lib/time'
import { fresh, sandbox } from './helpers'

test.describe.configure({ mode: 'serial' })

test('27 500 random evidence perturbations rebuild without a constraint violation, and every placed Required slot traces to an evidence row', () => {
  test.setTimeout(300_000)
  const rng = createRng(27)
  const working = fresh()
  const mastery = working.evidence.filter((e) => e.value_kind === 'mastery_pct' && e.recorded_at >= '2026-10-01')
  const scores = working.evidence.filter((e) => e.value_kind === 'score_1_8')
  const evidenceIds = new Set(working.evidence.map((e) => e.id))
  for (let i = 0; i < 500; i++) {
    const pool = rng.chance(0.7) ? mastery : scores
    const e = rng.pick(pool)
    e.value = pool === mastery ? rng.int(30, 100) : rng.int(1, 8)
    e.recorded_at = '2026-10-16T15:00:00.000Z'
    const ledger = newLedger(working)
    const plan = working.plans.find((p) => p.student_id === e.student_id && p.week_start === working.meta.week_start)!
    for (const s of plan.slots) if (s.offering_id) ledger.fill.set(s.offering_id, Math.max(0, (ledger.fill.get(s.offering_id) ?? 0) - 1))
    const rw = plan.slots.filter((s) => s.experience_type === 'RW' && s.offering_id).map((s) => s.offering_id!)
    const traces: EngineTrace[] = []
    const rebuilt = buildWeek(e.student_id, working, { ledger, rwPlacements: rw, goals: plan.goals, focusHabits: plan.focus_habits, traces, runId: `p${i}`, now: '2026-10-16T17:00:00.000Z' })
    expect(validatePlans([rebuilt], working), `perturbation ${i} on ${e.id}`).toEqual([])
    for (const s of rebuilt.slots) {
      if (s.offering_id) expect(ledger.fill.get(s.offering_id) ?? 0, `capacity ${s.offering_id}`).toBeLessThanOrEqual(working.offerings.find((o) => o.id === s.offering_id)!.capacity_max)
      if (s.entry === 'required') {
        const t = traces.find((x) => x.ref_id === s.id)!
        expect(t.evidence_ids.length, `${s.id} traces to evidence`).toBeGreaterThan(0)
        for (const id of t.evidence_ids) expect(evidenceIds.has(id)).toBe(true)
      }
    }
    working.plans = [...working.plans.filter((p) => p.week_start !== working.meta.week_start || p.student_id !== e.student_id), rebuilt]
  }
})

test('27b 200 random "I\'m out today" events each move only the students the cancelled offerings displaced, and nobody above max_overnight_moves', () => {
  test.setTimeout(300_000)
  const base = sandbox()
  const rng = createRng(272)
  const days = weekDates(base.meta.week_start).filter((d) => d >= base.meta.today)
  const adults = base.adults.filter((a) => base.offerings.some((o) => o.adult_ids.includes(a.id) && o.status === 'published' && o.day >= base.meta.today && o.kind !== 'practice' && o.kind !== 'community'))
  let eventsWithMoves = 0
  for (let i = 0; i < 200; i++) {
    // adjustOvernight() copies the plans it touches, so only the offerings need a fresh copy per event.
    const snap = { ...base, offerings: base.offerings.map((o) => ({ ...o })) }
    const adult = rng.pick(adults)
    const day = rng.pick(days)
    const cancelled = new Set<string>()
    for (const o of snap.offerings) {
      if (o.day === day && o.adult_ids.includes(adult.id) && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community') {
        o.status = 'cancelled'
        cancelled.add(o.id)
      }
    }
    const displaced = new Set(snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.offering_id && cancelled.has(s.offering_id) && s.day >= day && (s.status === 'planned' || s.status === 'confirmed'))).map((p) => p.student_id))
    const { moves, plans } = adjustOvernight(snap, { since: '2099-01-01T00:00:00.000Z', today: shiftDate(day, -1), now: `${day}T06:00:00.000Z` })
    if (moves.length) eventsWithMoves++
    const perStudent = new Map<string, number>()
    for (const m of moves) {
      expect(displaced.has(m.student_id), `event ${i}: ${adult.id} out ${day} moved ${m.student_id}, who was not displaced`).toBe(true)
      perStudent.set(m.student_id, (perStudent.get(m.student_id) ?? 0) + 1)
      expect(m.trace.settings.max_overnight_moves).toBe(snap.settings.max_overnight_moves)
    }
    for (const [sid, n] of perStudent) expect(n, `event ${i}: ${sid} moves`).toBeLessThanOrEqual(snap.settings.max_overnight_moves)
    for (const p of plans) expect(displaced.has(p.student_id), `event ${i}: plan version for ${p.student_id}`).toBe(true)
    expect(validatePlans(plans, snap).filter((v) => v.kind === 'overlap' || v.kind === 'protected' || v.kind === 'life'), `event ${i} constraints`).toEqual([])
  }
  expect(eventsWithMoves).toBeGreaterThan(50)
})

test('27c 100 random grouping thresholds between 3 and 8 give proposal counts that never rise as the threshold rises', () => {
  test.setTimeout(300_000)
  const rng = createRng(273)
  const counts = new Map<number, number>()
  for (let t = 3; t <= 8; t++) {
    const snap = fresh()
    snap.settings.grouping_threshold = t
    counts.set(t, proposeWorkshops(snap).filter((p) => p.kind === 'workshop').length)
  }
  const sampled: number[] = []
  for (let i = 0; i < 100; i++) sampled.push(rng.int(3, 8))
  const sorted = [...sampled].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) expect(counts.get(sorted[i])!, `threshold ${sorted[i - 1]} to ${sorted[i]}`).toBeLessThanOrEqual(counts.get(sorted[i - 1])!)
  expect(new Set(sampled).size).toBe(6)
  expect(counts.get(3)!).toBeGreaterThan(counts.get(8)!)
})
