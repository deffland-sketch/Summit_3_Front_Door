import { expect, test } from '@playwright/test'
import { alerts, hubLoad } from '../../src/engine'
import { fresh, sandbox } from './helpers'

test('32 the hub table knows whether the hub has the adults it requires, block by block, and an alert fires when it does not', async ({ page }) => {
  const snap = sandbox()
  const hub = snap.places.find((p) => p.kind === 'hub')!
  const blocks = hubLoad(snap)
  expect(blocks).toHaveLength(35)
  for (const b of blocks) {
    const here = snap.offerings.filter((o) => o.day === b.day && o.start === b.start && o.place_id === hub.id && o.status === 'published')
    expect(b.adults).toBe(new Set(here.flatMap((o) => o.adult_ids)).size)
    expect(b.adults_short).toBe(b.placed > 0 && b.adults < hub.adults_required)
  }
  expect(blocks.some((b) => b.placed > 0)).toBe(true)
  // Take the adults out of one busy block: it reads short, and the dashboard alert names it.
  const copy = fresh()
  const busy = blocks.filter((b) => b.placed > 0 && b.adults >= hub.adults_required).sort((a, b) => b.placed - a.placed)[0]!
  for (const o of copy.offerings) if (o.day === busy.day && o.start === busy.start && o.place_id === hub.id) o.adult_ids = []
  const after = hubLoad(copy).find((b) => b.day === busy.day && b.start === busy.start)!
  expect(after.adults_short).toBe(true)
  expect(alerts(copy).some((a) => a.kind === 'hub_over' && a.subject_id === `${busy.day}-${busy.start}` && /0 of \d+ adults/.test(a.detail))).toBe(true)
  // The table carries the adults count on every cell and reds exactly the short or over-capacity ones.
  await page.goto('/x/adu_coordinator/build')
  const table = page.getByRole('table', { name: 'Hub load by block' })
  await expect(table).toBeVisible()
  const cells = table.locator('td[data-adults]')
  expect(await cells.count()).toBe(35)
  const red = await table.locator('td.text-red-ink').count()
  expect(red).toBe(blocks.filter((b) => b.adults_short || b.over_capacity).length)
  await expect(cells.first()).toHaveAttribute('title', /adults/)
})
