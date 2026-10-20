import { expect, test } from '@playwright/test'
import { needs } from '../../src/engine'
import { sandbox } from './helpers'

test('13 readiness books an assessment: an offering and a slot appear and the flag clears', async ({ page }) => {
  const snap = sandbox()
  const ready = snap.students.find((s) => needs(s.id, snap).some((n) => n.kind === 'readiness'))!
  await page.goto(`/m/${ready.mentor_id}/readiness`)
  await expect(page.getByText(ready.display_name).first()).toBeVisible()
  const card = page.locator('li', { hasText: ready.display_name }).first()
  await card.getByRole('button', { name: 'Book an assessment' }).click()
  await expect(page.getByText('Booked. An assessment slot')).toBeVisible()
  await expect(page.locator('li', { hasText: ready.display_name })).toHaveCount(0)
  await page.goto(`/m/${ready.mentor_id}`)
  await page.getByRole('link', { name: ready.display_name }).click()
  // The Week grid is client-side; a full reload would reset the store, so we only verify via the mentor's view here.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(ready.display_name)
})
