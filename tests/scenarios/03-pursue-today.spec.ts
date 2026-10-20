import { expect, test } from '@playwright/test'
import { currentPlan, firstStudent, sandbox } from './helpers'

test('03 a Pursue student: real-world slots in the week, level reads Pursue, no grade level anywhere', async ({ page }) => {
  const snap = sandbox()
  const s = firstStudent('pursue', (st) => currentPlan(snap, st.id).slots.filter((x) => x.experience_type === 'RW').length >= 2)
  await page.goto(`/s/${s.id}`)
  await expect(page.getByText('Student · Pursue')).toBeVisible()
  await page.getByRole('link', { name: 'My Week', exact: true }).click()
  const rw = page.getByText('Real-world experience', { exact: true })
  await expect(rw.first()).toBeVisible()
  expect(await rw.count()).toBeGreaterThanOrEqual(2)
  const body = await page.locator('main').innerText()
  expect(body).not.toMatch(/\b(9th|10th|11th|12th|grade \d|freshman|sophomore|junior|senior)\b/i)
})
