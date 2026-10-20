import { expect, test } from '@playwright/test'
import { adjustOvernight, needs } from '../../src/engine'
import { fresh, sandbox } from './helpers'

const BANNED = /\b(behind|failing|at risk|deficient|low performer)\b/i
/** A why names its evidence by source and day ("the Kira check from Thu Oct 15") or names a graph edge in plain words. */
const SOURCE = /\b(Kira check|Teach to One session|gradebook entry|assessment|Futre reflection|note from your adult|reflection|exhibition|outside record) from (Mon|Tue|Wed|Thu|Fri|Sat|Sun) [A-Z][a-z]{2} \d{1,2}\b/
const EDGE = /\b(builds toward|builds|sits under|asks for|leads to|is part of|lines up with|serves)\b/

/** A deterministic shuffle so the sample is the same every run. */
function sample<T>(list: T[], n: number, seed = 23): T[] {
  const out = [...list]
  let x = seed
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) % 2147483648
    const j = x % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.slice(0, n)
}

test('23 fifty why lines across needs, placed slots, and overnight moves each name an evidence source and day or a graph edge, and none uses a deficit word', () => {
  const snap = fresh()
  const lines: { from: string; why: string }[] = []
  // Needs across the school.
  for (const s of snap.students) for (const n of needs(s.id, snap)) lines.push({ from: `need ${s.id} ${n.kind}`, why: n.why })
  // Placed slots that rest on evidence or the graph: Required, Recommended, assigned, and real-world slots on a pathway.
  for (const p of snap.plans.filter((x) => x.week_start === snap.meta.week_start)) {
    for (const sl of p.slots) {
      if (sl.status === 'cancelled') continue
      if (sl.entry === 'required' || sl.entry === 'recommended' || sl.entry === 'assigned') lines.push({ from: `slot ${sl.id} ${sl.entry}`, why: sl.why })
    }
  }
  // Overnight moves: a cancelled partner slot and a new low score.
  const partner = snap.offerings.filter((o) => o.kind === 'partner_slot' && o.status === 'published' && o.day > snap.meta.today).sort((a, b) => a.day.localeCompare(b.day))[0]!
  partner.status = 'cancelled'
  const student = snap.students.find((s) => {
    const plan = snap.plans.find((x) => x.student_id === s.id && x.week_start === snap.meta.week_start)!
    const open = plan.slots.some((x) => x.offering_id === null && x.entry === 'chosen' && x.day > snap.meta.today)
    const quiet = !needs(s.id, snap).some((x) => x.kind === 'required' || x.kind === 'recommended')
    return open && quiet && snap.assignments.some((a) => a.student_id === s.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))
  })!
  const asg = snap.assignments.find((a) => a.student_id === student.id && a.status === 'active' && a.lesson_id.startsWith('les_im'))!
  const lesson = snap.lessons.find((l) => l.id === asg.lesson_id)!
  snap.evidence.push({ id: 'ev_s23', student_id: student.id, outcome_id: lesson.outcomes_served[0], source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: 38, artifact_url: null, recorded_by: 'system', recorded_at: `${snap.meta.today}T20:00:00.000Z`, slot_id: null })
  const { moves } = adjustOvernight(snap, { since: `${snap.meta.today}T12:00:00.000Z` })
  expect(moves.length).toBeGreaterThan(0)
  for (const m of moves) lines.push({ from: `move ${m.student_id} ${m.kind}`, why: m.why })

  expect(lines.length).toBeGreaterThan(200)
  // Fifty lines, stratified so moves (few) sit beside needs and slots (many).
  const kind = (k: string) => lines.filter((l) => l.from.startsWith(k))
  const moveLines = sample(kind('move'), 10)
  const picked = [...moveLines, ...sample(kind('need'), 20), ...sample(kind('slot'), 30 - moveLines.length)]
  expect(picked).toHaveLength(50)
  expect(new Set(picked.map((l) => l.from.split(' ')[0])).size, 'needs, slots, and moves all in the sample').toBe(3)
  for (const l of picked) {
    expect(l.why, l.from).toMatch(new RegExp(`${SOURCE.source}|${EDGE.source}`))
    expect(l.why, l.from).not.toMatch(BANNED)
  }
  // The banned list holds across every why line, not only the sample.
  for (const l of lines) expect(l.why, l.from).not.toMatch(BANNED)
  // Specific shapes: a content Required why names the row; a move from a cancelled slot names where it went and what that builds.
  const req = lines.find((l) => l.from.endsWith('required') && l.from.startsWith('need'))!
  expect(req.why).toMatch(/score was \d+ on the .* from (Mon|Tue|Wed|Thu|Fri)/)
  const moved = moves.find((m) => m.kind === 'moved')
  if (moved) expect(moved.why).toMatch(/was cancelled, so this moved to .*, which builds/)
  const added = moves.find((m) => m.student_id === student.id)!
  expect(added.why).toMatch(/38 on the Kira check from (Mon|Tue|Wed|Thu|Fri)/)
})
