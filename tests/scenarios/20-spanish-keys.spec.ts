import { expect, test } from '@playwright/test'
import { en } from '../../src/copy/en'
import { es, needs_review } from '../../src/copy/es'

function leaves(obj: unknown, path = ''): { path: string; value: string }[] {
  if (typeof obj === 'string') return [{ path, value: obj }]
  if (typeof obj === 'function') return [{ path, value: String((obj as (...a: unknown[]) => unknown)('X', 'Y', 'Z', 1, 2)) }]
  if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
  return []
}

test('20 the Spanish copy file has every key the English file has and is a real draft marked needs_review', () => {
  const a = leaves(en)
  const b = leaves(es)
  expect(b.map((l) => l.path)).toEqual(a.map((l) => l.path))
  const translated = b.filter((l, i) => l.value !== a[i].value).length
  expect(translated / b.length).toBeGreaterThan(0.6)
  expect(needs_review).toBe(true)
})
