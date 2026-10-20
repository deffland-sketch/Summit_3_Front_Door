import { expect, test } from '@playwright/test'
import { currentPlan, sandbox, today } from './helpers'

test('08 Build My Week for a shared or owned student: full menu, a Recommended swap needs a reason', async ({ page }) => {
  const snap = sandbox()
  const s = snap.students.find((st) => (st.plan_autonomy === 'shared' || st.plan_autonomy === 'owned') && currentPlan(snap, st.id).slots.some((x) => x.entry === 'recommended' && x.status !== 'attended' && x.status !== 'missed'))!
  void today
  await page.goto(`/s/${s.id}/build`)
  await expect(page.getByText('Everything published this week')).toBeVisible()
  await page.getByRole('button', { name: 'Swap this Recommended slot' }).first().click()
  const chooseButtons = page.getByRole('button', { name: 'Choose this' })
  await expect(chooseButtons.first()).toBeDisabled()
  await page.getByLabel('Why are you swapping?').fill('I need the writing studio more this week')
  await expect(chooseButtons.first()).toBeEnabled()
  await chooseButtons.first().click()
  await page.getByRole('link', { name: 'My Week', exact: true }).click()
  await expect(page.getByText(/Week version/)).toBeVisible()
})
