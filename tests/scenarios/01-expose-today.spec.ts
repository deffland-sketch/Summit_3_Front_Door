import { expect, test } from '@playwright/test'
import { firstStudent } from './helpers'

test('01 an Expose student opens Today: community at 8:30, reflection at 3:00, a why on every slot', async ({ page }) => {
  const s = firstStudent('expose')
  await page.goto(`/s/${s.id}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hi')
  await expect(page.getByText('Community circle').first()).toBeVisible()
  await expect(page.getByText('8:30 am to 8:45 am').first()).toBeVisible()
  await expect(page.getByText('Reflection and goal-setting', { exact: true }).first()).toBeVisible()
  const cards = page.locator('article')
  const n = await cards.count()
  expect(n).toBeGreaterThan(3)
  for (let i = 0; i < n; i++) {
    const text = await cards.nth(i).innerText()
    expect(text).toMatch(/Required\.|Recommended\.|Your choice\.|Everyone is here\.|Assigned\.|Protected time/)
  }
})
