import { describe, expect, it } from 'vitest'
import { cloneSandbox, loadSandbox } from '@/test/sandbox'
import { adjustOvernight, buildAllWeeks, buildWeek, caseloadFlags, needs, newLedger, optionsForSlot, proposeWorkshops, suggestLevelReview, validatePlans } from './index'
import { createRng } from '@/lib/rng'
import { weekDates } from '@/lib/time'

const snap = loadSandbox()

describe('seed (Spec 1 and Spec 3 acceptance)', () => {
  it('has 100 students in the level mix with supports and constraints', () => {
    expect(snap.students).toHaveLength(100)
    const by = (l: string) => snap.students.filter((s) => s.level === l).length
    expect(by('expose')).toBe(35)
    expect(by('explore')).toBe(35)
    expect(by('pursue')).toBe(20)
    expect(by('launch')).toBe(10)
    expect(snap.students.filter((s) => s.supports.length).length).toBeGreaterThanOrEqual(15)
    expect(snap.students.filter((s) => s.life_constraints.length).length).toBeGreaterThanOrEqual(3)
    expect(snap.futre).toHaveLength(100)
  })

  it('meets the set counts within ten percent', () => {
    expect(snap.plans.filter((p) => p.week_start === snap.meta.week_start)).toHaveLength(100)
    expect(snap.plans.length).toBe(900)
    expect(snap.assignments.length).toBeGreaterThanOrEqual(2700)
    expect(snap.evidence.length).toBeGreaterThanOrEqual(10800)
    expect(snap.touchpoints.length).toBeGreaterThanOrEqual(2160)
    expect(snap.courses).toHaveLength(10)
    expect(snap.adults.filter((a) => a.capacities.includes('partner'))).toHaveLength(6)
    expect(snap.adults.filter((a) => !a.capacities.includes('partner'))).toHaveLength(13)
  })

  it('has the named situations: three ready, six nudges, one family call', () => {
    const flags = caseloadFlags(snap)
    const count = (k: string) => flags.filter((f) => f.flags.some((x) => x.kind === k)).length
    expect(count('ready')).toBe(3)
    expect(count('nudge')).toBe(6)
    expect(count('family')).toBe(1)
  })

  it('weaves RW slots into every day for about a third of students', () => {
    const current = snap.plans.filter((p) => p.week_start === snap.meta.week_start)
    for (const d of weekDates(snap.meta.week_start)) {
      const n = current.filter((p) => p.slots.some((s) => s.day === d && s.experience_type === 'RW')).length
      expect(n).toBeGreaterThanOrEqual(20)
      expect(n).toBeLessThanOrEqual(45)
    }
  })

  it('puts Required slots on about 30 students and Recommended on about 25 more, each traced to evidence', () => {
    const current = snap.plans.filter((p) => p.week_start === snap.meta.week_start)
    const required = current.filter((p) => p.slots.some((s) => s.entry === 'required'))
    const recommended = current.filter((p) => p.slots.some((s) => s.entry === 'recommended'))
    expect(required.length).toBeGreaterThanOrEqual(25)
    expect(required.length).toBeLessThanOrEqual(45)
    expect(recommended.length).toBeGreaterThanOrEqual(18)
    const ids = new Set(snap.evidence.map((e) => e.id))
    for (const s of current.flatMap((p) => p.slots).filter((s) => s.entry === 'required')) expect(s.evidence_id && ids.has(s.evidence_id)).toBe(true)
  })

  it('never stores a reason for protected time', () => {
    for (const p of snap.plans) for (const s of p.slots) if (s.entry === 'protected') expect(s.why).toBe('Protected time')
    expect(JSON.stringify(snap.students)).not.toMatch(/reason|diagnos/i)
  })
})

