import type { Course, Lesson, Outcome, Unit } from '@/model'
import lcMath from './data/lc-math.json'
import { IM_COURSES } from './authored/im-sequence'
import { AUTHORED_COURSES } from './authored/courses'
import { cognitiveOutcomes } from './authored/cognitive-skills'
import { habitOutcomes } from './authored/habits'
import { elaOutcomes } from './authored/ela-standards'

export interface LcMathData {
  source: string
  version: string
  license: string
  standards: { id: string; code: string; lc_identifier: string; case_uuid: string; description: string }[]
  components: { id: string; lc_identifier: string; name: string; standard_ids: string[] }[]
  builds_toward: { from: string; to: string }[]
  missing_codes: string[]
}
export const LC_MATH = lcMath as LcMathData

const MATH_DOMAINS: Record<string, string> = {
  'HSN-RN': 'Number: the real number system',
  'HSN-Q': 'Number: quantities',
  'HSN-CN': 'Number: complex numbers',
  'HSA-SSE': 'Algebra: seeing structure in expressions',
  'HSA-APR': 'Algebra: polynomials and rational expressions',
  'HSA-CED': 'Algebra: creating equations',
  'HSA-REI': 'Algebra: reasoning with equations and inequalities',
  'HSF-IF': 'Functions: interpreting functions',
  'HSF-BF': 'Functions: building functions',
  'HSF-LE': 'Functions: linear, quadratic, and exponential models',
  'HSF-TF': 'Functions: trigonometric functions',
  'HSG-CO': 'Geometry: congruence',
  'HSG-SRT': 'Geometry: similarity, right triangles, and trigonometry',
  'HSG-C': 'Geometry: circles',
  'HSG-GPE': 'Geometry: expressing properties with equations',
  'HSG-GMD': 'Geometry: measurement and dimension',
  'HSG-MG': 'Geometry: modeling with geometry',
  'HSS-ID': 'Statistics: interpreting data',
  'HSS-IC': 'Statistics: making inferences',
  'HSS-CP': 'Statistics: conditional probability',
  'HSS-MD': 'Statistics: using probability to make decisions',
}

export function mathDomainOf(code: string): string {
  const key = code.split('.')[0]
  return MATH_DOMAINS[key] ?? 'Mathematics'
}

function shortName(description: string): string {
  const first = description.split(/(?<=[a-z0-9])\. /)[0]
  const clean = first.replace(/\*/g, '').trim()
  return clean.length > 96 ? clean.slice(0, 93).trimEnd() + '...' : clean
}

export function mathOutcomes(): Outcome[] {
  const prereqs = new Map<string, string[]>()
  for (const e of LC_MATH.builds_toward) prereqs.set(e.to, [...(prereqs.get(e.to) ?? []), e.from])
  return LC_MATH.standards.map((s) => ({
    id: s.id,
    family: 'content',
    domain: mathDomainOf(s.code),
    name: shortName(s.description),
    description: s.description,
    level_expectations: null,
    validation: 'standard_mastery',
    prerequisites: prereqs.get(s.id) ?? [],
  }))
}

export function allOutcomes(): Outcome[] {
  return [...cognitiveOutcomes(), ...habitOutcomes(), ...mathOutcomes(), ...elaOutcomes()]
}

export interface Catalog {
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
}

const pad = (n: number) => String(n).padStart(2, '0')

export function buildCatalog(): Catalog {
  const courses: Course[] = []
  const units: Unit[] = []
  const lessons: Lesson[] = []

  for (const c of IM_COURSES) {
    const unitIds: string[] = []
    c.units.forEach((u, ui) => {
      const unitId = `unit_${c.id.replace('crs_', '')}_u${ui + 1}`
      unitIds.push(unitId)
      const stds = u.standards.map((code) => `CCSS.${code}`)
      let prev: string | null = null
      u.lessons.forEach((title, li) => {
        const id = `les_${c.id.replace('crs_', '')}_u${ui + 1}_l${pad(li + 1)}`
        const a = stds[li % stds.length]
        const b = stds[(li + 1) % stds.length]
        lessons.push({
          id,
          unit_id: unitId,
          sequence: li + 1,
          title,
          outcomes_served: a === b ? [a] : [a, b],
          prerequisites: prev ? [prev] : [],
          modes: ['self_directed', 'workshop'],
          estimated_minutes: 45,
          kira_ref: `kira:${c.id.replace('crs_', '')}:u${ui + 1}:l${pad(li + 1)}`,
          materials_url: null,
        })
        prev = id
      })
      units.push({ id: unitId, course_id: c.id, sequence: ui + 1, title: u.title, outcomes_served: stds, estimated_slots: u.lessons.length })
    })
    courses.push({ id: c.id, title: c.title, curriculum: 'im', levels: ['expose', 'explore', 'pursue', 'launch'], units: unitIds })
  }

  for (const c of AUTHORED_COURSES) {
    const unitIds: string[] = []
    c.units.forEach((u, ui) => {
      const unitId = `unit_${c.id.replace('crs_', '')}_u${ui + 1}`
      unitIds.push(unitId)
      let prev: string | null = null
      u.lessons.forEach((title, li) => {
        const id = `les_${c.id.replace('crs_', '')}_u${ui + 1}_l${pad(li + 1)}`
        const a = u.skills[li % u.skills.length]
        const b = u.skills[(li + 1) % u.skills.length]
        const modes = u.modes ?? ['self_directed', 'workshop']
        lessons.push({
          id,
          unit_id: unitId,
          sequence: li + 1,
          title,
          outcomes_served: a === b ? [a] : [a, b],
          prerequisites: prev ? [prev] : [],
          modes: li % 4 === 3 ? modes : modes.filter((m) => m !== 'lab' && m !== 'seminar').length ? modes.filter((m) => m !== 'lab' && m !== 'seminar') : modes,
          estimated_minutes: c.subject === 'science' ? 50 : 45,
          kira_ref: c.subject === 'science' ? `kira:${c.id.replace('crs_', '')}:u${ui + 1}:l${pad(li + 1)}` : null,
          materials_url: null,
        })
        prev = id
      })
      units.push({ id: unitId, course_id: c.id, sequence: ui + 1, title: u.title, outcomes_served: u.skills, estimated_slots: u.lessons.length })
    })
    courses.push({ id: c.id, title: c.title, curriculum: c.curriculum, levels: ['expose', 'explore', 'pursue', 'launch'], units: unitIds })
  }

  return { courses, units, lessons }
}

/** Which content expert subject a course belongs to. */
export function subjectOfCourse(courseId: string): 'math' | 'science' | 'english' | 'history' {
  if (courseId.startsWith('crs_im')) return 'math'
  const c = AUTHORED_COURSES.find((x) => x.id === courseId)
  return c?.subject ?? 'english'
}
