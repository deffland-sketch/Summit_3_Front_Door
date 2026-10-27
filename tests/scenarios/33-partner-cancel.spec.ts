import { expect, test } from '@playwright/test'
import { alerts } from '../../src/engine'
import { appStore } from '../../src/store'
import { cancelPartnerSlot } from '../../src/store/actions'
import { fresh, sandbox } from './helpers'

test('33 the dashboard alert for an under-filled partner slot proposes the cancel, and accepting it moves only the displaced students', async ({ page }) => {
  const snap = fresh()
  appStore.getState().load(snap)
  const alert = alerts(snap).find((a) => a.kind === 'partner_unfilled' && Number(a.detail.match(/: (\d+) of/)?.[1]) > 0)!
  expect(alert.action).toBe('cancel_partner')
  expect(alert.detail).toMatch(/the engine proposes cancelling it/)
  const placed = new Set(snap.plans.filter((p) => p.week_start === snap.meta.week_start && p.slots.some((s) => s.offering_id === alert.subject_id && (s.status === 'planned' || s.status === 'confirmed'))).map((p) => p.student_id))
  expect(placed.size).toBeGreaterThan(0)
  const moves = cancelPartnerSlot(alert.subject_id)
  const after = appStore.getState()
  expect(after.offerings.find((o) => o.id === alert.subject_id)!.status).toBe('cancelled')
  for (const m of moves) expect(placed.has(m.student_id), `${m.student_id} was placed in the slot`).toBe(true)
  const versions = after.plans.filter((p) => p.week_start === snap.meta.week_start).filter((p) => p.version !== snap.plans.find((q) => q.id === p.id)!.version)
  for (const p of versions) expect(placed.has(p.student_id)).toBe(true)
  expect(alerts(after).some((a) => a.kind === 'partner_unfilled' && a.subject_id === alert.subject_id)).toBe(false)
  expect(after.gathering_log.some((g) => g.source === 'engine:out_today' && g.message.includes('one partner slot'))).toBe(true)

  // From the dashboard: the button sits on the alert, and the alert goes once clicked.
  await page.goto('/l')
  const row = page.locator('li', { hasText: alert.subject_name }).filter({ has: page.getByRole('button', { name: 'Cancel and move the students' }) }).first()
  await expect(row).toBeVisible()
  await expect(row).toContainText('the engine proposes cancelling it')
  await row.getByRole('button', { name: 'Cancel and move the students' }).click()
  await expect(page.getByText(/cancelled\. \d+ students? moved/)).toBeVisible()
  void sandbox
})
