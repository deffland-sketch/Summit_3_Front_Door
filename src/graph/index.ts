/**
 * The knowledge graph (Spec 10): typed, unweighted edges over outcomes, lessons, experiences,
 * credentials, careers, and pathways. All walks are bounded to three hops.
 */
import type { Lesson, Outcome } from '@/model'
import { COGNITIVE_DOMAINS, cognitiveProgressionEdges } from './authored/cognitive-skills'
import { HABIT_BLOCKS, habitProgressionEdges } from './authored/habits'
import { elaStandards } from './authored/ela-standards'
import { CAREERS, CREDENTIALS, EXPERIENCE_TEMPLATES, PATHWAYS } from './authored/pathways'
import { LC_MATH, allOutcomes, buildCatalog } from './catalog'

export type NodeType =
  | 'CognitiveSkill'
  | 'CognitiveDomain'
  | 'Habit'
  | 'HabitBlock'
  | 'MathStandard'
  | 'MathComponent'
  | 'ELAStandard'
  | 'Lesson'
  | 'ExperienceTemplate'
  | 'Credential'
  | 'Career'
  | 'Pathway'

export type EdgeType = 'builds_toward' | 'supports' | 'teaches' | 'requires' | 'leads_to' | 'member_of' | 'aligned_with'
export type EdgeSource = 'learning_commons' | 'summit_rubric' | 'authored' | 'futre'

export interface GraphNode {
  id: string
  type: NodeType
  name: string
  meta?: Record<string, string | number | string[]>
}
export interface GraphEdge {
  from: string
  to: string
  type: EdgeType
  source: EdgeSource
  confidence: number
}

export interface KnowledgeGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  out: Map<string, GraphEdge[]>
  in: Map<string, GraphEdge[]>
  source_label: string
  counts: { nodes: number; edges: number; by_type: Record<string, number>; by_edge: Record<string, number> }
}

export interface Walk {
  node: GraphNode
  via: GraphEdge[]
}

function add(g: KnowledgeGraph, n: GraphNode) {
  g.nodes.set(n.id, n)
}
function link(g: KnowledgeGraph, e: GraphEdge) {
  if (!g.nodes.has(e.from) || !g.nodes.has(e.to)) return
  g.edges.push(e)
  g.out.set(e.from, [...(g.out.get(e.from) ?? []), e])
  g.in.set(e.to, [...(g.in.get(e.to) ?? []), e])
}