describe('engine (Spec 6 acceptance)', () => {
  it('needs() returns at least one item for every student and every Required item traces to evidence', () => {
    const ids = new Set(snap.evidence.map((e) => e.id))
    for (const s of snap.students) {
      const n = needs(s.id, snap)
      expect(n.length, s.id).toBeGreaterThan(0)
      for (const r of n.filter((x) => x.kind === 'required')) expect(r.evidence_id && ids.has(r.evidence_id)).toBe(true)
      for (const r of n) expect(r.why).not.toMatch(/failing|behind|at risk|\u2014/)
    }
  })

  it('proposeWorkshops() returns three or more proposals with four or more students each', () => {
    const p = proposeWorkshops(snap).filter((x) => x.kind === 'workshop' && x.student_ids.length >= 4)
    expect(p.length).toBeGreaterThanOrEqual(3)
    for (const x of p) {
      expect(x.adult_id).toBeTruthy()
      expect(x.place_id).toBeTruthy()
    }
  })

  it('changing grouping_threshold changes the proposal count', () => {
    const a = proposeWorkshops(snap).filter((x) => x.kind === 'workshop').length
    const b = proposeWorkshops({ ...snap, settings: { ...snap.settings, grouping_threshold: 6 } }).filter((x) => x.kind === 'workshop').length
    expect(b).not.toBe(a)
  })

  it('buildAllWeeks() produces 100 valid plans', () => {
    const { plans } = buildAllWeeks(snap)
    expect(plans).toHaveLength(100)
    expect(validatePlans(plans, snap)).toEqual([])
    for (const p of plans) for (const s of p.slots) expect(s.why.length).toBeGreaterThan(0)
  })

  it('rebuilds without a constraint violation under 500 random evidence perturbations', { timeout: 120_000 }, () => {
    const rng = createRng(7)
    const working = cloneSandbox()
    const mastery = working.evidence.filter((e) => e.value_kind === 'mastery_pct' && e.recorded_at >= '2026-10-01')
    const scores = working.evidence.filter((e) => e.value_kind === 'score_1_8')
    for (let i = 0; i < 500; i++) {
      const pool = rng.chance(0.7) ? mastery : scores
      const e = rng.pick(pool)
      e.value = pool === mastery ? rng.int(30, 100) : rng.int(1, 8)
      e.recorded_at = '2026-10-16T15:00:00.000Z'
      const ledger = newLedger(working)
      const plan = working.plans.find((p) => p.student_id === e.student_id && p.week_start === working.meta.week_start)!
      for (const s of plan.slots) if (s.offering_id) ledger.fill.set(s.offering_id, Math.max(0, (ledger.fill.get(s.offering_id) ?? 0) - 1))
      const rw = plan.slots.filter((s) => s.experience_type === 'RW' && s.offering_id).map((s) => s.offering_id!)
      const rebuilt = buildWeek(e.student_id, working, { ledger, rwPlacements: rw, goals: plan.goals, focusHabits: plan.focus_habits })
      const others = working.plans.filter((p) => p.week_start === working.meta.week_start && p.student_id !== e.student_id)
      const v = validatePlans([rebuilt], working)
      expect(v, `perturbation ${i} on ${e.id}`).toEqual([])
      for (const s of rebuilt.slots) {
        if (!s.offering_id) continue
        const o = working.offerings.find((x) => x.id === s.offering_id)!
        expect(ledger.fill.get(o.id) ?? 0, `capacity ${o.id}`).toBeLessThanOrEqual(o.capacity_max)
      }
      working.plans = [...working.plans.filter((p) => p.week_start !== working.meta.week_start), ...others, rebuilt]
    }
  })

  it('adjustOvernight() after one lowered score adds exactly one slot for that student with the right why', () => {
    const working = cloneSandbox()
    const since = `${working.meta.today}T12:00:00.000Z`
    // A student with a clean week and an active math lesson at or above 85.
    const candidates = working.students.filter((s) => {
      const n = needs(s.id, working)
      const plan = working.plans.find((p) => p.student_id === s.id && p.week_start === working.meta.week_start)!
      const hasOpen = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > working.meta.today)
      return hasOpen && !n.some((x) => x.kind === 'required' || x.kind === 'recommended') && working.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
    })
    const student = candidates[0]
    const asg = working.assignments.find((a) => a.student_id === student.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))!
    const lesson = working.lessons.find((l) => l.id === asg.lesson_id)!
    const outcome = working.outcomes.find((o) => o.id === lesson.outcomes_served[0])!
    working.evidence.push({ id: 'ev_test_low', student_id: student.id, outcome_id: outcome.id, source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: 41, artifact_url: null, recorded_by: 'system', recorded_at: `${working.meta.today}T20:00:00.000Z`, slot_id: null })
    const { plans, moves } = adjustOvernight(working, { since })
    const mine = moves.filter((m) => m.student_id === student.id)
    expect(mine).toHaveLength(1)
    expect(mine[0].slot.entry).toBe('required')
    expect(mine[0].slot.why).toContain(outcome.name)
    expect(mine[0].slot.why).toContain('41')
    expect(mine[0].slot.added_at).toBeTruthy()
    expect(moves.filter((m) => m.student_id !== student.id)).toHaveLength(0)
    const plan = plans.find((p) => p.student_id === student.id)!
    expect(plan.version).toBe(2)
    expect(validatePlans([plan], working)).toEqual([])
  })

  it('suggestLevelReview() never suggests downward and finds a few candidates', () => {
    const suggestions = snap.students.map((s) => suggestLevelReview(s.id, snap)).filter((x) => x !== null)
    expect(suggestions.length).toBeGreaterThan(0)
    const order = ['expose', 'explore', 'pursue', 'launch']
    for (const s of suggestions) expect(order.indexOf(s.to)).toBeGreaterThan(order.indexOf(s.from))
  })

  it('ranks two to five options for an open slot with a why for each', () => {
    const isOpen = (s: { offering_id: string | null; entry: string; day: string; start: string }) => s.offering_id === null && s.entry === 'chosen' && s.day > snap.meta.today && s.start === '09:15'
    const plan = snap.plans.find((p) => p.week_start === snap.meta.week_start && p.slots.some(isOpen))!
    const student = snap.students.find((s) => s.id === plan.student_id)!
    const slot = plan.slots.find(isOpen)!
    const options = optionsForSlot(plan, slot, student, snap, newLedger(snap))
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options.length).toBeLessThanOrEqual(5)
    for (const o of options) expect(o.builds.length).toBeGreaterThan(0)
  })
})
