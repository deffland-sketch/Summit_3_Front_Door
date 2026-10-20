import { expect, test } from '@playwright/test'

test('content expert happy path: proposed workshops, accept one, see the roster', async ({ page }) => {
  await page.goto('/x/adu_math/proposed')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Proposed Workshops')
  await page.screenshot({ path: 'e2e/screens/expert-proposed.png', fullPage: true })
  const title = await page.locator('h2').first().textContent()
  await page.getByRole('button', { name: 'Accept', exact: true }).first().click()
  await expect(page.getByText(/students placed/)).toBeVisible()
  await page.getByRole('link', { name: 'My Offerings' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('My Offerings')
  // The accepted workshop sits on a later day; walk the day buttons until it shows.
  for (const d of ['Wed', 'Thu', 'Fri', 'Tue', 'Mon']) {
    await page.getByRole('button', { name: new RegExp(`^${d}`) }).click()
    if (await page.getByRole('heading', { name: title ?? '' }).count()) break
  }
  await expect(page.getByRole('heading', { name: title ?? '' })).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/expert-offerings.png', fullPage: true })
  await page.getByRole('link', { name: 'Needs You' }).click()
  await page.screenshot({ path: 'e2e/screens/expert-needs-you.png', fullPage: true })
  await page.goto('/x/adu_coordinator/build')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Weekly Build')
  await page.getByRole('button', { name: 'Run the build' }).click()
  await expect(page.getByText(/100 plans built/).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/expert-build.png', fullPage: true })
})
