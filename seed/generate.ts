/**
 * Deterministic sandbox generator (Spec 1). Writes /public/sandbox/*.json.
 * Run: npm run seed
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import type {
  Adult, Assignment, Course, EngineTrace, Evidence, FutreRecord, GatheringLogEntry, Group, Lesson, Level, Offering, Place, Plan, Sandbox, Slot, Student, Touchpoint, Unit, Weekday,
} from '../src/model'
import { DEFAULT_SETTINGS, SandboxSchema } from '../src/model'
import { allOutcomes, buildCatalog } from '../src/graph/catalog'
import { CAREERS, EXPERIENCE_TEMPLATES, PATHWAYS } from '../src/graph/authored/pathways'
import { HABIT_BLOCKS } from '../src/graph/authored/habits'
import { createRng } from '../src/lib/rng'
import { dateOf, isoAt, shiftDate, weekDates, weekdayOf } from '../src/lib/time'
import { buildAllWeeks, chooseForSlot, offeringFromProposal, optionsForSlot, proposeWorkshops, resetSlotCounter } from '../src/engine'
import { BLOCKS } from '../src/engine/types'
import { ADULT_NAMES, FIRST_NAMES, LAST_NAMES, PARTNERS } from './names'
import { ADULT_OBSERVATIONS, FOLLOW_UPS, FUTRE_REFLECTIONS, GOALS, HABIT_REFLECTIONS, REFLECTIONS, STUDENT_NOTES, TOUCHPOINT_NOTES, VISIONS } from './text'

const SEED = 20261019
const WEEK_START = '2026-10-19'
const TODAY = '2026-10-20'
const PUBLISHED_AT = '2026-10-16T17:00:00.000Z'
const PAST_WEEKS = 8
const rng = createRng(SEED)
const pad = (n: number, w = 3) => String(n).padStart(w, '0')

// ---------- catalog ----------
const catalog = buildCatalog()
const outcomes = allOutcomes()
const outcomeById = new Map(outcomes.map((o) => [o.id, o]))
const courses: Course[] = catalog.courses
const units: Unit[] = catalog.units
const lessons: Lesson[] = catalog.lessons
const lessonsByUnit = new Map<string, Lesson[]>()
for (const l of lessons) lessonsByUnit.set(l.unit_id, [...(lessonsByUnit.get(l.unit_id) ?? []), l])
const unitsByCourse = (cid: string) => units.filter((u) => u.course_id === cid).sort((a, b) => a.sequence - b.sequence)
const courseLessons = (cid: string) => unitsByCourse(cid).flatMap((u) => (lessonsByUnit.get(u.id) ?? []).sort((a, b) => a.sequence - b.sequence))
const unitOf = (l: Lesson) => units.find((u) => u.id === l.unit_id)!

// ---------- places ----------
const places: Place[] = [
  { id: 'pl_commons', name: 'Home base commons', kind: 'hub', capacity: 40, adults_required: 2 },
  { id: 'pl_room_101', name: 'Room 101', kind: 'classroom', capacity: 24, adults_required: 1 },
  { id: 'pl_room_102', name: 'Room 102', kind: 'classroom', capacity: 24, adults_required: 1 },
  { id: 'pl_room_103', name: 'Room 103', kind: 'classroom', capacity: 16, adults_required: 1 },
  { id: 'pl_room_104', name: 'Room 104', kind: 'classroom', capacity: 8, adults_required: 1 },
  { id: 'pl_sem_a', name: 'Seminar room A', kind: 'seminar_room', capacity: 10, adults_required: 1 },
  { id: 'pl_sem_b', name: 'Seminar room B', kind: 'seminar_room', capacity: 10, adults_required: 1 },
  { id: 'pl_nook_1', name: 'Mentor nook 1', kind: 'nook', capacity: 2, adults_required: 1 },
  { id: 'pl_nook_2', name: 'Mentor nook 2', kind: 'nook', capacity: 2, adults_required: 1 },
  { id: 'pl_gym', name: 'Gym', kind: 'gym', capacity: 100, adults_required: 2 },
  { id: 'pl_offcampus', name: 'Off campus', kind: 'off_campus', capacity: 30, adults_required: 0 },
  ...PARTNERS.map((p) => ({ id: p.place, name: p.placeName, kind: 'partner_site' as const, capacity: 15, adults_required: 0 })),
]

// ---------- adults ----------
const fullWeek = (kind: 'teaching' | 'circulation'): Adult['availability'] =>
  (['mon', 'tue', 'wed', 'thu', 'fri'] as Weekday[]).map((day) => ({ day, start: '08:30', end: '15:30', kind }))
const adults: Adult[] = [
  { id: 'adu_director', display_name: ADULT_NAMES.director, capacities: ['leader'], subjects: [], mentees: [], availability: fullWeek('circulation'), external_org: null },
  { id: 'adu_coordinator', display_name: ADULT_NAMES.coordinator, capacities: ['system_architect', 'facilitator'], subjects: [], mentees: [], availability: fullWeek('circulation'), external_org: null },
  { id: 'adu_ops', display_name: ADULT_NAMES.ops, capacities: ['leader'], subjects: [], mentees: [], availability: fullWeek('circulation'), external_org: null },
  { id: 'adu_mentor_1', display_name: ADULT_NAMES.mentor1, capacities: ['mentor', 'facilitator'], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_mentor_2', display_name: ADULT_NAMES.mentor2, capacities: ['mentor', 'facilitator'], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_mentor_3', display_name: ADULT_NAMES.mentor3, capacities: ['mentor', 'facilitator'], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_mentor_4', display_name: ADULT_NAMES.mentor4, capacities: ['mentor', 'facilitator'], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_math', display_name: ADULT_NAMES.math, capacities: ['content_expert', 'facilitator'], subjects: ['crs_im1', 'crs_im2', 'crs_im3'], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_science', display_name: ADULT_NAMES.science, capacities: ['content_expert', 'facilitator'], subjects: ['crs_bio', 'crs_chem', 'crs_phys'], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_english', display_name: ADULT_NAMES.english, capacities: ['content_expert', 'facilitator'], subjects: ['crs_aplang', 'crs_aplit'], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_history', display_name: ADULT_NAMES.history, capacities: ['content_expert', 'facilitator'], subjects: ['crs_apworld', 'crs_apush'], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_coach', display_name: ADULT_NAMES.coach, capacities: ['facilitator', 'content_expert'], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: null },
  { id: 'adu_case', display_name: ADULT_NAMES.case, capacities: ['case_manager'], subjects: [], mentees: [], availability: fullWeek('circulation'), external_org: null },
  ...PARTNERS.map((p) => ({ id: p.id, display_name: p.name, capacities: ['partner' as const], subjects: [], mentees: [], availability: fullWeek('teaching'), external_org: p.org })),
]
const mentorIds = ['adu_mentor_1', 'adu_mentor_2', 'adu_mentor_3', 'adu_mentor_4']

// ---------- students ----------
const levelPool: Level[] = [...Array<Level>(35).fill('expose'), ...Array<Level>(35).fill('explore'), ...Array<Level>(20).fill('pursue'), ...Array<Level>(10).fill('launch')]
const levels = rng.shuffle(levelPool)
const SUPPORT_KINDS = ['five_minute_warning', 'printed_roster', 'large_text', 'quiet_space', 'check_in_first', 'extended_time'] as const
const SUPPORT_NOTES: Record<string, string> = {
  five_minute_warning: 'A heads-up five minutes before each move',
  printed_roster: 'A printed copy of the day each morning',
  large_text: 'Large text on screens and handouts',
  quiet_space: 'A quiet space for independent work',
  check_in_first: 'A quick check-in before the first block',
  extended_time: 'Extra time on timed work',
}
const students: Student[] = []
const usedNames = new Set<string>()
for (let i = 0; i < 100; i++) {
  let name = ''
  do name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${rng.pick(LAST_NAMES)}`
  while (usedNames.has(name))
  usedNames.add(name)
  const level = levels[i]
  const mentor = mentorIds[i % 4]
  const hasSupports = rng.chance(0.2)
  const supports = hasSupports ? rng.shuffle(SUPPORT_KINDS).slice(0, rng.int(1, 2)).map((kind) => ({ kind, note: SUPPORT_NOTES[kind] })) : []
  const protected_slots = hasSupports
    ? [{ day: rng.pick(['mon', 'tue', 'wed', 'thu'] as Weekday[]), start: rng.pick(['10:00', '10:45', '13:30']), end: '' }].map((p) => ({ ...p, end: p.start === '10:00' ? '10:45' : p.start === '10:45' ? '11:30' : '14:15' }))
    : []
  const life_constraints = rng.chance(0.08)
    ? [rng.pick([
        { day: 'fri' as Weekday, start: '13:30', end: '15:30', label: 'Work shift starts at 2' },
        { day: 'mon' as Weekday, start: '14:15', end: '15:30', label: 'Picks up my brother' },
        { day: 'wed' as Weekday, start: '09:15', end: '10:00', label: 'Bus gets in late on Wednesdays' },
      ])]
    : []
  const autonomy = level === 'launch' ? 'owned' : level === 'pursue' ? (rng.chance(0.6) ? 'owned' : 'shared') : level === 'explore' ? (rng.chance(0.7) ? 'shared' : 'guided') : rng.chance(0.85) ? 'guided' : 'shared'
  students.push({
    id: `stu_${pad(i + 1)}`,
    display_name: name,
    level,
    mentor_id: mentor,
    community_group_id: `grp_community_${(i % 4) + 1}`,
    plan_autonomy: autonomy,
    supports,
    protected_slots,
    life_constraints,
    futre_student_id: `futre_${pad(i + 1)}`,
    notification_prefs: { channel: supports.some((s) => s.kind === 'printed_roster') ? 'board' : rng.pick(['banner', 'banner', 'mentor', 'email']), warning_minutes: supports.some((s) => s.kind === 'five_minute_warning') ? 5 : 0 },
    locale: rng.chance(0.15) ? 'es' : 'en',
    text_size: supports.some((s) => s.kind === 'large_text') ? 'large' : 'default',
    reduced_motion: rng.chance(0.05),
    dark_mode: rng.chance(0.1),
  })
}
for (const m of mentorIds) adults.find((a) => a.id === m)!.mentees = students.filter((s) => s.mentor_id === m).map((s) => s.id)

const groups: Group[] = [
  ...[1, 2, 3, 4].map((n) => ({ id: `grp_community_${n}`, kind: 'community' as const, name: ['Cedar', 'Madrone', 'Manzanita', 'Oak'][n - 1], student_ids: students.filter((s) => s.community_group_id === `grp_community_${n}`).map((s) => s.id), adult_ids: [mentorIds[n - 1]], approved_by: 'adu_coordinator' })),
]

// ---------- course placement and assignments ----------
const MATH_BY_LEVEL: Record<Level, [string, number][]> = {
  expose: [['crs_im1', 0.6], ['crs_im2', 0.3], ['crs_im3', 0.1]],
  explore: [['crs_im1', 0.3], ['crs_im2', 0.45], ['crs_im3', 0.25]],
  pursue: [['crs_im1', 0.12], ['crs_im2', 0.33], ['crs_im3', 0.55]],
  launch: [['crs_im1', 0.05], ['crs_im2', 0.25], ['crs_im3', 0.7]],
}
function weighted(pairs: [string, number][]): string {
  const r = rng.next()
  let acc = 0
  for (const [v, w] of pairs) {
    acc += w
    if (r < acc) return v
  }
  return pairs[pairs.length - 1][0]
}
interface Placement {
  course_id: string
  position: number // index into courseLessons
}
const courseAnchors = new Map<string, number[]>()
for (const c of courses) {
  const n = courseLessons(c.id).length
  courseAnchors.set(c.id, [rng.int(8, Math.floor(n / 2) - 2), rng.int(Math.floor(n / 2) + 2, Math.min(n - 4, 44))])
}
const placements = new Map<string, Placement[]>()
for (const s of students) {
  const math = weighted(MATH_BY_LEVEL[s.level])
  const sci = rng.pick(['crs_bio', 'crs_chem', 'crs_phys'])
  const eng = rng.pick(['crs_aplang', 'crs_aplit'])
  const his = rng.pick(['crs_apworld', 'crs_apush'])
  const pos = (cid: string) => {
    // Students cluster around two anchor lessons per course so shared lesson needs clear the grouping threshold.
    const anchors = courseAnchors.get(cid)!
    const a = rng.pick(anchors)
    return a + rng.pick([-1, 0, 0, 0, 0, 1])
  }
  placements.set(s.id, [math, sci, eng, his].map((cid) => ({ course_id: cid, position: pos(cid) })))
}

const assignments: Assignment[] = []
const evidence: Evidence[] = []
let evCount = 0
const ev = (partial: Omit<Evidence, 'id'>): Evidence => {
  evCount++
  const e = { id: `ev_${pad(evCount, 5)}`, ...partial }
  evidence.push(e)
  return e
}
const activeMath = new Map<string, { lesson: Lesson; latest: number; status: Assignment['status'] }>()
// Persistent low students recur in the equity snapshot. Stale students appear in Needs You.
const persistentLow = new Set(rng.shuffle(students.map((s) => s.id)).slice(0, 10))
const staleStudents = new Set(rng.shuffle(students.filter((s) => !persistentLow.has(s.id)).map((s) => s.id)).slice(0, 5))
const optOutStudents = new Set(rng.shuffle(students.filter((s) => !persistentLow.has(s.id) && !staleStudents.has(s.id)).map((s) => s.id)).slice(0, 3))

const dayStamp = (date: string, hour = 14) => isoAt(date, `${pad(hour, 2)}:${pad(rng.int(0, 59), 2)}`)
const pastDates = [...Array(PAST_WEEKS)].flatMap((_, k) => weekDates(shiftDate(WEEK_START, -7 * (PAST_WEEKS - k))))

let asgCount = 0
for (const s of students) {
  for (const p of placements.get(s.id)!) {
    const seq = courseLessons(p.course_id)
    const isMath = p.course_id.startsWith('crs_im')
    const isScience = ['crs_bio', 'crs_chem', 'crs_phys'].includes(p.course_id)
    const histStart = Math.max(0, p.position - 5)
    for (let i = histStart; i < Math.min(seq.length, p.position + 3); i++) {
      const l = seq[i]
      asgCount++
      const weeksAgo = p.position - i
      let status: Assignment['status']
      if (i < p.position) status = rng.chance(0.12) ? 'skipped_on_mastery' : 'mastered'
      else if (i === p.position) status = 'active'
      else status = 'queued'
      const masteredAt = status === 'mastered' || status === 'skipped_on_mastery' ? dayStamp(pastDates[Math.max(0, pastDates.length - 1 - weeksAgo * 5 - rng.int(0, 4))]) : null
      const openedAt = i <= p.position ? dayStamp(pastDates[Math.max(0, pastDates.length - 1 - weeksAgo * 5 - rng.int(3, 6))], 9) : null
      const a: Assignment = { id: `asg_${pad(asgCount, 4)}`, student_id: s.id, lesson_id: l.id, status, mode: status === 'mastered' ? (rng.chance(0.3) ? 'workshop' : 'self_directed') : null, assigned_by: 'engine', opened_at: openedAt, mastered_at: masteredAt }
      if (isMath || isScience) {
        const outcomeId = l.outcomes_served[0]
        if (status === 'mastered') {
          const d = masteredAt!.slice(0, 10)
          const rows = rng.int(2, 3)
          for (let r = 0; r < rows; r++) {
            const v = r === rows - 1 ? rng.int(85, 100) : rng.int(55, 80)
            ev({ student_id: s.id, outcome_id: isMath ? outcomeId : l.outcomes_served[r % l.outcomes_served.length], source: 'kira', source_ref: l.id, value_kind: 'mastery_pct', value: v, artifact_url: null, recorded_by: 'system', recorded_at: dayStamp(shiftDate(d, -(rows - 1 - r) * 2)), slot_id: null })
          }
        } else if (status === 'active' && isMath) {
          // The latest row decides Required (below 70), Recommended (70 to 74), in reach (75 to 84), or fine.
          let latest: number
          if (persistentLow.has(s.id)) latest = rng.int(40, 62)
          else if (staleStudents.has(s.id)) latest = rng.int(72, 84)
          else if (optOutStudents.has(s.id)) latest = rng.int(95, 100)
          else {
            const r = rng.next()
            const atAnchor = courseAnchors.get(p.course_id)!.includes(p.position)
            const req = atAnchor ? 0.4 : 0.06
            latest = r < req ? rng.int(45, 69) : r < req + 0.24 ? rng.int(70, 74) : r < req + 0.5 ? rng.int(75, 84) : rng.int(85, 94)
          }
          const practiced = !persistentLow.has(s.id) && latest >= 70 && latest < 85 && rng.chance(0.35)
          const needsWorkshop = latest < 70 && rng.chance(0.5)
          a.status = needsWorkshop ? 'needs_workshop' : practiced ? 'practiced' : 'active'
          const rows = practiced ? 2 : persistentLow.has(s.id) ? 3 : rng.int(1, 2)
          const lastDay = staleStudents.has(s.id) ? shiftDate(TODAY, -rng.int(16, 24)) : rng.pick(['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'])
          for (let r = 0; r < rows; r++) {
            const v = r === rows - 1 ? latest : Math.max(30, latest - rng.int(3, 15))
            ev({ student_id: s.id, outcome_id: outcomeId, source: 'kira', source_ref: l.id, value_kind: 'mastery_pct', value: v, artifact_url: null, recorded_by: 'system', recorded_at: dayStamp(shiftDate(lastDay, -(rows - 1 - r) * 7)), slot_id: null })
          }
          activeMath.set(s.id, { lesson: l, latest, status: a.status })
        } else if (status === 'active' && isScience) {
          ev({ student_id: s.id, outcome_id: outcomeId, source: 'kira', source_ref: l.id, value_kind: 'mastery_pct', value: rng.int(60, 92), artifact_url: null, recorded_by: 'system', recorded_at: dayStamp(rng.pick(['2026-10-13', '2026-10-14', '2026-10-15'])), slot_id: null })
        }
      }
      assignments.push(a)
    }
    // Unit assessments for completed units (math), tagged to the unit's standards.
    if (isMath) {
      const current = unitOf(seq[p.position])
      for (const u of unitsByCourse(p.course_id).filter((x) => x.sequence < current.sequence).slice(-2)) {
        const d = pastDates[Math.max(0, pastDates.length - 1 - (current.sequence - u.sequence) * 12 - rng.int(0, 6))]
        for (const oid of rng.shuffle(u.outcomes_served).slice(0, 2)) {
          ev({ student_id: s.id, outcome_id: oid, source: 'assessment', source_ref: `unit:${u.id}`, value_kind: 'mastery_pct', value: rng.int(70, 100), artifact_url: null, recorded_by: 'adu_math', recorded_at: dayStamp(d), slot_id: null })
        }
      }
    }
  }
}
// Teach to One roadmap progress for about thirty students.
for (const s of rng.shuffle(students).slice(0, 30)) {
  const am = activeMath.get(s.id)
  if (!am) continue
  ev({ student_id: s.id, outcome_id: am.lesson.outcomes_served[am.lesson.outcomes_served.length - 1], source: 'teach_to_one', source_ref: `tto:${am.lesson.id}`, value_kind: 'mastery_pct', value: Math.min(100, am.latest + rng.int(-5, 10)), artifact_url: null, recorded_by: 'system', recorded_at: dayStamp('2026-10-15'), slot_id: null })
}

// ---------- cognitive skill scores on two final products ----------
const EXPECT: Record<Level, number> = { expose: 3, explore: 4, pursue: 5, launch: 6 }
const quarter = new Set(rng.shuffle(students.map((s) => s.id)).slice(0, 25))
const wellBelow = new Set([...quarter].slice(0, 8))
const readyStudents = rng.shuffle(students.filter((s) => s.level !== 'launch' && !persistentLow.has(s.id))).slice(0, 3)
const readySkill = new Map<string, string>()
const grewStudents = new Set(rng.shuffle(students.map((s) => s.id)).slice(0, 12))
for (const s of students) {
  const pools = placements.get(s.id)!.flatMap((p) => unitOf(courseLessons(p.course_id)[p.position]).outcomes_served.filter((o) => o.startsWith('CS.')))
  const skills = [...new Set([...pools, ...rng.shuffle(outcomes.filter((o) => o.family === 'cognitive').map((o) => o.id)).slice(0, 3)])].slice(0, 7)
  const high = quarter.has(s.id) ? skills[0] : null
  const low = quarter.has(s.id) ? skills[1] : null
  const ready = readyStudents.find((r) => r.id === s.id) ? skills[2] : null
  if (ready) readySkill.set(s.id, ready)
  const products: [string, Evidence['source'], string][] = [
    ['2026-09-11', 'gradebook', 'https://drive.example/final-products/' + s.id + '/product-1'],
    ['2026-10-09', 'assessment', 'https://drive.example/final-products/' + s.id + '/product-2'],
  ]
  for (const [date, source, url] of products) {
    for (const skill of skills) {
      const o = outcomeById.get(skill)!
      const exp = o.level_expectations?.[s.level] ?? EXPECT[s.level]
      let v = Math.max(exp, Math.min(exp + 1, Math.round(rng.normal(exp + 0.3, 0.8, 1, 8))))
      if (date === '2026-09-11' && rng.chance(0.3)) v = exp - 1
      if (date === '2026-10-09' && v === exp + 1 && rng.chance(0.5)) v = exp
      if (skill === high) v = Math.min(8, exp + 2)
      if (skill === low) v = wellBelow.has(s.id) ? Math.max(1, exp - 2) : Math.max(1, exp - 1)
      if (skill === low && !wellBelow.has(s.id) && date === '2026-10-09') v = exp
      if (skill === ready) v = Math.min(8, exp + 1 + rng.int(0, 1))
      ev({ student_id: s.id, outcome_id: skill, source, source_ref: date === '2026-09-11' ? 'Final product 1' : 'Final product 2', value_kind: 'score_1_8', value: v, artifact_url: url, recorded_by: rng.pick(['adu_english', 'adu_history', 'adu_science']), recorded_at: dayStamp(date, 16), slot_id: null })
    }
  }
  if (ready) {
    const o = outcomeById.get(ready)!
    const exp = o.level_expectations?.[s.level] ?? EXPECT[s.level]
    ev({ student_id: s.id, outcome_id: ready, source: 'exhibition', source_ref: 'Exhibition night', value_kind: 'score_1_8', value: Math.min(8, exp + 1), artifact_url: `https://drive.example/exhibition/${s.id}`, recorded_by: 'adu_english', recorded_at: dayStamp('2026-10-15', 18), slot_id: null })
  }
  if (grewStudents.has(s.id)) {
    const latestOf = (sk: string) => evidence.filter((e) => e.student_id === s.id && e.outcome_id === sk && typeof e.value === 'number').sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0]
    const skill = skills.find((sk) => sk !== high && sk !== ready && typeof latestOf(sk)?.value === 'number' && (latestOf(sk)!.value as number) <= (outcomeById.get(sk)!.level_expectations?.[s.level] ?? EXPECT[s.level])) ?? skills[3] ?? skills[0]
    const o = outcomeById.get(skill)!
    const exp = o.level_expectations?.[s.level] ?? EXPECT[s.level]
    const prev = evidence.filter((e) => e.student_id === s.id && e.outcome_id === skill && typeof e.value === 'number').sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0]
    const prevV = typeof prev?.value === 'number' ? prev.value : exp
    ev({ student_id: s.id, outcome_id: skill, source: 'adult_note', source_ref: 'Studio check', value_kind: 'score_1_8', value: Math.min(8, Math.min(prevV + 1, exp + 1)), artifact_url: null, recorded_by: s.mentor_id, recorded_at: dayStamp('2026-10-19', 14), slot_id: null })
  }
}

// ---------- habits: focus habits and weekly reflections ----------
const habitIds = HABIT_BLOCKS.flatMap((b) => b.habits.map((h) => h.id))
const focusHabits = new Map<string, string[]>()
for (const s of students) {
  const fh = rng.shuffle(habitIds).slice(0, rng.int(1, 2))
  focusHabits.set(s.id, fh)
  for (let k = 0; k < PAST_WEEKS; k++) {
    if (rng.chance(0.2)) continue
    const date = dateOf(shiftDate(WEEK_START, -7 * (PAST_WEEKS - k)), 'fri')
    for (const h of fh) {
      const name = outcomeById.get(h)!.name.toLowerCase()
      ev({ student_id: s.id, outcome_id: h, source: 'student_reflection', source_ref: null, value_kind: 'text', value: rng.pick(HABIT_REFLECTIONS).replace('{habit}', name), artifact_url: null, recorded_by: s.id, recorded_at: dayStamp(date, 15), slot_id: null })
    }
  }
}

// ---------- futre ----------
const PATHWAY_BY_CNS: Record<string, string[]> = {
  four_year: ['PW.SOFTWARE', 'PW.TEACHING', 'PW.ENVIRO', 'PW.JOURNALISM', 'PW.NURSING'],
  two_year: ['PW.NURSING', 'PW.BUSINESS', 'PW.DESIGN', 'PW.PARKS'],
  apprenticeship: ['PW.TRADES', 'PW.DESIGN'],
  work: ['PW.BUSINESS', 'PW.PARKS', 'PW.TRADES'],
  training: ['PW.NURSING', 'PW.TRADES'],
  military: ['PW.TRADES'],
}
const futre: FutreRecord[] = []
const studentPathway = new Map<string, string | null>()
for (const s of students) {
  const decided = s.level === 'expose' ? rng.chance(0.4) : s.level === 'explore' ? rng.chance(0.8) : true
  const cnsType = decided ? rng.pick(['four_year', 'four_year', 'two_year', 'apprenticeship', 'work', 'training'] as const) : ('undecided' as const)
  const pathwayId = decided ? rng.pick(PATHWAY_BY_CNS[cnsType]) : null
  studentPathway.set(s.id, pathwayId)
  const pw = PATHWAYS.find((p) => p.id === pathwayId)
  const targets = pw ? pw.career_ids.map((cid) => CAREERS.find((c) => c.id === cid)!).map((c) => ({ career_id: c.id, title: c.title, fit_score: rng.int(70, 96) })) : []
  const explored = rng.shuffle(CAREERS).slice(0, rng.int(2, 5)).map((c) => ({ career_id: c.id, title: c.title, cluster: c.cluster, fit_score: rng.int(40, 95), explored_at: dayStamp(rng.pick(pastDates)), saved: rng.chance(0.4) }))
  const nExp = s.level === 'expose' ? rng.int(1, 2) : s.level === 'explore' ? rng.int(1, 3) : rng.int(2, 3)
  const templates = rng.shuffle(pw ? [...pw.experiences, ...EXPERIENCE_TEMPLATES.filter((x) => x.level === 'expose').map((x) => x.id)] : EXPERIENCE_TEMPLATES.map((x) => x.id)).slice(0, nExp)
  const experiences = templates.map((tid, i) => {
    const t = EXPERIENCE_TEMPLATES.find((x) => x.id === tid)!
    const start = pastDates[rng.int(0, 20) + i * 10] ?? pastDates[0]
    const end = shiftDate(start, 4)
    const complete = i < nExp - 1 || rng.chance(0.6)
    const reflected = complete && rng.chance(0.85)
    return { experience_id: `fx_${s.id}_${i + 1}`, title: t.title, type: t.level, provider: PARTNERS.find((p) => p.place.includes(t.provider_kind === 'parks' ? 'parks' : t.provider_kind === 'newsroom' ? 'news' : t.provider_kind === 'hospital' ? 'hospital' : t.provider_kind === 'college' ? 'college' : 'studio'))?.org ?? 'Summit Sierra', start, end, status: complete ? ('complete' as const) : ('in_progress' as const), reflection_text: reflected ? rng.pick(FUTRE_REFLECTIONS) : null, reflection_at: reflected ? dayStamp(shiftDate(end, 1), 16) : null }
  })
  for (const x of experiences) {
    if (x.reflection_text) ev({ student_id: s.id, outcome_id: rng.pick(['HOS.RELEVANCE', 'HOS.CURIOSITY', 'HOS.SELF_AWARENESS', 'HOS.AGENCY']), source: 'futre', source_ref: x.experience_id, value_kind: 'text', value: x.reflection_text, artifact_url: null, recorded_by: s.id, recorded_at: x.reflection_at!, slot_id: null })
  }
  futre.push({
    futre_student_id: s.futre_student_id,
    student_id: s.id,
    consent: true,
    vision: { vision_text: rng.pick(VISIONS), vision_board_url: `https://futre.example/boards/${s.futre_student_id}`, updated_at: dayStamp(rng.pick(pastDates)) },
    cns: { cns_type: cnsType, cns_text: pw ? `${cnsType === 'four_year' ? 'A four-year degree' : cnsType === 'two_year' ? 'A two-year program' : cnsType === 'apprenticeship' ? 'An apprenticeship' : cnsType === 'work' ? 'Work' : 'A training program'} toward ${pw.title.toLowerCase()}` : 'Still deciding; trying things this year', target_careers: targets, pathway_id: pathwayId, updated_at: dayStamp(s.level === 'expose' ? rng.pick(pastDates.slice(-10)) : rng.pick(pastDates.slice(0, 10))) },
    careers_explored: explored,
    experiences,
    portfolio: { portfolio_url: `https://futre.example/portfolio/${s.futre_student_id}`, item_count: rng.int(1, 9), latest_item: { title: s.level === 'launch' || (s.level === 'pursue' && rng.chance(0.3)) ? 'Launch plan draft' : rng.pick(['Final product 2', 'Expedition reflection', 'Lab write-up', 'Argument essay']), url: `https://futre.example/portfolio/${s.futre_student_id}/latest`, reflection: 'Proud of the revision; the evidence section is stronger.', added_at: dayStamp('2026-10-12') } },
    caregiver_view_enabled: rng.chance(0.5),
  })
}

// ---------- offerings ----------
const offerings: Offering[] = []
let offCount = 0
const off = (o: Omit<Offering, 'id'> & { id?: string }): Offering => {
  offCount++
  const full: Offering = { id: o.id ?? `off_${pad(offCount, 4)}`, ...o } as Offering
  offerings.push(full)
  return full
}
const mathStandardIds = outcomes.filter((o) => o.id.startsWith('CCSS.HS')).map((o) => o.id)
const skillsOf = (cid: string, n = 3) => [...new Set(unitsByCourse(cid).flatMap((u) => u.outcomes_served))].slice(0, n)

function weekOfferings(weekStart: string, suffix: string): Offering[] {
  const made: Offering[] = []
  const dates = weekDates(weekStart)
  const base = (o: Omit<Offering, 'id'>) => {
    const full = off({ ...o, id: `${o.source_ref.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${o.day}_${o.start.replace(':', '')}${suffix}` })
    made.push(full)
    return full
  }
  dates.forEach((day) => {
    const wd = weekdayOf(day)
    base({ experience_type: 'WC', kind: 'community', title: 'Community circle', lesson_id: null, outcomes_served: ['HOS.BELONGING'], adult_ids: ['adu_director'], place_id: 'pl_gym', day, start: '08:30', end: '08:45', capacity_min: 0, capacity_max: 100, entry: 'required', source: 'calendar', source_ref: 'community_all', standing: true, status: 'published' })
    if (wd !== 'fri') groups.forEach((g, gi) => base({ experience_type: 'WC', kind: 'community', title: `${g.name} group`, lesson_id: null, outcomes_served: ['HOS.BELONGING', 'HOS.ATTACHMENT'], adult_ids: g.adult_ids, place_id: ['pl_room_101', 'pl_room_102', 'pl_room_103', 'pl_commons'][gi], day, start: '08:45', end: '09:15', capacity_min: 0, capacity_max: 25, entry: 'required', source: 'homebase', source_ref: g.id, standing: true, status: 'published' }))
    base({ experience_type: 'WC', kind: 'community', title: 'Lunch together', lesson_id: null, outcomes_served: ['HOS.BELONGING'], adult_ids: ['adu_ops'], place_id: 'pl_commons', day, start: '12:15', end: '12:45', capacity_min: 0, capacity_max: 100, entry: 'required', source: 'calendar', source_ref: 'lunch', standing: true, status: 'published' })
    base({ experience_type: 'RG', kind: 'event', title: 'Reflection and goal-setting', lesson_id: null, outcomes_served: ['HOS.SELF_DIRECTION', 'HOS.SELF_AWARENESS'], adult_ids: mentorIds, place_id: 'pl_commons', day, start: '15:00', end: '15:30', capacity_min: 0, capacity_max: 100, entry: 'required', source: 'homebase', source_ref: 'reflection', standing: true, status: 'published' })
    BLOCKS.forEach((b, bi) => {
      base({ experience_type: 'PF', kind: 'practice', title: 'Practice hub', lesson_id: null, outcomes_served: ['HOS.SELF_DIRECTION'], adult_ids: bi < 4 ? ['adu_math', 'adu_coach'] : ['adu_coach', 'adu_science'], place_id: 'pl_commons', day, start: b.start, end: b.end, capacity_min: 0, capacity_max: 24, entry: 'open', source: 'homebase', source_ref: 'practice_hub', standing: true, status: 'published' })
    })
    // Kira self-paced modules and Teach to One roadmap sessions.
    base({ experience_type: 'PF', kind: 'practice', title: 'Kira self-paced: math modules', lesson_id: null, outcomes_served: mathStandardIds, adult_ids: ['adu_math'], place_id: 'pl_room_103', day, start: '10:00', end: '10:45', capacity_min: 0, capacity_max: 16, entry: 'open', source: 'kira', source_ref: 'kira_math_modules', standing: true, status: 'published' })
    base({ experience_type: 'PF', kind: 'practice', title: 'Kira self-paced: science modules', lesson_id: null, outcomes_served: ['CS.ANA.INTERPRET', 'CS.ANA.MODEL', 'CS.INQ.QUESTION', 'CS.INQ.HYPOTH', 'CS.INQ.DESIGN', 'CS.INQ.COLLECT', 'CS.ANA.JUSTIFY', 'CS.ANA.CONNECT', 'CS.ANA.COMPARE', 'CS.ANA.CRITIQUE'], adult_ids: ['adu_science'], place_id: 'pl_room_103', day, start: '13:30', end: '14:15', capacity_min: 0, capacity_max: 16, entry: 'open', source: 'kira', source_ref: 'kira_science_modules', standing: true, status: 'published' })
    base({ experience_type: 'PF', kind: 'practice', title: 'Teach to One roadmap session', lesson_id: null, outcomes_served: ['CCSS.HSA-REI.C.6', 'CCSS.HSF-LE.A.2', 'CCSS.HSA-REI.B.4'], adult_ids: ['adu_math'], place_id: 'pl_room_102', day, start: '09:15', end: '10:00', capacity_min: 0, capacity_max: 16, entry: 'open', source: 'teach_to_one', source_ref: 'tto_roadmap_am', standing: true, status: 'published' })
    base({ experience_type: 'PF', kind: 'practice', title: 'Teach to One roadmap session', lesson_id: null, outcomes_served: ['CCSS.HSS-ID.A.2', 'CCSS.HSF-IF.B.4', 'CCSS.HSG-SRT.C.8'], adult_ids: ['adu_math'], place_id: 'pl_room_102', day, start: '10:45', end: '11:30', capacity_min: 0, capacity_max: 16, entry: 'open', source: 'teach_to_one', source_ref: 'tto_roadmap_mid', standing: true, status: 'published' })
    // Seminars (DD), studios (IW), movement (WC).
    const semA = wd === 'mon' || wd === 'wed' || wd === 'fri' ? ['crs_aplang', 'adu_english'] : ['crs_apworld', 'adu_history']
    const semB = wd === 'tue' || wd === 'thu' ? ['crs_aplit', 'adu_english'] : ['crs_apush', 'adu_history']
    base({ experience_type: 'DD', kind: 'seminar', title: `Seminar: ${courses.find((c) => c.id === semA[0])!.title}`, lesson_id: null, outcomes_served: skillsOf(semA[0], 4), adult_ids: [semA[1]], place_id: 'pl_sem_a', day, start: '09:15', end: '10:45', capacity_min: 4, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: `seminar_${semA[0]}`, standing: true, status: 'published' })
    base({ experience_type: 'DD', kind: 'seminar', title: `Seminar: ${courses.find((c) => c.id === semB[0])!.title}`, lesson_id: null, outcomes_served: skillsOf(semB[0], 4), adult_ids: [semB[1]], place_id: 'pl_sem_b', day, start: '13:30', end: '15:00', capacity_min: 4, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: `seminar_${semB[0]}`, standing: true, status: 'published' })
    base({ experience_type: 'DD', kind: 'seminar', title: `Seminar: ${courses.find((c) => c.id === (wd === 'mon' || wd === 'wed' || wd === 'fri' ? 'crs_apush' : 'crs_apworld'))!.title}`, lesson_id: null, outcomes_served: skillsOf(wd === 'mon' || wd === 'wed' || wd === 'fri' ? 'crs_apush' : 'crs_apworld', 4), adult_ids: ['adu_history'], place_id: 'pl_sem_a', day, start: '12:45', end: '14:15', capacity_min: 4, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: 'seminar_history_pm', standing: true, status: 'published' })
    base({ experience_type: 'DD', kind: 'seminar', title: 'Socratic seminar: current issues', lesson_id: null, outcomes_served: ['CS.SPK.DISCUSS', 'CS.SPK.PREP', 'CS.ANA.CRITIQUE', 'CS.WRI.COUNTER'], adult_ids: [mentorIds[(['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(wd) + 2) % 4]], place_id: 'pl_sem_a', day, start: '14:15', end: '15:00', capacity_min: 3, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: 'seminar_issues', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Expedition project studio', lesson_id: null, outcomes_served: ['CS.ANA.MODEL', 'CS.PRD.MMWRITTEN', 'CS.INQ.QUESTION', 'HOS.AGENCY'], adult_ids: ['adu_coordinator'], place_id: 'pl_gym', day, start: '09:15', end: '10:45', capacity_min: 2, capacity_max: 30, entry: 'open', source: 'homebase', source_ref: 'studio_expedition', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Math modeling studio', lesson_id: null, outcomes_served: ['CS.ANA.MODEL', 'CCSS.HSA-CED.A.2', 'CCSS.HSF-IF.B.4'], adult_ids: ['adu_math'], place_id: 'pl_room_104', day, start: '11:30', end: '12:15', capacity_min: 2, capacity_max: 8, entry: 'open', source: 'homebase', source_ref: 'studio_math', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Expedition project studio (afternoon)', lesson_id: null, outcomes_served: ['CS.ANA.MODEL', 'CS.PRD.MMWRITTEN', 'CS.INQ.DESIGN', 'HOS.SELF_DIRECTION'], adult_ids: [mentorIds[(['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(wd) + 3) % 4]], place_id: 'pl_gym', day, start: '13:30', end: '15:00', capacity_min: 2, capacity_max: 30, entry: 'open', source: 'homebase', source_ref: 'studio_expedition_pm', standing: true, status: 'published' })
    base({ experience_type: 'DD', kind: 'seminar', title: 'Close reading seminar', lesson_id: null, outcomes_served: ['CS.TXT.THEME', 'CS.TXT.POV', 'CS.TXT.DEV', 'CS.TXT.STRUCT', 'CS.TXT.WORD'], adult_ids: ['adu_english'], place_id: 'pl_sem_b', day, start: '09:15', end: '10:00', capacity_min: 3, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: 'seminar_close_reading', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Research and sources studio', lesson_id: null, outcomes_served: ['CS.SRC.SELECT', 'CS.SRC.CONTEXT', 'CS.SRC.SYNTH', 'CS.INQ.QUESTION', 'CS.WRI.THESIS', 'CS.WRI.NARRATIVE'], adult_ids: ['adu_history'], place_id: 'pl_room_104', day, start: '10:00', end: '10:45', capacity_min: 2, capacity_max: 8, entry: 'open', source: 'homebase', source_ref: 'studio_research', standing: true, status: 'published' })
    base({ experience_type: 'PP', kind: 'studio', title: 'Presentation lab', lesson_id: null, outcomes_served: ['CS.PRD.STYLE', 'CS.PRD.ORAL', 'CS.PRD.MMWRITTEN', 'CS.PRD.MMORAL', 'CS.PRD.CONVENTIONS', 'CS.PRD.PRECISION', 'CS.SPK.PREP', 'CS.SPK.NORMS', 'CS.WRI.EVSELECT', 'CS.WRI.INTROCONC'], adult_ids: ['adu_coach'], place_id: 'pl_nook_2', day, start: '12:45', end: '13:30', capacity_min: 1, capacity_max: 6, entry: 'open', source: 'homebase', source_ref: 'presentation_lab', standing: true, status: 'published' })
    base({ experience_type: 'DD', kind: 'seminar', title: 'Book talk', lesson_id: null, outcomes_served: ['CS.TXT.THEME', 'CS.SPK.DISCUSS', 'CS.SPK.NORMS'], adult_ids: [mentorIds[['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(wd) % 4]], place_id: 'pl_sem_b', day, start: '10:45', end: '11:30', capacity_min: 3, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: 'book_talk', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Project studio: final products', lesson_id: null, outcomes_served: ['CS.WRI.ORG', 'CS.WRI.EVINTEGRATE', 'CS.PRD.STYLE', 'CS.ANA.JUSTIFY'], adult_ids: [mentorIds[(['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(wd) + 1) % 4]], place_id: 'pl_room_101', day, start: '10:45', end: '12:15', capacity_min: 4, capacity_max: 24, entry: 'open', source: 'homebase', source_ref: 'studio_products', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Science lab studio', lesson_id: null, outcomes_served: ['CS.INQ.DESIGN', 'CS.INQ.COLLECT', 'CS.ANA.INTERPRET', 'CS.ANA.MODEL'], adult_ids: ['adu_science'], place_id: 'pl_room_102', day, start: '12:45', end: '14:15', capacity_min: 4, capacity_max: 16, entry: 'open', source: 'homebase', source_ref: 'studio_lab', standing: true, status: 'published' })
    base({ experience_type: 'IW', kind: 'studio', title: 'Writing studio', lesson_id: null, outcomes_served: ['CS.WRI.CLAIM', 'CS.WRI.EVEXPLAIN', 'CS.WRI.COUNTER', 'CS.WRI.INTROCONC'], adult_ids: ['adu_english'], place_id: 'pl_room_104', day, start: '14:15', end: '15:00', capacity_min: 2, capacity_max: 8, entry: 'open', source: 'homebase', source_ref: 'studio_writing', standing: true, status: 'published' })
    base({ experience_type: 'RG', kind: 'studio', title: 'Goal-setting workshop', lesson_id: null, outcomes_served: ['HOS.SELF_DIRECTION', 'HOS.EXEC_FUNCTION'], adult_ids: ['adu_coach'], place_id: 'pl_nook_2', day, start: '09:15', end: '10:00', capacity_min: 1, capacity_max: 6, entry: 'open', source: 'homebase', source_ref: 'goal_workshop', standing: true, status: 'published' })
  })
  // Whole-group event, exhibition, portfolio review.
  base({ experience_type: 'WC', kind: 'event', title: 'All-school gathering', lesson_id: null, outcomes_served: ['HOS.BELONGING', 'HOS.CIVIC_IDENTITY'], adult_ids: ['adu_director', 'adu_ops'], place_id: 'pl_gym', day: dates[4], start: '08:45', end: '09:15', capacity_min: 0, capacity_max: 100, entry: 'required', source: 'calendar', source_ref: 'all_school', standing: true, status: 'published' })
  base({ experience_type: 'PP', kind: 'exhibition', title: 'Exhibition: work in progress', lesson_id: null, outcomes_served: ['CS.PRD.ORAL', 'CS.PRD.MMORAL', 'CS.PRD.STYLE'], adult_ids: ['adu_english', 'adu_history'], place_id: 'pl_commons', day: dates[3], start: '13:30', end: '15:00', capacity_min: 4, capacity_max: 30, entry: 'open', source: 'homebase', source_ref: 'exhibition_wip', standing: true, status: 'published' })
  base({ experience_type: 'PP', kind: 'exhibition', title: 'Portfolio review', lesson_id: null, outcomes_served: ['CS.PRD.ORAL', 'CS.WRI.EVSELECT', 'CS.PRD.PRECISION'], adult_ids: ['adu_coordinator'], place_id: 'pl_sem_a', day: dates[4], start: '13:30', end: '15:00', capacity_min: 2, capacity_max: 10, entry: 'open', source: 'homebase', source_ref: 'portfolio_review', standing: true, status: 'published' })
  // Partner slots (RW).
  const partner = (title: string, pid: string, placeId: string, days: number[], start: string, end: string, cap: number, template: string, kind: Offering['kind'] = 'partner_slot') => {
    const t = EXPERIENCE_TEMPLATES.find((x) => x.id === template)!
    for (const d of days) base({ experience_type: 'RW', kind, title, lesson_id: null, outcomes_served: t.teaches, adult_ids: [pid], place_id: placeId, day: dates[d], start, end, capacity_min: Math.max(1, Math.floor(cap / 3)), capacity_max: cap, entry: t.level === 'expose' ? 'open' : 'assigned', source: kind === 'college_course' ? 'calendar' : 'partner', source_ref: template, standing: true, status: 'published' })
  }
  partner('Parks field crew', 'adu_partner_parks', 'pl_parks', [0, 1, 2, 3, 4], '12:45', '15:00', 10, 'XT.PARKS.TRAIL')
  partner('Water-quality study', 'adu_partner_parks', 'pl_parks', [1, 3], '09:15', '12:15', 16, 'XT.PARKS.WATER', 'expedition')
  partner('Newsroom reporting', 'adu_partner_news', 'pl_news', [0, 2, 4], '09:15', '12:15', 6, 'XT.NEWS.LOCAL')
  partner('Hospital patient services', 'adu_partner_hospital', 'pl_hospital', [1, 3], '09:15', '12:15', 6, 'XT.HOSP.VOLUNTEER')
  partner('Hospital lab observation', 'adu_partner_hospital', 'pl_hospital', [2, 4], '09:15', '12:15', 6, 'XT.HOSP.LAB')
  partner('Junior naturalist program', 'adu_partner_parks', 'pl_parks', [2, 4], '09:15', '12:15', 10, 'XT.PARKS.NATURALIST', 'expedition')
  partner('Student podcast production', 'adu_partner_news', 'pl_news', [1, 3], '12:45', '15:00', 6, 'XT.NEWS.PODCAST')
  // Two short expose-level experiences that students can choose into an open afternoon (Spec 6 Graph in the Engine).
  partner('Newsroom shadow visit', 'adu_partner_news', 'pl_news', [1, 3], '13:30', '14:15', 8, 'XT.NEWS.SHADOW')
  partner('Water-quality data lab', 'adu_partner_parks', 'pl_parks', [2, 4], '13:30', '14:15', 8, 'XT.PARKS.WATER', 'expedition')
  partner('Intro to computer science', 'adu_partner_college', 'pl_college', [0, 2], '12:45', '14:15', 15, 'XT.COLLEGE.INTRO_CS', 'college_course')
  partner('Intro statistics', 'adu_partner_college', 'pl_college', [1, 3], '12:45', '14:15', 15, 'XT.COLLEGE.STATS', 'college_course')
  partner('College composition', 'adu_partner_college', 'pl_college', [0, 2, 4], '09:15', '10:45', 15, 'XT.COLLEGE.COMP', 'college_course')
  partner('Design studio apprenticeship', 'adu_partner_studio', 'pl_studio', [1, 3, 4], '12:45', '15:00', 6, 'XT.WORK.DESIGN')
  partner('Electrical pre-apprenticeship', 'adu_partner_electric', 'pl_electric', [0, 1, 2, 3, 4], '12:45', '15:00', 6, 'XT.WORK.TRADES')
  partner('Paid work placement', 'adu_coordinator', 'pl_offcampus', [0, 1, 2, 3], '09:15', '12:15', 12, 'XT.WORK.PAID')
  partner('Paid work placement', 'adu_coordinator', 'pl_offcampus', [0, 1, 2, 3], '12:45', '15:00', 12, 'XT.WORK.PAID')
  partner('Launch mentor meeting', 'adu_coordinator', 'pl_sem_b', [4], '09:15', '10:00', 12, 'XT.SCHOOL.DEFENSE')
  return made
}

// ---------- touchpoints ----------
const touchpoints: Touchpoint[] = []
let tpCount = 0
const nudgeStudents = rng.shuffle(students.filter((s) => !readyStudents.includes(s) && !persistentLow.has(s.id))).slice(0, 6)
const familyStudent = rng.pick(students.filter((s) => !nudgeStudents.includes(s) && !readyStudents.includes(s)))
const fill = (tpl: string, s: Student) => {
  const am = activeMath.get(s.id)
  const skill = outcomeById.get(rng.pick(placements.get(s.id)!.flatMap((p) => unitOf(courseLessons(p.course_id)[p.position]).outcomes_served.filter((o) => o.startsWith('CS.')))))
  return tpl.replace('{lesson}', am?.lesson.title ?? 'the current lesson').replace('{outcome}', skill?.name ?? 'the focus skill').replace('{unit}', unitOf(courseLessons(placements.get(s.id)![0].course_id)[placements.get(s.id)![0].position]).title)
}
function addTouchpoint(s: Student, kind: Touchpoint['kind'], when: string, extra: Partial<Touchpoint> = {}) {
  tpCount++
  const notes = fill(rng.pick(TOUCHPOINT_NOTES[kind]), s)
  touchpoints.push({
    id: `tp_${pad(tpCount, 4)}`,
    student_id: s.id,
    mentor_id: s.mentor_id,
    kind,
    when,
    duration_min: kind === 'plan' ? rng.int(10, 20) : kind === 'family' ? rng.int(15, 30) : rng.int(3, 10),
    prompt: '',
    notes,
    private: false,
    student_note: rng.chance(0.3) ? rng.pick(STUDENT_NOTES) : null,
    linked_outcomes: [],
    linked_slot_id: null,
    follow_up: rng.chance(0.25) ? { text: rng.pick(FOLLOW_UPS), due: shiftDate(when.slice(0, 10), rng.int(2, 6)) } : null,
    ...extra,
  })
}
const KINDS: Touchpoint['kind'][] = ['check_in', 'check_in', 'feedback', 'reflection', 'goal']
for (const s of students) {
  for (let k = 0; k < PAST_WEEKS; k++) {
    const ws = shiftDate(WEEK_START, -7 * (PAST_WEEKS - k))
    const dates = weekDates(ws)
    const n = rng.int(2, 4)
    const lastWeek = k === PAST_WEEKS - 1
    // Friday plan touchpoint for the coming week; the students who need a nudge missed it last week.
    if (!(lastWeek && nudgeStudents.includes(s))) addTouchpoint(s, 'plan', isoAt(dates[4], `${pad(rng.int(13, 14), 2)}:${pad(rng.int(0, 59), 2)}`), { linked_outcomes: focusHabits.get(s.id) ?? [] })
    for (let i = 0; i < n - 1; i++) {
      const dayIdx = lastWeek ? (nudgeStudents.includes(s) ? rng.int(0, 1) : i === 0 ? rng.int(3, 4) : rng.int(0, 4)) : rng.int(0, 4)
      addTouchpoint(s, rng.pick(KINDS), isoAt(dates[dayIdx], `${pad(rng.int(9, 14), 2)}:${pad(rng.int(0, 59), 2)}`))
    }
    if (k === 3 && rng.chance(0.4)) addTouchpoint(s, 'family', isoAt(dates[rng.int(0, 4)], '16:30'))
  }
  // This week: Monday and Tuesday morning, unless the student needs a nudge.
  if (!nudgeStudents.includes(s)) {
    if (rng.chance(0.8)) addTouchpoint(s, rng.pick(['check_in', 'goal', 'feedback']), isoAt('2026-10-19', `${pad(rng.int(9, 14), 2)}:${pad(rng.int(0, 59), 2)}`))
    if (rng.chance(0.4)) addTouchpoint(s, 'check_in', isoAt('2026-10-20', `09:${pad(rng.int(0, 59), 2)}`))
  }
}
for (const r of readyStudents) addTouchpoint(r, 'validation_prep', isoAt('2026-10-16', '11:10'), { linked_outcomes: [readySkill.get(r.id)!] })
addTouchpoint(familyStudent, 'family', isoAt('2026-10-19', '16:00'), { mentor_id: 'adu_case', private: true, notes: 'Family asked for a call this week about the placement schedule and transport. Mentor to lead; case manager joins.', follow_up: { text: 'Call the family about the placement schedule', due: '2026-10-22' } })

// ---------- plans: past weeks and this week ----------
const plans: Plan[] = []
const traces: EngineTrace[] = []
const gatheringLog: GatheringLogEntry[] = []
const baseSnapshot = (): Sandbox => ({
  meta: { seed: SEED, generated_at: new Date(0).toISOString(), week_start: WEEK_START, today: TODAY, graph_source: 'learning_commons v1.15.0' },
  students, adults, outcomes, offerings, plans, evidence, touchpoints, courses, units, lessons, assignments, places, groups,
  settings: DEFAULT_SETTINGS, futre, gathering_log: gatheringLog, traces,
})

/** The coordinator places students into RW offerings by level and pathway. */
function placeRw(weekStart: string, weekOffs: Offering[]): Map<string, string[]> {
  const rw = weekOffs.filter((o) => o.experience_type === 'RW' && o.status === 'published')
  const fill = new Map<string, number>()
  const out = new Map<string, string[]>()
  // Open (expose-level) experiences keep a few seats for students to choose in Build My Week.
  const room = (o: Offering) => (fill.get(o.id) ?? 0) < (o.entry === 'open' ? Math.max(1, o.capacity_max - 3) : o.capacity_max)
  const takeIt = (sid: string, o: Offering) => {
    fill.set(o.id, (fill.get(o.id) ?? 0) + 1)
    out.set(sid, [...(out.get(sid) ?? []), o.id])
  }
  const clash = (sid: string, o: Offering) => {
    const s = students.find((x) => x.id === sid)!
    const wd = weekdayOf(o.day)
    if (s.protected_slots.some((p) => p.day === wd && p.start < o.end && o.start < p.end)) return true
    if (s.life_constraints.some((p) => p.day === wd && p.start < o.end && o.start < p.end)) return true
    return (out.get(sid) ?? []).some((oid) => {
      const x = rw.find((y) => y.id === oid)!
      return x.day === o.day && x.start < o.end && o.start < x.end
    })
  }
  for (const s of rng.shuffle(students)) {
    const pw = PATHWAYS.find((p) => p.id === studentPathway.get(s.id))
    const prefer = (o: Offering) => (pw && pw.experiences.includes(o.source_ref) ? 0 : 1) + rng.next() * 0.5
    if (s.level === 'launch') {
      // The weekly mentor meeting comes first; the paid placement and a Friday college course fit around it.
      const mm = rw.find((o) => o.source_ref === 'XT.SCHOOL.DEFENSE')
      if (mm && room(mm)) takeIt(s.id, mm)
      for (const o of rw.filter((o) => o.source_ref === 'XT.WORK.PAID')) if (room(o) && !clash(s.id, o)) takeIt(s.id, o)
      const course = rw.filter((o) => o.kind === 'college_course' && o.day === weekDates(weekStart)[4]).sort((a, b) => prefer(a) - prefer(b)).find((o) => room(o) && !clash(s.id, o))
      if (course) takeIt(s.id, course)
      continue
    }
    const want = s.level === 'pursue' ? rng.int(2, 3) : s.level === 'explore' ? (rng.chance(0.4) ? 2 : 1) : rng.chance(0.55) ? 1 : 0
    const pool = rw.filter((o) => o.source_ref !== 'XT.WORK.PAID' && o.source_ref !== 'XT.SCHOOL.DEFENSE' && (s.level !== 'expose' || o.kind === 'expedition' || ['XT.PARKS.TRAIL', 'XT.HOSP.VOLUNTEER', 'XT.NEWS.LOCAL'].includes(o.source_ref))).sort((a, b) => prefer(a) - prefer(b))
    let n = 0
    const daysUsed = new Set<string>()
    for (const o of pool) {
      if (n >= want) break
      if (!room(o) || clash(s.id, o) || daysUsed.has(o.day)) continue
      takeIt(s.id, o)
      daysUsed.add(o.day)
      n++
    }
  }
  return out
}

