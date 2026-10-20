import { expect, test } from '@playwright/test'

test('17 the equity snapshot lists a recurring Required student and one with no real-world slot in four weeks', async ({ page }) => {
  await page.goto('/l/equity')
  const recurring = page.locator('section', { hasText: /Required three or more weeks/ }).first()
  await expect(recurring.getByRole('heading')).toContainText(/\((\d+)\)/)
  expect(Number((await recurring.getByRole('heading').textContent())?.match(/\((\d+)\)/)?.[1])).toBeGreaterThan(0)
  const noRw = page.locator('section', { hasText: /No real-world slot in four weeks/ }).first()
  expect(Number((await noRw.getByRole('heading').textContent())?.match(/\((\d+)\)/)?.[1])).toBeGreaterThan(0)
  const link = recurring.getByRole('link').first()
  await expect(link).toHaveAttribute('href', /\/m\/adu_mentor_\d\/student\/stu_\d+/)
})
