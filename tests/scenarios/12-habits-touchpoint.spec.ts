import { expect, test } from '@playwright/test'

test('12 a mentor adds a Habits touchpoint and it shows on the student\'s Today', async ({ page }) => {
  await page.goto('/m/adu_mentor_1')
  const link = page.locator('table a').first()
  const name = (await link.textContent()) ?? ''
  await link.click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name)
  await page.getByRole('button', { name: 'Habits', exact: true }).click()
  await page.getByLabel('Notes (the student sees these unless marked private)').fill('Self-direction showed up when you planned the studio block yourself.')
  await page.getByRole('button', { name: 'Save touchpoint' }).click()
  await expect(page.getByText('Touchpoint saved')).toBeVisible()
  await expect(page.getByText('Self-direction showed up when you planned').first()).toBeVisible()
  await page.getByRole('link', { name: 'Open the student’s Today' }).click()
  await expect(page.getByText(/Check-in · Jordan/).first()).toBeVisible()
})
