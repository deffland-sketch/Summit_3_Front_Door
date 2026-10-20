import { expect, test } from '@playwright/test'
import { needs } from '../src/engine'
import { fresh } from '../tests/scenarios/helpers'

test('sandbox: lowering a Kira score and running overnight adds a Required slot with its why', async ({ page }) => {
  // A student with a clean week (no Required or Recommended need) and an open slot ahead, from the seed.
  const snap = fresh()
  const student = snap.students.find((s) => {
    const n = needs(s.id, snap)
    const plan = snap.plans.find((p) => p.student_id === s.id && p.week_start === snap.meta.week_start)!
    const hasOpen = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    return hasOpen && !n.some((x) => x.kind === 'required' || x.kind === 'recommended') && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  await page.goto(`/s/${student.id}`)
  await page.getByRole('button', { name: 'Sandbox controls' }).click()
  await page.getByLabel('New score').fill('41')
  await page.getByRole('button', { name: /Lower the Kira mastery score/ }).click()
  await expect(page.getByText(/now reads 41%/)).toBeVisible()
  await page.getByRole('button', { name: 'Run adjustOvernight' }).click()
  await expect(page.getByText(/moves\. The mentor/)).toBeVisible()
  await page.getByRole('link', { name: 'My Week', exact: true }).click()
  await expect(page.getByText('New since yesterday').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/screens/sandbox-week.png', fullPage: true })
  if (!(await page.getByRole('button', { name: /Add a Futre reflection/ }).isVisible())) await page.getByRole('button', { name: 'Sandbox controls' }).click()
  await page.getByRole('button', { name: /Add a Futre reflection/ }).click()
  await expect(page.getByText('Reflection saved to Futre')).toBeVisible()
  await page.getByRole('button', { name: /Cancel a partner slot tomorrow/ }).click()
  await expect(page.getByText(/cancelled\.|No partner slot/)).toBeVisible()
})
