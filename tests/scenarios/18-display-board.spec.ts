import { expect, test } from '@playwright/test'
import { sandbox } from './helpers'

test('18 the display board shows rooms and counts only, never a name, a program, or a reason', async ({ page }) => {
  await page.goto('/board')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Today')
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/\b(IEP|MLL|504|Protected|ELL|SPED|case manager)\b/i)
  for (const s of sandbox().students.slice(0, 100)) expect(text).not.toContain(s.display_name)
  expect(text).toMatch(/Room 10\d|Seminar room|Home base commons/)
  expect(text).toMatch(/· \d+/)
})
