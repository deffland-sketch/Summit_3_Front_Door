import { expect, test } from '@playwright/test'
import { minutesBetween, weekDates } from '../../src/lib/time'
import { currentPlan, sandbox } from './helpers'

test('16 every Launch student\'s week is mostly real-world, with reflection each day and a Friday mentor meeting', () => {
  const snap = sandbox()
  for (const s of snap.students.filter((x) => x.level === 'launch')) {
    const plan = currentPlan(snap, s.id)
    const placed = plan.slots.filter((x) => x.offering_id && x.status !== 'cancelled' && x.status !== 'moved')
    const mins = (t: string) => placed.filter((x) => x.experience_type === t).reduce((m, x) => m + minutesBetween(x.start, x.end), 0)
    const total = placed.reduce((m, x) => m + minutesBetween(x.start, x.end), 0)
    expect(mins('RW') / total, s.id).toBeGreaterThan(0.5)
    for (const d of weekDates(plan.week_start)) expect(plan.slots.filter((x) => x.day === d && x.experience_type === 'RG').length, `${s.id} ${d}`).toBe(1)
    expect(placed.some((x) => snap.offerings.find((o) => o.id === x.offering_id)?.title === 'Launch mentor meeting'), s.id).toBe(true)
  }
})
