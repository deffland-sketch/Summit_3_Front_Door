/** `npm run audit`: write audit/engine-audit-<date>.md from the committed sandbox (Spec 6 Audit Export). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { SandboxSchema } from '../src/model'
import { engineAudit } from '../src/engine/audit'

const snap = SandboxSchema.parse(JSON.parse(readFileSync('public/sandbox/sandbox.json', 'utf8')))
const date = process.argv[2] ?? snap.meta.today
mkdirSync('audit', { recursive: true })
const path = `audit/engine-audit-${date}.md`
writeFileSync(path, engineAudit(snap, date))
console.log(`wrote ${path}`)
