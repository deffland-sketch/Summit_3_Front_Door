import { readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'
import { SandboxSchema, type Sandbox } from '../../src/model'

let cached: Sandbox | null = null
/** The committed fixture, parsed once per worker. */
export function sandbox(): Sandbox {
  if (!cached) cached = SandboxSchema.parse(JSON.parse(readFileSync('public/sandbox/sandbox.json', 'utf8')))
  return cached
}
export function fresh(): Sandbox {
  return structuredClone(sandbox())
}
export const weekStart = () => sandbox().meta.week_start
export const today = () => sandbox().meta.today

export function currentPlan(snap: Sandbox, studentId: string) {
  return snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)!
}

export function firstStudent(level: 'expose' | 'explore' | 'pursue' | 'launch', pred: (s: Sandbox['students'][number]) => boolean = () => true) {
  return sandbox().students.find((s) => s.level === level && pred(s))!
}

/** Open the sandbox panel if it is closed. */
export async function openSandboxControls(page: Page) {
  if (!(await page.getByRole('button', { name: 'Run adjustOvernight' }).isVisible())) await page.getByRole('button', { name: 'Sandbox controls' }).click()
  await expect(page.getByRole('button', { name: 'Run adjustOvernight' })).toBeVisible()
}
