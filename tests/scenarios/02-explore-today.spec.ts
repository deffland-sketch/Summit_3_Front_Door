import { expect, test } from '@playwright/test'
import { currentPlan, firstStudent, sandbox, today } from './helpers'

test('02 an Explore student with a real-world slot today opens Today', async ({ page }) => {
  const snap = sandbox()
  const s = firstStudent('explore', (st) => currentPlan(snap, st.id).slots.some((x) => x.day === today() && x.experience_type === 'RW'))
  await page.goto(`/s/${s.id}`)
  await expect(page.getByText('Real-world experience').first()).toBeVisible()
  const pinned = page.locator('article.ring-2').first()
  await expect(pinned).toContainText(/Required\.|Recommended\.|Your choice\.|Everyone is here\.|Assigned\./)
  const required = currentPlan(snap, s.id).slots.find((x) => x.day === today() && x.entry === 'required')
  if (required) {
    const title = snap.offerings.find((o) => o.id === required.offering_id)?.title ?? ''
    const card = page.locator('article', { hasText: title }).first()
    await card.getByRole('button').first().click()
    await expect(card.getByText('The evidence behind this slot')).toBeVisible()
  }
})