export function buildGraph(outcomes: Outcome[] = allOutcomes(), lessons: Lesson[] = buildCatalog().lessons): KnowledgeGraph {
  const g: KnowledgeGraph = {
    nodes: new Map(),
    edges: [],
    out: new Map(),
    in: new Map(),
    source_label: LC_MATH.standards.length ? `Learning Commons ${LC_MATH.version} for math; Summit rubric and authored edges for the rest` : 'authored fallback',
    counts: { nodes: 0, edges: 0, by_type: {}, by_edge: {} },
  }

  for (const d of COGNITIVE_DOMAINS) add(g, { id: d.id, type: 'CognitiveDomain', name: d.name })
  for (const b of HABIT_BLOCKS) add(g, { id: b.id, type: 'HabitBlock', name: b.name })
  for (const o of outcomes) {
    if (o.family === 'cognitive') add(g, { id: o.id, type: 'CognitiveSkill', name: o.name, meta: { domain: o.domain } })
    else if (o.family === 'durable') add(g, { id: o.id, type: 'Habit', name: o.name, meta: { block: o.domain } })
    else if (o.id.startsWith('CCSS.ELA')) add(g, { id: o.id, type: 'ELAStandard', name: o.name })
    else add(g, { id: o.id, type: 'MathStandard', name: o.name, meta: { domain: o.domain, code: o.id.replace('CCSS.', '') } })
  }
  for (const c of LC_MATH.components) add(g, { id: c.id, type: 'MathComponent', name: c.name })
  for (const l of lessons) add(g, { id: l.id, type: 'Lesson', name: l.title, meta: { unit_id: l.unit_id } })
  for (const x of EXPERIENCE_TEMPLATES) add(g, { id: x.id, type: 'ExperienceTemplate', name: x.title, meta: { level: x.level, provider_kind: x.provider_kind } })
  for (const c of CREDENTIALS) add(g, { id: c.id, type: 'Credential', name: c.title, meta: { kind: c.kind } })
  for (const c of CAREERS) add(g, { id: c.id, type: 'Career', name: c.title, meta: { cluster: c.cluster, wage_band: c.wage_band } })
  for (const p of PATHWAYS) add(g, { id: p.id, type: 'Pathway', name: p.title, meta: { career_ids: p.career_ids } })

  // member_of
  for (const d of COGNITIVE_DOMAINS) for (const s of d.skills) link(g, { from: s.id, to: d.id, type: 'member_of', source: 'summit_rubric', confidence: 1 })
  for (const b of HABIT_BLOCKS) for (const h of b.habits) link(g, { from: h.id, to: b.id, type: 'member_of', source: 'summit_rubric', confidence: 1 })
  // builds_toward
  for (const e of cognitiveProgressionEdges()) link(g, { ...e, type: 'builds_toward', source: 'summit_rubric', confidence: 0.7 })
  for (const e of habitProgressionEdges()) link(g, { ...e, type: 'builds_toward', source: 'summit_rubric', confidence: 0.7 })
  for (const e of LC_MATH.builds_toward) link(g, { ...e, type: 'builds_toward', source: 'learning_commons', confidence: 1 })
  // supports
  for (const c of LC_MATH.components) for (const s of c.standard_ids) link(g, { from: c.id, to: s, type: 'supports', source: 'learning_commons', confidence: 1 })
  for (const s of elaStandards()) for (const skill of s.supports) link(g, { from: s.id, to: skill, type: 'supports', source: 'authored', confidence: 0.7 })
  // teaches
  for (const l of lessons) for (const o of l.outcomes_served) link(g, { from: l.id, to: o, type: 'teaches', source: 'authored', confidence: 0.7 })
  for (const x of EXPERIENCE_TEMPLATES) {
    for (const o of x.teaches) link(g, { from: x.id, to: o, type: 'teaches', source: 'authored', confidence: 0.7 })
    for (const r of x.requires) link(g, { from: x.id, to: r, type: 'requires', source: 'authored', confidence: 0.7 })
    for (const t of x.leads_to) link(g, { from: x.id, to: t, type: 'leads_to', source: 'authored', confidence: 0.7 })
  }
  for (const c of CREDENTIALS) {
    for (const r of c.requires) link(g, { from: c.id, to: r, type: 'requires', source: 'authored', confidence: 0.7 })
    for (const t of c.leads_to) link(g, { from: c.id, to: t, type: 'leads_to', source: 'authored', confidence: 0.7 })
  }
  for (const p of PATHWAYS) {
    for (const r of p.requires) link(g, { from: p.id, to: r, type: 'requires', source: 'authored', confidence: 0.7 })
    for (const c of p.career_ids) link(g, { from: p.id, to: c, type: 'leads_to', source: 'authored', confidence: 0.7 })
    for (const x of p.experiences) link(g, { from: x, to: p.id, type: 'member_of', source: 'authored', confidence: 0.7 })
  }

  g.counts.nodes = g.nodes.size
  g.counts.edges = g.edges.length
  for (const n of g.nodes.values()) g.counts.by_type[n.type] = (g.counts.by_type[n.type] ?? 0) + 1
  for (const e of g.edges) g.counts.by_edge[e.type] = (g.counts.by_edge[e.type] ?? 0) + 1
  return g
}

let cached: KnowledgeGraph | null = null
export function getGraph(): KnowledgeGraph {
  if (!cached) cached = buildGraph()
  return cached
}

const inOf = (g: KnowledgeGraph, id: string, type: EdgeType) => (g.in.get(id) ?? []).filter((e) => e.type === type)
const outOf = (g: KnowledgeGraph, id: string, type: EdgeType) => (g.out.get(id) ?? []).filter((e) => e.type === type)

/** Lessons and experience templates that teach the outcome, plus outcomes one hop back on builds_toward. */
export function whatServes(g: KnowledgeGraph, outcomeId: string): Walk[] {
  const walks: Walk[] = []
  for (const e of inOf(g, outcomeId, 'teaches')) walks.push({ node: g.nodes.get(e.from)!, via: [e] })
  for (const e of inOf(g, outcomeId, 'builds_toward')) {
    const prior = g.nodes.get(e.from)!
    walks.push({ node: prior, via: [e] })
    for (const t of inOf(g, prior.id, 'teaches')) walks.push({ node: g.nodes.get(t.from)!, via: [t, e] })
  }
  return dedupe(walks)
}

/** Outcomes one hop forward on builds_toward; credentials and pathways that require this outcome. */
export function whatUnlocks(g: KnowledgeGraph, outcomeId: string): Walk[] {
  const walks: Walk[] = []
  for (const e of outOf(g, outcomeId, 'builds_toward')) walks.push({ node: g.nodes.get(e.to)!, via: [e] })
  for (const e of inOf(g, outcomeId, 'requires')) {
    const n = g.nodes.get(e.from)!
    if (n.type === 'Credential' || n.type === 'Pathway' || n.type === 'ExperienceTemplate') walks.push({ node: n, via: [e] })
  }
  return dedupe(walks)
}