const goalsFor = (s: Student): Plan['goals'] => {
  const am = activeMath.get(s.id)
  const skillId = rng.pick(placements.get(s.id)!.flatMap((p) => unitOf(courseLessons(p.course_id)[p.position]).outcomes_served.filter((o) => o.startsWith('CS.'))))
  const picks = rng.shuffle(GOALS).slice(0, rng.int(2, 3))
  return picks.map((g) => {
    const text = g.text.replace('{unit}', am ? unitOf(am.lesson).title.toLowerCase() : 'the current unit').replace('{outcome}', outcomeById.get(skillId)!.name).replace('{lesson}', am?.lesson.title ?? 'the current lesson')
    const outcome_id = g.kind === 'content' ? (am?.lesson.outcomes_served[0] ?? null) : g.kind === 'cognitive' ? skillId : (focusHabits.get(s.id)?.[0] ?? null)
    return { text, outcome_id }
  })
}

function buildWeekFor(weekStart: string, suffix: string, asOf: string, publishedAt: string, isCurrent: boolean) {
  const weekOffs = weekOfferings(weekStart, suffix)
  const snap = baseSnapshot()
  // Engine proposals: accept most, leave some for the Proposed Workshops screen this week.
  const proposals = proposeWorkshops(snap, { weekStart, asOf })
  const workshops = proposals.filter((p) => p.kind === 'workshop')
  const keep = isCurrent ? 4 : 0
  const accepted = workshops.slice(0, Math.max(0, workshops.length - keep))
  for (const p of accepted) {
    if (p.adult_id && p.place_id) off(offeringFromProposal(p, snap, { id: `off_ws_${p.lesson_id}_${p.day}_${p.start.replace(':', '')}${suffix}`.toLowerCase() }))
  }
  for (const p of proposals.filter((x) => x.kind === 'conference').slice(0, 6)) {
    if (p.adult_id) off(offeringFromProposal(p, snap, { id: `off_conf_${p.lesson_id}_${p.day}_${p.start.replace(':', '')}${suffix}`.toLowerCase(), place_id: rng.pick(['pl_nook_1', 'pl_nook_2']) }))
  }
  const rwPlacements = placeRw(weekStart, weekOffs)
  const goals = new Map(students.map((s) => [s.id, goalsFor(s)]))
  const snap2 = baseSnapshot()
  resetSlotCounter()
  const built_ = buildAllWeeks(snap2, { weekStart, asOf, rwPlacements, goals, focusHabits, runId: `build_${weekStart}`, now: publishedAt })
  const { plans: built, ledger } = built_
  // Only the current week keeps its slot traces; past weeks are history and the fixture stays small.
  if (isCurrent) traces.push(...built_.traces)
  // Students fill open slots (per plan_autonomy). Past weeks: everything; this week: most, leaving a few open.
  for (const plan of built) {
    const s = students.find((x) => x.id === plan.student_id)!
    const fillRate = isCurrent ? (s.plan_autonomy === 'guided' ? 0.75 : s.plan_autonomy === 'shared' ? 0.7 : 0.65) : 0.9
    let p = plan
    for (const slot of [...p.slots].filter((x) => x.offering_id === null && x.entry === 'chosen')) {
      const live = p.slots.find((x) => x.id === slot.id)
      if (!live || live.offering_id) continue
      if (!rng.chance(fillRate)) continue
      // Seed-time picks leave the open real-world seats for the demo (Build My Week shows them with the gap they teach).
      const opts = optionsForSlot(p, live, s, snap2, ledger).filter((o) => !o.reasons.includes('collides') && o.offering.experience_type !== 'RW')
      if (!opts.length) continue
      const pick = s.plan_autonomy === 'guided' ? opts[0] : rng.pick(opts.slice(0, 3))
      p = chooseForSlot(p, live, pick.offering, ledger, undefined, isCurrent ? traces : undefined, opts, { runId: `pick_${weekStart}`, now: publishedAt })
    }
    p = { ...p, built_by: s.plan_autonomy === 'owned' ? 'student' : 'engine', published_at: publishedAt, confirmed_by: isCurrent ? (rng.chance(0.9) ? s.mentor_id : null) : s.mentor_id, version: isCurrent ? 1 : 1 }
    // Statuses: past weeks attended with ratings; this week Monday attended and Tuesday morning done.
    const missedAll = !isCurrent && rng.chance(0.15)
    let randomMisses = 0
    const slots: Slot[] = p.slots.map((sl) => {
      const done = (!isCurrent || sl.day < TODAY || (sl.day === TODAY && sl.end <= '10:45')) && sl.offering_id !== null
      if (!done) return { ...sl, status: p.confirmed_by ? 'confirmed' : 'planned' }
      let missed = isCurrent ? (nudgeStudents.includes(s) && sl.day === '2026-10-19' && sl.entry !== 'whole_group' && sl.entry !== 'protected' ? rng.chance(0.6) : rng.chance(0.03)) : missedAll ? rng.chance(0.3) : rng.chance(0.06)
      if (isCurrent && missed && !nudgeStudents.includes(s)) {
        randomMisses++
        if (randomMisses > 1) missed = false
      }
      const status: Slot['status'] = missed ? 'missed' : 'attended'
      const rating = status === 'attended' && sl.entry !== 'protected' && sl.experience_type !== 'WC' ? rng.pick(['got_it', 'got_it', 'need_more', 'ready_for_more'] as const) : null
      return { ...sl, status, rating, goal: sl.entry === 'required' || sl.entry === 'recommended' ? (rng.chance(0.5) ? 'Finish the practice set and check it' : null) : sl.goal }
    })
    // Past weeks keep only the slots that happened; open slots never filled are dropped to keep the fixture small.
    plans.push({ ...p, slots: isCurrent ? slots : slots.filter((sl) => sl.offering_id !== null || sl.entry === 'protected') })
    if (isCurrent) {
      // A chosen offering absorbs the open slots it spans; their traces go with them. The newest trace per slot stays.
      const live = new Set(slots.map((sl) => sl.id))
      const seen = new Set<string>()
      for (let i = traces.length - 1; i >= 0; i--) {
        const t = traces[i]
        if (!t.ref_id.startsWith(p.id)) continue
        if (!live.has(t.ref_id) || seen.has(t.ref_id)) traces.splice(i, 1)
        else seen.add(t.ref_id)
      }
    }
    // Evidence from attended slots: adult observations and student reflections.
    for (const sl of slots) {
      if (sl.status !== 'attended' || !sl.offering_id) continue
      const o = offerings.find((x) => x.id === sl.offering_id)
      if (!o || o.outcomes_served.length === 0) continue
      if ((o.kind === 'workshop' || o.kind === 'conference' || o.kind === 'studio' || o.kind === 'seminar' || o.kind === 'expedition' || o.kind === 'partner_slot') && rng.chance(0.6)) {
        ev({ student_id: s.id, outcome_id: o.outcomes_served[0], source: 'adult_note', source_ref: o.title, value_kind: 'text', value: rng.pick(ADULT_OBSERVATIONS), artifact_url: null, recorded_by: o.adult_ids[0] ?? 'adu_coach', recorded_at: isoAt(sl.day, sl.end), slot_id: sl.id })
      }
      if (sl.experience_type === 'RG' && rng.chance(0.85)) {
        const focus = rng.pick(slots.filter((x) => x.day === sl.day && x.offering_id && x.experience_type !== 'WC' && x.experience_type !== 'RG'))
        const fo = focus ? offerings.find((x) => x.id === focus.offering_id) : null
        const oid = fo?.outcomes_served[0] ?? focusHabits.get(s.id)?.[0] ?? 'HOS.SELF_DIRECTION'
        ev({ student_id: s.id, outcome_id: oid, source: 'student_reflection', source_ref: null, value_kind: 'text', value: rng.pick(REFLECTIONS).replace('{outcome}', outcomeById.get(oid)?.name.toLowerCase() ?? 'the lesson'), artifact_url: null, recorded_by: s.id, recorded_at: isoAt(sl.day, '15:25'), slot_id: sl.id })
      }
    }
  }
}

