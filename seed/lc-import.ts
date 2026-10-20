/**
 * Filters the Learning Commons Knowledge Graph exports (CC BY 4.0) to the Multi-State
 * mathematics standards IM Math 1 to 3 cite, their learning components, and the
 * buildsTowards progression edges among them. Writes src/graph/data/lc-math.json.
 *
 * Usage: npx tsx seed/lc-import.ts <nodes_ms_math.jsonl> <components.jsonl> <relationships.jsonl> <version>
 * Never run at app build time; the output JSON is committed so the build needs no network.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { imStandardCodes } from '../src/graph/authored/im-sequence'

const [nodesPath, componentsPath, relsPath, version = 'unknown'] = process.argv.slice(2)
if (!nodesPath || !componentsPath || !relsPath) {
  console.error('usage: lc-import <nodes> <components> <relationships> <version>')
  process.exit(1)
}

interface LcNode {
  identifier: string
  labels: string[]
  properties: Record<string, unknown>
}
interface LcRel {
  properties: { relationshipType: string; sourceEntity: string; targetEntity: string }
  source_identifier: string
  target_identifier: string
}

const lines = (p: string) => readFileSync(p, 'utf8').split('\n').filter(Boolean)
const nodes = lines(nodesPath).map((l) => JSON.parse(l) as LcNode)
const components = lines(componentsPath).map((l) => JSON.parse(l) as LcNode)
const rels = lines(relsPath).map((l) => JSON.parse(l) as LcRel)

const wanted = new Set(imStandardCodes())
const standards = nodes
  .filter((n) => n.labels.includes('StandardsFrameworkItem') && wanted.has(String(n.properties.statementCode ?? '')))
  .map((n) => ({
    id: `CCSS.${String(n.properties.statementCode)}`,
    code: String(n.properties.statementCode),
    lc_identifier: n.identifier,
    case_uuid: String(n.properties.caseIdentifierUUID),
    description: String(n.properties.description ?? ''),
  }))
const byCase = new Map(standards.map((s) => [s.case_uuid, s]))
const byIdent = new Map(standards.map((s) => [s.lc_identifier, s]))
const missing = [...wanted].filter((c) => !standards.some((s) => s.code === c))

type Std = (typeof standards)[number]
const resolve = (k: string): Std | undefined => byCase.get(k) ?? byIdent.get(k)
const buildsToward = rels
  .filter((r) => r.properties.relationshipType === 'buildsTowards')
  .map((r) => ({ from: resolve(r.source_identifier), to: resolve(r.target_identifier) }))
  .filter((e): e is { from: Std; to: Std } => Boolean(e.from && e.to))
  .map((e) => ({ from: e.from.id, to: e.to.id }))

const supports = rels
  .filter((r) => r.properties.relationshipType === 'supports' && r.properties.sourceEntity === 'LearningComponent')
  .map((r) => ({ component: r.source_identifier, standard: resolve(r.target_identifier) }))
  .filter((e): e is { component: string; standard: Std } => Boolean(e.standard))
const componentIds = new Set(supports.map((s) => s.component))
const compById = new Map(components.map((c) => [c.identifier, c]))
const componentsOut = [...componentIds]
  .map((id) => compById.get(id))
  .filter((c): c is LcNode => Boolean(c))
  .map((c) => ({
    id: `LC.${c.identifier.slice(0, 8)}`,
    lc_identifier: c.identifier,
    name: String(c.properties.description ?? c.properties.name ?? ''),
    standard_ids: [...new Set(supports.filter((s) => s.component === c.identifier).map((s) => s.standard.id))],
  }))

const out = {
  source: 'learning_commons',
  version,
  license: 'CC BY 4.0, Learning Commons; progressions CC0 from Student Achievement Partners; components CC BY 4.0 from Achievement Network',
  imported_at: new Date().toISOString(),
  standards: standards.sort((a, b) => a.code.localeCompare(b.code)),
  components: componentsOut,
  builds_toward: buildsToward,
  missing_codes: missing,
}
writeFileSync('src/graph/data/lc-math.json', JSON.stringify(out, null, 1))
console.log(`standards ${standards.length}, components ${componentsOut.length}, builds_toward ${buildsToward.length}, missing ${missing.length}: ${missing.join(' ')}`)
