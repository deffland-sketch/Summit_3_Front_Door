import { describe, expect, it } from 'vitest'
import { allOutcomes, buildCatalog, LC_MATH } from './catalog'
import { buildGraph, gapsTo, pathwaysNear, underneath, whatServes, whatUnlocks } from './index'

const catalog = buildCatalog()
const outcomes = allOutcomes()
const outcomeIds = new Set(outcomes.map((o) => o.id))
const graph = buildGraph(outcomes, catalog.lessons)

describe('catalog', () => {
  it('has ten courses with units and lessons in range', () => {
    expect(catalog.courses).toHaveLength(10)
    for (const c of catalog.courses) {
      const units = catalog.units.filter((u) => u.course_id === c.id)
      expect(units.length).toBeGreaterThanOrEqual(6)
      expect(units.length).toBeLessThanOrEqual(8)
      for (const u of units) {
        const n = catalog.lessons.filter((l) => l.unit_id === u.id).length
        expect(n).toBeGreaterThanOrEqual(8)
        expect(n).toBeLessThanOrEqual(13)
      }
    }
  })

  it('tags every lesson to at least one known outcome, math to CCSS only, the rest to cognitive skills only', () => {
    for (const l of catalog.lessons) {
      expect(l.outcomes_served.length).toBeGreaterThan(0)
      for (const o of l.outcomes_served) expect(outcomeIds.has(o), `${l.id} -> ${o}`).toBe(true)
      if (l.id.startsWith('les_im')) expect(l.outcomes_served.every((o) => o.startsWith('CCSS.HS'))).toBe(true)
      else expect(l.outcomes_served.every((o) => o.startsWith('CS.'))).toBe(true)
    }
  })

  it('has the outcome counts Spec 1 asks for', () => {
    const by = (f: string) => outcomes.filter((o) => o.family === f).length
    expect(by('cognitive')).toBe(36)
    expect(by('durable')).toBe(16)
    expect(outcomes.filter((o) => o.id.startsWith('CCSS.HS')).length).toBeGreaterThanOrEqual(110)
    expect(outcomes.filter((o) => o.id.startsWith('CCSS.ELA')).length).toBeGreaterThanOrEqual(55)
    expect(LC_MATH.missing_codes).toHaveLength(0)
  })
})

describe('knowledge graph', () => {
  it('loads with counts and a Learning Commons source label', () => {
    expect(graph.counts.nodes).toBeGreaterThan(800)
    expect(graph.counts.by_edge.builds_toward).toBeGreaterThan(100)
    expect(graph.source_label).toContain('Learning Commons')
  })

  it('underneath Argumentative claim returns at least three ELA standards', () => {
    const under = underneath(graph, 'CS.WRI.CLAIM').filter((w) => w.node.type === 'ELAStandard')
    expect(under.length).toBeGreaterThanOrEqual(3)
  })

  it('whatServes a math standard returns a lesson, and a math standard has components beneath it', () => {
    const served = whatServes(graph, 'CCSS.HSA-REI.C.6')
    expect(served.some((w) => w.node.type === 'Lesson')).toBe(true)
    expect(underneath(graph, 'CCSS.HSA-REI.C.6').some((w) => w.node.type === 'MathComponent')).toBe(true)
  })

  it('whatUnlocks follows builds_toward and requires', () => {
    const unlocks = whatUnlocks(graph, 'CCSS.HSF-IF.A.1')
    expect(unlocks.length).toBeGreaterThan(0)
    expect(unlocks.some((w) => w.node.type === 'Credential' || w.node.type === 'Pathway')).toBe(true)
  })

  it('gapsTo a pathway shrinks as outcomes are validated', () => {
    const none = gapsTo(graph, 'PW.NURSING', new Set())
    expect(none.length).toBeGreaterThan(3)
    const some = gapsTo(graph, 'PW.NURSING', new Set(['CS.ANA.INTERPRET', 'CS.PRD.PRECISION', 'CR.BLS']))
    expect(some.length).toBeLessThan(none.length)
  })

  it('pathwaysNear ranks a matching career first', () => {
    const near = pathwaysNear(graph, new Set(['CS.WRI.CLAIM', 'CS.SRC.CONTEXT']), ['CA.REPORTER'])
    expect(near[0].pathway.id).toBe('PW.JOURNALISM')
  })
})
