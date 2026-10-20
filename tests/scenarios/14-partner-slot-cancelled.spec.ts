import { expect, test } from '@playwright/test'
import { appStore } from '../../src/store'
import { runOvernight, upsertOffering } from '../../src/store/actions'
import { newLedger } from '../../src/engine'
import { fresh } from './helpers'
import { shiftDate } from '../../src/lib/time'

test('14 a partner slot cancelled tomorrow moves only its students, each with a why', () => {
  const snap = fresh()
  appStore.getState().load(snap)
  const tomorrow = shiftDate(snap.meta.today, 1)
  const ledger = newLedger(snap)
  const o = snap.offerings.filter((x) => x.experience_type === 'RW' && x.day === tomorrow && x.status === 'published' && (ledger.fill.get(x.id) ?? 0) > 0).sort((a, b) => (ledger.fill.get(b.id) ?? 0) - (ledger.fill.get(a.id) ?? 0))[0]
  const inIt = new Set(snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.offering_id === o.id)).map((p) => p.student_id))
  upsertOffering({ ...o, status: 'cancelled' })
  const moves = runOvernight(`${snap.meta.today}T12:00:00.000Z`, snap.meta.today)
  const moved = moves.filter((m) => m.kind === 'moved')
  expect(moved.length).toBe(inIt.size)
  for (const m of moved) {
    expect(inIt.has(m.student_id)).toBe(true)
    expect(m.why).toContain(o.title)
  }
  expect(appStore.getState().offerings.find((x) => x.id === o.id)?.status).toBe('cancelled')
})
