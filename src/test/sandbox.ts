import { readFileSync } from 'node:fs'
import { SandboxSchema, type Sandbox } from '@/model'

let cached: Sandbox | null = null
/** The committed sandbox fixture, parsed once per test run. */
export function loadSandbox(): Sandbox {
  if (!cached) cached = SandboxSchema.parse(JSON.parse(readFileSync('public/sandbox/sandbox.json', 'utf8')))
  return cached
}
export function cloneSandbox(): Sandbox {
  return structuredClone(loadSandbox())
}