for (let k = 0; k < PAST_WEEKS; k++) {
  const ws = shiftDate(WEEK_START, -7 * (PAST_WEEKS - k))
  buildWeekFor(ws, `_w${k + 1}`, shiftDate(ws, -3), isoAt(shiftDate(ws, -3), '17:00'), false)
}
// A booked assessment for one student who is not among the three ready-for-validation students.
const assessedStudent = rng.pick(students.filter((s) => !readyStudents.includes(s) && s.level !== 'expose'))
off({ id: `off_assess_${assessedStudent.id}`, experience_type: 'PP', kind: 'assessment', title: 'Cognitive skill assessment', lesson_id: null, outcomes_served: ['CS.WRI.EVEXPLAIN'], adult_ids: ['adu_english'], place_id: 'pl_nook_1', day: '2026-10-22', start: '10:00', end: '10:45', capacity_min: 1, capacity_max: 1, entry: 'invited', source: 'homebase', source_ref: `assess:${assessedStudent.id}`, standing: false, status: 'published' })
buildWeekFor(WEEK_START, '', '2026-10-16', PUBLISHED_AT, true)

// Launch students: a text check-in instead of a daily reflection in the room is a later refinement; v1 keeps the slots.

// ---------- gathering log ----------
const sources = ['kira', 'teach_to_one', 'futre', 'calendar', 'partner', 'gradebook']
for (const src of sources) {
  const rows = evidence.filter((e) => e.source === src && e.recorded_at >= '2026-10-12')
  const offs = offerings.filter((o) => o.source === src && o.day >= WEEK_START)
  gatheringLog.push({ id: `log_${src}`, source: src, pulled_at: '2026-10-16T16:45:00.000Z', received: rows.length + offs.length, unmapped: src === 'kira' ? 3 : src === 'teach_to_one' ? 1 : 0, refused: src === 'kira' ? 2 : 0, stale: src === 'gradebook', message: src === 'gradebook' ? 'Nothing new in nine days. Transition source; expected.' : `${rows.length} evidence rows and ${offs.length} offerings this pull.` })
}
gatheringLog.push({ id: 'log_graph', source: 'knowledge_graph', pulled_at: '2026-10-16T16:40:00.000Z', received: 0, unmapped: 0, refused: 0, stale: false, message: 'Learning Commons v1.15.0 for math standards, components, and progressions; Summit rubric and authored edges for the rest.' })

// ---------- write ----------
const sandbox: Sandbox = { ...baseSnapshot(), meta: { ...baseSnapshot().meta, generated_at: '2026-10-16T17:00:00.000Z' } }
const parsed = SandboxSchema.parse(sandbox)
mkdirSync('public/sandbox', { recursive: true })
writeFileSync('public/sandbox/sandbox.json', JSON.stringify(parsed))
for (const src of ['kira', 'teach_to_one', 'futre', 'calendar', 'partner', 'gradebook']) {
  writeFileSync(`public/sandbox/${src}.json`, JSON.stringify({ name: src, offerings: parsed.offerings.filter((o) => o.source === src), evidence: parsed.evidence.filter((e) => e.source === src), lastPull: '2026-10-16T16:45:00.000Z' }))
}
writeFileSync('public/sandbox/futre-records.json', JSON.stringify(parsed.futre))
const counts = Object.fromEntries(Object.entries(parsed).filter(([k]) => k !== 'meta' && k !== 'settings').map(([k, v]) => [k, Array.isArray(v) ? v.length : 1]))
console.log(JSON.stringify(counts))
