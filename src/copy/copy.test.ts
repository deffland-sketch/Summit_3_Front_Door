import { describe, expect, it } from 'vitest'
import { en } from './en'
import { es, needs_review } from './es'

type Leaf = { path: string; value: string }
function leaves(obj: unknown, path = ''): Leaf[] {
  if (typeof obj === 'string') return [{ path, value: obj }]
  if (typeof obj === 'function') return [{ path, value: String(obj(...['X', 'Y', 'Z', 1, 2].map((x) => x) as never[])) }]
  if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
  return []
}
const BANNED = [/\u2014/, /\bnot\s+\w+(\s+\w+)?,?\s+but\b/i, /\bfailing\b/i, /\b(falling|is|are|fell) behind\b/i, /\bat risk\b/i]

describe('copy', () => {
  const enLeaves = leaves(en)
  it('has no em-dashes, no "not X but Y", and no deficit labels in any string', () => {
    for (const l of enLeaves) for (const re of BANNED) expect(l.value, l.path).not.toMatch(re)
  })
  it('Spanish has the same keys and is a real draft marked needs_review', () => {
    const esLeaves = leaves(es)
    expect(esLeaves.map((l) => l.path)).toEqual(enLeaves.map((l) => l.path))
    expect(needs_review).toBe(true)
    const translated = esLeaves.filter((l, i) => l.value !== enLeaves[i].value).length
    expect(translated / esLeaves.length).toBeGreaterThan(0.6)
    for (const l of esLeaves) expect(l.value, l.path).not.toMatch(/\u2014/)
  })
  it('never shows a reason for protected time', () => {
    expect(en.why.protectedTime).toBe('Protected time')
    expect(en.app.protectedTime).toBe('Protected time')
  })
})
