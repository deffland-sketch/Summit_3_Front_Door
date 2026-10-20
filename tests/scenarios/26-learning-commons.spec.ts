import { expect, test } from '@playwright/test'
import { getGraph } from '../../src/graph'
import { LC_MATH } from '../../src/graph/catalog'

test('26 the math progressions come from the real Learning Commons export at confidence 1.0, and the screens say which version', async ({ page }) => {
  // The committed export carries its provenance.
  expect(LC_MATH.source).toBe('learning_commons')
  expect(LC_MATH.version).toMatch(/^v\d+\.\d+\.\d+$/)
  expect(LC_MATH.license).toMatch(/CC/)
  expect(LC_MATH.standards.length).toBeGreaterThan(100)
  expect(LC_MATH.components.length).toBeGreaterThan(400)
  expect(LC_MATH.builds_toward.length).toBeGreaterThan(100)
  expect(LC_MATH.missing_codes).toEqual([])
  // Every math progression edge in the graph is Learning Commons at 1.0, never the authored fallback.
  const graph = getGraph()
  const mathEdges = graph.edges.filter((e) => e.type === 'builds_toward' && graph.nodes.get(e.from)?.type === 'MathStandard' && graph.nodes.get(e.to)?.type === 'MathStandard')
  expect(mathEdges.length).toBe(LC_MATH.builds_toward.length)
  for (const e of mathEdges) {
    expect(e.source).toBe('learning_commons')
    expect(e.confidence).toBe(1)
  }
  const supports = graph.edges.filter((e) => e.type === 'supports' && graph.nodes.get(e.from)?.type === 'MathComponent')
  expect(supports.length).toBeGreaterThan(400)
  for (const e of supports) expect(e.source).toBe('learning_commons')
  expect(graph.source_label).toContain(`Learning Commons ${LC_MATH.version}`)
  // The Evidence Log names the version; the graph browser labels a math edge with it.
  await page.goto('/l/evidence')
  await expect(page.getByText(`Learning Commons ${LC_MATH.version} for math`, { exact: false })).toBeVisible()
  await page.goto('/l/graph')
  await page.getByRole('button', { name: /^MathStandard \d+/ }).click()
  await page.getByLabel('Find a node').fill(mathEdges[0].from.replace('CCSS.', ''))
  await page.getByRole('button', { name: new RegExp(graph.nodes.get(mathEdges[0].from)!.name.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click()
  await expect(page.getByText(`learning_commons ${LC_MATH.version} · 1`).first()).toBeVisible()
})
