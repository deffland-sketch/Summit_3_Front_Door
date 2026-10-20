import { expect, test } from '@playwright/test'

test('11 an engine proposal accepted becomes a published workshop with every student placed', async ({ page }) => {
  await page.goto('/x/adu_math/proposed')
  const first = page.locator('article, li').filter({ has: page.getByRole('button', { name: 'Accept', exact: true }) }).first()
  const title = (await first.locator('h2').first().textContent())?.trim() ?? ''
  const count = Number((await first.getByText(/Students who need it \((\d+)\)/).textContent())?.match(/\((\d+)\)/)?.[1] ?? '0')
  await first.getByRole('button', { name: 'Accept', exact: true }).click()
  await expect(page.getByText(new RegExp(`Published\\. ${count} students placed`))).toBeVisible()
  await page.getByRole('link', { name: 'My Offerings' }).click()
  for (const d of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
    await page.getByRole('button', { name: new RegExp(`^${d}`) }).click()
    if (await page.getByRole('heading', { name: title }).count()) break
  }
  const card = page.locator('li', { has: page.getByRole('heading', { name: title }) }).first()
  await expect(card).toContainText(`${count} of 8`)
  await expect(card.getByText(/· required/).first()).toBeVisible()
})
