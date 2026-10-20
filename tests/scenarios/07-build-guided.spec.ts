import { expect, test } from '@playwright/test'
import { currentPlan, sandbox, today } from './helpers'

test('07 Build My Week for a guided student: ranked options, no full menu, choosing fills the slot', async ({ page }) => {
  const snap = sandbox()
  const s = snap.students.find((st) => st.plan_autonomy === 'guided' && currentPlan(snap, st.id).slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > today()))!
  await page.goto(`/s/${s.id}/build`)
  await expect(page.getByText('Options ranked for you').first()).toBeVisible()
  await expect(page.getByText('Everything published this week')).toHaveCount(0)
  const before = await page.locator('button[aria-pressed]').filter({ hasText: /am|pm/ }).count()
  await page.getByRole('button', { name: 'Choose this' }).first().click()
  await expect(page.getByText('Your mentor sees what you pick.')).toBeVisible()
  const after = await page.locator('button[aria-pressed]').filter({ hasText: /am|pm/ }).count()
  expect(after).toBeLessThan(before)
})
