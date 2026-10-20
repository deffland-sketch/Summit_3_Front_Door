import { expect, test } from '@playwright/test'

/** The engine's own log line carries the elapsed time; the scenario times the same calls from outside too. */
test('30 in the browser, the full weekly build for 100 students takes under five seconds and adjustOvernight under one second', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/l/evidence')
  await expect(page.getByText(/No engine run yet/)).toBeVisible()
  const build = await page.evaluate(() => {
    const fd = (window as unknown as { __frontDoor: { runWeeklyBuild: (publish: boolean) => number } }).__frontDoor
    const t0 = performance.now()
    const n = fd.runWeeklyBuild(false)
    return { ms: performance.now() - t0, n }
  })
  expect(build.n).toBe(100)
  expect(build.ms, `weekly build took ${Math.round(build.ms)} ms`).toBeLessThan(5000)
  const overnight = await page.evaluate(() => {
    const fd = (window as unknown as { __frontDoor: { runOvernight: () => unknown[] } }).__frontDoor
    const t0 = performance.now()
    fd.runOvernight()
    return performance.now() - t0
  })
  expect(overnight, `adjustOvernight took ${Math.round(overnight)} ms`).toBeLessThan(1000)
  // An out-today event is the overnight adjuster with cancellations in front of it; it should hold the same bound.
  const out = await page.evaluate(() => {
    const fd = (window as unknown as { __frontDoor: { adultOutToday: (a: string, d: string) => unknown[]; snapshot: () => { meta: { today: string } } } }).__frontDoor
    const t0 = performance.now()
    fd.adultOutToday('adu_math', fd.snapshot().meta.today)
    return performance.now() - t0
  })
  expect(out, `out today took ${Math.round(out)} ms`).toBeLessThan(1000)
  // The Evidence Log's run lines carry the engine's own timing, under the same bounds.
  const list = page.getByRole('list', { name: 'Engine runs' })
  await expect(list).toContainText(/weekly build .* (\d+) ms/)
  const text = (await list.textContent()) ?? ''
  const ms = [...text.matchAll(/(weekly build|overnight|out today)[^]*?(\d+) ms\./g)].map((m) => ({ run: m[1], ms: Number(m[2]) }))
  expect(ms.length).toBeGreaterThanOrEqual(3)
  for (const m of ms) expect(m.ms, m.run).toBeLessThan(m.run === 'weekly build' ? 5000 : 1000)
})
