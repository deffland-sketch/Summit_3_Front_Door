/**
 * Audit export (Spec 6 Audit Export, Spec 5 Engine Audit): twenty proposals and twenty placed Required slots,
 * each with its rationale, a one-line trace summary, and a blank column for a real teacher or coordinator.
 */
import type { EngineTrace, Sandbox, TracePart } from '@/model'
import { byId } from '@/lib'
import { shiftDate, shortDate } from '@/lib/time'
import { proposeWorkshops } from './propose'

export const AUDIT_QUESTION = 'Would you accept this? Why or why not?'

/** One line that says what a trace rests on: rows read, settings that mattered, edges walked, candidates and why they lost. */
export function traceSummary(t: TracePart, snap: Sandbox): string {
  const rows = t.evidence_ids.map((id) => snap.evidence.find((e) => e.id === id)).filter((e) => e !== undefined)
  const sources = [...new Set(rows.map((e) => e.source))]
  const days = rows.map((e) => e.recorded_at.slice(0, 10)).sort()
  const evidence = rows.length ? `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} (${sources.join(', ')}${days.length ? `, ${shortDate(days[0])}${days.length > 1 ? ` to ${shortDate(days[days.length - 1])}` : ''}` : ''})` : 'no evidence row; a rule placed it'
  const keys = ['mastery_below_pct', 'within_points', 'grouping_threshold', 'workshop_max', 'max_overnight_moves', 'stale_days', 'level', 'target_PF', 'target_RW']
  const settings = keys.filter((k) => k in t.settings).map((k) => `${k} ${String(t.settings[k])}`).join(', ')
  const edges = t.edges.length ? `${t.edges.length} ${t.edges.length === 1 ? 'edge' : 'edges'} (${[...new Set(t.edges.map((e) => e.type))].join(', ')})` : 'no edge'
  const losers = t.candidates.filter((c) => c.lost_because)
  const reasons = [...new Set(losers.map((c) => c.lost_because!))].slice(0, 3)
  const candidates = t.candidates.length ? `${t.candidates.length} candidates${reasons.length ? `, lost on: ${reasons.join('; ')}` : ''}` : 'no alternative weighed'
  return `${evidence}; ${settings || 'default settings'}; ${edges}; ${candidates}.`
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** The markdown file. Deterministic for a given snapshot and date. */
export function engineAudit(snap: Sandbox, date = snap.meta.today): string {
  const students = byId(snap.students)
  const offerings = byId(snap.offerings)
  const lines: string[] = []
  lines.push(`# Engine audit, ${date}`, '')
  lines.push(`Twenty workshop or conference proposals and twenty placed Required slots from the sandbox week of ${snap.meta.week_start}, each with the engine's rationale and a one-line summary of what it read, the settings that mattered, the graph edges it walked, and the candidates it set aside. The last column is yours: a math teacher or a coordinator should be able to read a row and say whether they would accept it, and why. Settings at the time: required below ${snap.settings.required_rule.mastery_below_pct}%, recommended within ${snap.settings.recommended_rule.within_points} points, grouping threshold ${snap.settings.grouping_threshold}, workshops ${snap.settings.workshop_size.min} to ${snap.settings.workshop_size.max}.`, '')
  lines.push('## Proposals', '')
  lines.push(`| # | Week | Lesson | Kind | Students | When | Rationale | If declined | Trace summary | ${AUDIT_QUESTION} |`)
  lines.push('|---|---|---|---|---|---|---|---|---|---|')
  // This week's open proposals first, then what the engine would propose for next week, up to twenty.
  const nextWeek = shiftDate(snap.meta.week_start, 7)
  const proposals = [
    ...proposeWorkshops(snap).map((p) => ({ p, week: 'this week' })),
    ...proposeWorkshops(snap, { weekStart: nextWeek }).map((p) => ({ p, week: 'next week' })),
  ].slice(0, 20)
  proposals.forEach(({ p, week }, i) => {
    const names = p.student_ids.map((sid) => students.get(sid)?.display_name ?? sid).join(', ')
    const when = p.adult_id ? `${shortDate(p.day)} ${p.start}` : 'no time found'
    const declined = p.if_declined.map((d) => `${students.get(d.student_id)?.display_name ?? d.student_id}: ${d.text}`).join('; ')
    lines.push(`| ${i + 1} | ${week} | ${cell(p.lesson_title)} | ${p.kind} | ${cell(names)} | ${when} | ${cell(p.rationale)} | ${cell(declined)} | ${cell(traceSummary(p.trace, snap))} |  |`)
  })
  lines.push('', '## Placed Required slots', '')
  lines.push(`| # | Student | Level | Slot | Why | Trace summary | ${AUDIT_QUESTION} |`)
  lines.push('|---|---|---|---|---|---|---|')
  const latest = new Map<string, EngineTrace>()
  for (const t of snap.traces) {
    const prev = latest.get(t.ref_id)
    if (!prev || prev.at < t.at) latest.set(t.ref_id, t)
  }
  const required = snap.plans
    .filter((p) => p.week_start === snap.meta.week_start)
    .flatMap((p) => p.slots.filter((s) => s.entry === 'required' && s.status !== 'cancelled' && s.status !== 'moved').map((s) => ({ p, s })))
    .sort((a, b) => a.p.student_id.localeCompare(b.p.student_id) || a.s.day.localeCompare(b.s.day) || a.s.start.localeCompare(b.s.start))
    .slice(0, 20)
  required.forEach(({ p, s }, i) => {
    const st = students.get(p.student_id)
    const t = latest.get(s.id)
    const slot = `${shortDate(s.day)} ${s.start}, ${offerings.get(s.offering_id ?? '')?.title ?? s.experience_type}`
    lines.push(`| ${i + 1} | ${cell(st?.display_name ?? p.student_id)} | ${st?.level ?? ''} | ${cell(slot)} | ${cell(s.why)} | ${t ? cell(traceSummary(t, snap)) : 'no stored trace'} |  |`)
  })
  lines.push('', `Generated from the sandbox on ${date}. ${proposals.length} proposals and ${required.length} Required slots.`, '')
  return lines.join('\n')
}
