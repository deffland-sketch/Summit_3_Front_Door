import { expect, test } from '@playwright/test'
import { currentPlan, sandbox, today } from './helpers'

test('09 Build My Week for an owned student: the whole week is theirs, Required stays put, full menu on open slots', async ({ page }) => {
  const snap = sandbox()
  const s = snap.students.find((st) => st.plan_autonomy === 'owned' && currentPlan(snap, st.id).slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > today()))!
  await page.goto(`/s/${s.id}/build`)
  await expect(page.getByText(/The whole week is yours to build/)).toBeVisible()
  const required = currentPlan(snap, s.id).slots.filter((x) => x.entry === 'required')
  const swapButtons = await page.getByRole('button', { name: 'Swap this Recommended slot' }).count()
  const recommended = currentPlan(snap, s.id).slots.filter((x) => x.entry === 'recommended' && x.status !== 'attended' && x.status !== 'missed').length
  expect(swapButtons).toBe(recommended)
  expect(required.every((r) => r.entry === 'required')).toBe(true)
  await expect(page.getByText('Everything published this week')).toBeVisible()
})
