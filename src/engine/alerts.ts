import type { Sandbox } from '@/model'
import { daysBetween, minutesBetween, schoolDaysBetween, shiftDate, weekDates } from '@/lib/time'
import { needs } from './needs'
import { newLedger } from './build'
import { BLOCKS } from './types'

export type AlertKind = 'unfilled_required' | 'protected_short' | 'hub_over' | 'partner_unfilled' | 'no_touchpoint' | 'adult_load' | 'stale_evidence'
export interface Alert {
  kind: AlertKind
  severity: 'high' | 'medium' | 'low'
  subject_id: string
  subject_name: string
  detail: string
  /** Route that resolves it. */
  to: string
}

/** Spec 5 dashboard alerts, each linked to where to fix it. */
export function alerts(snap: Sandbox): Alert[] {
  const out: Alert[] = []
  const today = snap.meta.today
  const weekStart = snap.meta.week_start
  const current = snap.plans.filter((p) => p.week_start === weekStart)
  const ledger = newLedger(snap)
  for (const s of snap.students) {
    const plan = current.find((p) => p.student_id === s.id)
    const req = needs(s.id, snap).filter((n) => n.kind === 'required')
    for (const n of req) {
      const covered = plan?.slots.some((sl) => sl.entry === 'required' && sl.status !== 'cancelled' && sl.status !== 'moved' && (sl.evidence_id === n.evidence_id || (n.lesson_id && snap.offerings.find((o) => o.id === sl.offering_id)?.lesson_id === n.lesson_id)))
      if (!covered) out.push({ kind: 'unfilled_required', severity: 'high', subject_id: s.id, subject_name: s.display_name, detail: n.outcome_name, to: `/m/${s.mentor_id}/student/${s.id}` })
    }
    if (s.protected_slots.length && plan) {
      const needMin = s.protected_slots.reduce((m, p) => m + minutesBetween(p.start, p.end), 0)
      const haveMin = plan.slots.filter((sl) => sl.entry === 'protected').reduce((m, sl) => m + minutesBetween(sl.start, sl.end), 0)
      if (haveMin < needMin) out.push({ kind: 'protected_short', severity: 'high', subject_id: s.id, subject_name: s.display_name, detail: `${haveMin} of ${needMin} minutes`, to: `/m/${s.mentor_id}/student/${s.id}` })
    }
    const lastTp = snap.touchpoints.filter((t) => t.student_id === s.id && t.when <= `${today}T23:59`).sort((a, b) => (a.when < b.when ? 1 : -1))[0]
    const gap = lastTp ? schoolDaysBetween(lastTp.when.slice(0, 10), today) : 99
    if (gap >= 5) out.push({ kind: 'no_touchpoint', severity: 'medium', subject_id: s.id, subject_name: s.display_name, detail: `${gap} school days`, to: `/m/${s.mentor_id}/touchpoints` })
  }
  const hub = snap.places.find((p) => p.kind === 'hub')
  if (hub) {
    for (const d of weekDates(weekStart)) {
      for (const b of BLOCKS) {
        const n = snap.offerings.filter((o) => o.day === d && o.start === b.start && o.place_id === hub.id && o.status === 'published').reduce((m, o) => m + (ledger.fill.get(o.id) ?? 0), 0)
        const adults = new Set(snap.offerings.filter((o) => o.day === d && o.start === b.start && o.place_id === hub.id && o.status === 'published').flatMap((o) => o.adult_ids)).size
        if (n > hub.capacity || (n > 0 && adults < hub.adults_required)) out.push({ kind: 'hub_over', severity: 'high', subject_id: `${d}-${b.start}`, subject_name: hub.name, detail: `${d} ${b.start}: ${n} placed, ${adults} adults`, to: '/l/live' })
      }
    }
  }
  for (const o of snap.offerings) {
    if (o.experience_type !== 'RW' || o.status !== 'published' || o.day < today) continue
    const fill = ledger.fill.get(o.id) ?? 0
    if (fill < o.capacity_min && daysBetween(today, o.day) <= 2) out.push({ kind: 'partner_unfilled', severity: 'medium', subject_id: o.id, subject_name: o.title, detail: `${o.day} ${o.start}: ${fill} of ${o.capacity_min} minimum`, to: '/l/partners' })
  }
  for (const a of snap.adults) {
    if (a.capacities.includes('partner') || a.capacities.includes('leader') || a.capacities.includes('case_manager')) continue
    const n = snap.offerings.filter((o) => o.day === today && o.status === 'published' && o.adult_ids.includes(a.id) && o.kind !== 'community' && o.kind !== 'practice').length
    if (n > 6 || n < 2) out.push({ kind: 'adult_load', severity: 'medium', subject_id: a.id, subject_name: a.display_name, detail: `${n} offerings today`, to: '/l/time' })
  }
  for (const g of snap.gathering_log) {
    const latest = snap.evidence.filter((e) => e.source === g.source).sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0]
    const postedOfferings = snap.offerings.some((o) => o.source === g.source && o.day >= weekStart)
    const age = latest ? daysBetween(latest.recorded_at, today) : postedOfferings ? 0 : 99
    if (g.source !== 'knowledge_graph' && (g.stale || age >= 7)) out.push({ kind: 'stale_evidence', severity: 'low', subject_id: g.source, subject_name: g.source, detail: latest ? `${age} days since the last row` : 'nothing yet', to: '/l/evidence' })
  }
  void shiftDate
  return out.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.severity] - ({ high: 0, medium: 1, low: 2 })[b.severity])
}
