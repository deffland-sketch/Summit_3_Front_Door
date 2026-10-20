import { expect, test } from '@playwright/test'
import { firstStudent } from './helpers'

test('04 a Launch student opens Today: on site leads, a paid placement is listed, campus section is short', async ({ page }) => {
  const s = firstStudent('launch')
  await page.goto(`/s/${s.id}`)
  const headings = page.locator('main h2')
  await expect(headings.first()).toHaveText(/On site today/)
  await expect(page.getByText('Paid work placement').first()).toBeVisible()
  const campus = page.locator('section[aria-labelledby="now"] article')
  expect(await campus.count()).toBeLessThanOrEqual(5)
})
