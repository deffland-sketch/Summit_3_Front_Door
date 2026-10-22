import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { AUDIT_QUESTION, engineAudit } from '../../src/engine'
import { sandbox } from './helpers'

const BANNED = /\b(behind|failing|at risk|deficient|low performer)\b/i

test('29 the audit export holds twenty proposals and twenty placed Required slots, each with a rationale, a trace summary, and a blank acceptance column, and the committed file is current', () => {
  const snap = sandbox()
  const md = engineAudit(snap)
  const proposals = md.split('## Proposals')[1].split('## Placed Required slots')[0].split('\n').filter((l) => /^\| \d+ \|/.test(l))
  const required = md.split('## Placed Required slots')[1].split('\n').filter((l) => /^\| \d+ \|/.test(l))
  expect(proposals).toHaveLength(20)
  expect(required).toHaveLength(20)
  expect((md.match(new RegExp(AUDIT_QUESTION.replace(/[?]/g, '\\?'), 'g')) ?? []).length).toBe(2)
  for (const row of [...proposals, ...required]) {
    const cells = row.split('|').map((c) => c.trim())
    expect(cells[cells.length - 2], row.slice(0, 60)).toBe('')
    expect(row).toMatch(/\d+ rows? \(|no evidence row/)
    expect(row).toMatch(/mastery_below_pct|grouping_threshold|default settings/)
    expect(row).toMatch(/\d+ candidates|no alternative weighed/)
    expect(row).not.toMatch(BANNED)
  }
  for (const row of proposals) expect(row).toMatch(/with every prerequisite mastered|needs a workshop/)
  for (const row of required) expect(row).toMatch(/score was \d+ on the|was at \d+ on the/)
  // The committed file is what the generator writes today, so it never goes stale unnoticed.
  const committed = readFileSync(`audit/engine-audit-${snap.meta.today}.md`, 'utf8')
  expect(committed).toBe(md)
})

test('29b the lead downloads the audit from the Engine Trace screen', async ({ page }) => {
  await page.goto('/l/trace')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download the audit (markdown)' }).click()])
  expect(download.suggestedFilename()).toMatch(/^engine-audit-\d{4}-\d{2}-\d{2}\.md$/)
  const path = await download.path()
  const text = readFileSync(path!, 'utf8')
  expect(text).toContain('# Engine audit')
  expect(text).toContain(AUDIT_QUESTION)
  expect(text).toContain('## Placed Required slots')
})
