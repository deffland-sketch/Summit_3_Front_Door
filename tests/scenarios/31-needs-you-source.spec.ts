import { expect, test } from '@playwright/test'
import { needsYou } from '../../src/engine'
import { sandbox } from './helpers'

test('31 every stale item in Needs You names the source that went quiet and the date of its last row', async ({ page }) => {
  const snap = sandbox()
  const stale = needsYou(snap).filter((i) => i.kind === 'stale')
  expect(stale.length).toBeGreaterThan(0)
  for (const i of stale) {
    const rows = snap.evidence.filter((e) => e.student_id === i.student_id && e.source_ref === i.lesson_id && e.value_kind === 'mastery_pct').sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))
    expect(i.source).toBe(rows[0].source)
    expect(i.last_row_at).toBe(rows[0].recorded_at)
    expect(i.text).toMatch(/the last row was (Kira check|Teach to One session|gradebook entry|assessment|Futre reflection|note from your adult|reflection|exhibition|outside record) on (Mon|Tue|Wed|Thu|Fri|Sat|Sun) [A-Z][a-z]{2} \d{1,2}\./)
  }
  await page.goto('/x/adu_math/needs-you')
  await expect(page.getByText(/the last row was .* on (Mon|Tue|Wed|Thu|Fri|Sat|Sun) /).first()).toBeVisible()
})
