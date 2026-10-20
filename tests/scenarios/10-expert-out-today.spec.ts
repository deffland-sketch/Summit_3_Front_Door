import { expect, test } from '@playwright/test'
import { appStore } from '../../src/store'
import { adultOutToday } from '../../src/store/actions'
import { fresh } from './helpers'

test('10 "I\'m out today" cancels the expert\'s offerings and moves only her students', () => {
  const snap = fresh()
  appStore.getState().load(snap)
  const day = snap.meta.today
  const hers = snap.offerings.filter((o) => o.day === day && o.adult_ids.includes('adu_math') && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community').map((o) => o.id)
  const affected = new Set(snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.offering_id && hers.includes(s.offering_id))).map((p) => p.student_id))
  const moves = adultOutToday('adu_math', day)
  const after = appStore.getState()
  expect(after.offerings.filter((o) => hers.includes(o.id)).every((o) => o.status === 'cancelled')).toBe(true)
  const bumped = after.plans.filter((p) => p.week_start === snap.meta.week_start && p.version > 1).map((p) => p.student_id)
  for (const sid of bumped) expect(affected.has(sid), `unexpected move for ${sid}`).toBe(true)
  for (const m of moves) expect(m.slot.added_at).toBeTruthy()
})