/** requires edges of a credential or pathway not satisfied by the validated set, expanded through credentials, three hops. */
export function gapsTo(g: KnowledgeGraph, targetId: string, validated: Set<string>): Walk[] {
  const gaps: Walk[] = []
  const seen = new Set<string>()
  const walk = (id: string, via: GraphEdge[], depth: number) => {
    if (depth > 3) return
    for (const e of outOf(g, id, 'requires')) {
      const n = g.nodes.get(e.to)!
      if (validated.has(n.id) || seen.has(n.id)) continue
      if (n.type === 'Credential') {
        seen.add(n.id)
        gaps.push({ node: n, via: [...via, e] })
        walk(n.id, [...via, e], depth + 1)
      } else {
        seen.add(n.id)
        gaps.push({ node: n, via: [...via, e] })
      }
    }
  }
  walk(targetId, [], 1)
  return gaps
}

/** Pathways whose required outcomes overlap the validated set, ranked by overlap, with a bonus for a matching target career. */
export function pathwaysNear(g: KnowledgeGraph, validated: Set<string>, targetCareerIds: string[] = []): { pathway: GraphNode; overlap: number; matches_career: boolean; gaps: number }[] {
  const out: { pathway: GraphNode; overlap: number; matches_career: boolean; gaps: number }[] = []
  for (const n of g.nodes.values()) {
    if (n.type !== 'Pathway') continue
    const req = outOf(g, n.id, 'requires').map((e) => e.to)
    const overlap = req.filter((r) => validated.has(r)).length
    const careers = outOf(g, n.id, 'leads_to').map((e) => e.to)
    const matches = careers.some((c) => targetCareerIds.includes(c))
    out.push({ pathway: n, overlap, matches_career: matches, gaps: req.length - overlap })
  }
  return out.sort((a, b) => Number(b.matches_career) - Number(a.matches_career) || b.overlap - a.overlap || a.gaps - b.gaps)
}

/** The shortest chain of builds_toward edges from outcome a to outcome b (breadth first, at most eight hops), or null. */
export function shortestPath(g: KnowledgeGraph, a: string, b: string, maxHops = 8): Walk | null {
  if (!g.nodes.has(a) || !g.nodes.has(b)) return null
  if (a === b) return { node: g.nodes.get(a)!, via: [] }
  const prev = new Map<string, GraphEdge>()
  let frontier = [a]
  const seen = new Set([a])
  for (let hop = 0; hop < maxHops && frontier.length; hop++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const e of outOf(g, id, 'builds_toward')) {
        if (seen.has(e.to)) continue
        seen.add(e.to)
        prev.set(e.to, e)
        if (e.to === b) {
          const via: GraphEdge[] = []
          for (let cur = b; cur !== a; ) {
            const edge = prev.get(cur)!
            via.unshift(edge)
            cur = edge.from
          }
          return { node: g.nodes.get(b)!, via }
        }
        next.push(e.to)
      }
    }
    frontier = next
  }
  return null
}

/** Pathways an experience template is part of, directly or through a credential it leads to. */
export function pathwaysOf(g: KnowledgeGraph, templateId: string): Walk[] {
  const walks: Walk[] = []
  for (const e of outOf(g, templateId, 'member_of')) walks.push({ node: g.nodes.get(e.to)!, via: [e] })
  for (const e of outOf(g, templateId, 'leads_to')) {
    const cred = g.nodes.get(e.to)!
    if (cred.type === 'Pathway') walks.push({ node: cred, via: [e] })
    if (cred.type !== 'Credential') continue
    for (const r of inOf(g, cred.id, 'requires')) {
      const p = g.nodes.get(r.from)!
      if (p.type === 'Pathway') walks.push({ node: p, via: [e, r] })
    }
  }
  return dedupe(walks)
}

/** ELA standards and math components with a supports edge into the outcome. */
export function underneath(g: KnowledgeGraph, outcomeId: string): Walk[] {
  return inOf(g, outcomeId, 'supports').map((e) => ({ node: g.nodes.get(e.from)!, via: [e] }))
}

/** Every edge touching a node, for the graph browser. */
export function neighborhood(g: KnowledgeGraph, id: string): { node: GraphNode; out: GraphEdge[]; in: GraphEdge[] } | null {
  const node = g.nodes.get(id)
  if (!node) return null
  return { node, out: g.out.get(id) ?? [], in: g.in.get(id) ?? [] }
}

/** A plain-words sentence for a walk: "Argument writing builds toward Analyzing arguments, which the newsroom placement asks for". */
export function describeWalk(g: KnowledgeGraph, w: Walk): string {
  const verbs: Record<EdgeType, string> = {
    builds_toward: 'builds toward',
    supports: 'sits under',
    teaches: 'builds',
    requires: 'asks for',
    leads_to: 'leads to',
    member_of: 'is part of',
    aligned_with: 'lines up with',
  }
  return w.via.map((e) => `${g.nodes.get(e.from)?.name ?? e.from} ${verbs[e.type]} ${g.nodes.get(e.to)?.name ?? e.to}`).join(', and ')
}

function dedupe(walks: Walk[]): Walk[] {
  const seen = new Set<string>()
  return walks.filter((w) => {
    if (seen.has(w.node.id)) return false
    seen.add(w.node.id)
    return true
  })
}
