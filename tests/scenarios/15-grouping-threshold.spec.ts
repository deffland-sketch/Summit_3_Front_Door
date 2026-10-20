import { expect, test } from '@playwright/test'

test('15 changing grouping_threshold from 4 to 6 changes the proposal count and is logged', async ({ page }) => {
  await page.goto('/l/settings')
  const hint = page.getByText(/workshop proposals with the current threshold/)
  const before = Number((await hint.textContent())?.match(/(\d+) workshop/)?.[1])
  await page.getByLabel(/Grouping threshold/).fill('6')
  await expect(hint).not.toHaveText(new RegExp(`^${before} workshop`))
  const after = Number((await hint.textContent())?.match(/(\d+) workshop/)?.[1])
  expect(after).toBeLessThan(before)
  await expect(page.getByText(/grouping_threshold: 4 to 6/)).toBeVisible()
})
