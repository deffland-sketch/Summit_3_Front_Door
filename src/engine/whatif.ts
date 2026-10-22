/**
 * What-if (Spec 6): preview one change against a copy of the sandbox and diff the week before and after,
 * for one student and for the school. Nothing here writes to the store; Apply runs the real action.
 */
import type { ExperienceType, Plan, Sandbox, Slot } from '@/model'
import { shiftDate } from '@/lib/time'
import { adjustOvernight } from './overnight'
import { rebuildCurrentWeek } from './build'
import { proposeWorkshops } from './propose'
import { alerts } from './alerts'
import { TYPE_ORDER } from './types'

export type WhatIfChange =
  | { kind: 'setting'; key: string; value: number | boolean | string }
  | { kind: 'score'; student_id: string; lesson_id: string; outcome_id: string; value: number }
  | { kind: 'adult_out'; adult_id: string; day: string }

export interface SchoolCounts {
  by_type: Record<ExperienceType, number>
  proposals: number
  alerts: number
  students_changed: number
}

export interface WhatIfResult {
  change: WhatIfChange
  student: { id: string; added: Slot[]; removed: Slot[]; moved: { before: Slot; after: Slot }[] } | null
  school: { before: SchoolCounts; after: SchoolCounts }
  ms: number
}

const live = (s: Slot) => s.status !== 'cancelled' && s.status !== 'moved'
const key = (s: Slot) => `${s.day} ${s.start} ${s.offering_id ?? 'open'} ${s.entry}`

function counts(snap: Sandbox, before?: Sandbox): SchoolCounts {
  const by_type = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<ExperienceType, number>
  const current = snap.plans.filter((p) => p.week_start === snap.meta.week_start)
  for (const p of current) for (const s of p.slots) if (live(s) && s.offering_id) by_type[s.experience_type]++
  let changed = 0
  if (before) {
    const prev = new Map(before.plans.filter((p) => p.week_start === before.meta.week_start).map((p) => [p.student_id, p]))
    for (const p of current) {
      const q = prev.get(p.student_id)
      const a = p.slots.filter(live).map(key).sort().join('|')
      const b = q ? q.slots.filter(live).map(key).sort().join('|') : ''
      if (a !== b) changed++
    }
  }
  return { by_type, proposals: proposeWorkshops(snap).filter((p) => p.kind === 'workshop').length, alerts: alerts(snap).length, students_changed: changed }
}

/** Apply the change to a copy and return the copy with its week recomputed. Exported so Apply and the preview share one path. */
export function simulate(snap: Sandbox, change: WhatIfChange, now = new Date().toISOString()): Sandbox {
  const copy: Sandbox = { ...snap, settings: { ...snap.settings }, evidence: [...snap.evidence], offerings: snap.offerings.map((o) => ({ ...o })), plans: [...snap.plans] }
  const replacePlans = (plans: Plan[]) => {
    const ids = new Set(plans.map((p) => p.id))
    copy.plans = [...copy.plans.filter((p) => !ids.has(p.id)), ...plans]
  }
  if (change.kind === 'setting') {
    ;(copy.settings as unknown as Record<string, unknown>)[change.key] = change.value
    replacePlans(rebuildCurrentWeek(copy, { runId: 'whatif', now }).plans)
  } else if (change.kind === 'score') {
    const at = `${copy.meta.today}T20:00:00.000Z`
    copy.evidence.push({ id: `ev_whatif_${change.student_id}`, student_id: change.student_id, outcome_id: change.outcome_id, source: 'kira', source_ref: change.lesson_id, value_kind: 'mastery_pct', value: change.value, artifact_url: null, recorded_by: 'system', recorded_at: at, slot_id: null })
    replacePlans(adjustOvernight(copy, { since: `${copy.meta.today}T12:00:00.000Z`, today: copy.meta.today, now }).plans)
  } else {
    for (const o of copy.offerings) {
      if (o.day === change.day && o.adult_ids.includes(change.adult_id) && o.status === 'published' && o.kind !== 'practice' && o.kind !== 'community') o.status = 'cancelled'
    }
    replacePlans(adjustOvernight(copy, { since: '2099-01-01T00:00:00.000Z', today: shiftDate(change.day, -1), now }).plans)
  }
  return copy
}

/** The preview: before and after for one student and for the school. */
export function whatIf(snap: Sandbox, change: WhatIfChange, studentId: string | null, now?: string): WhatIfResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const after = simulate(snap, change, now)
  let student: WhatIfResult['student'] = null
  if (studentId) {
    const before = snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
    const next = after.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
    const a = (before?.slots ?? []).filter(live)
    const b = (next?.slots ?? []).filter(live)
    const aKeys = new Set(a.map(key))
    const bKeys = new Set(b.map(key))
    let added = b.filter((s) => !aKeys.has(key(s)))
    let removed = a.filter((s) => !bKeys.has(key(s)))
    const moved: { before: Slot; after: Slot }[] = []
    for (const r of removed) {
      const m = added.find((x) => x.offering_id && x.offering_id === r.offering_id)
      if (m) moved.push({ before: r, after: m })
    }
    added = added.filter((x) => !moved.some((m) => m.after === x))
    removed = removed.filter((x) => !moved.some((m) => m.before === x))
    student = { id: studentId, added, removed, moved }
  }
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  return { change, student, school: { before: counts(snap), after: counts(after, snap) }, ms: Math.round(t1 - t0) }
}
