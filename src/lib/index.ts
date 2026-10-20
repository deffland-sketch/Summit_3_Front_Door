import type { Evidence, Plan, Sandbox, Slot, Student } from '@/model'

/** Index helpers over a snapshot. Cheap to rebuild; memoize at the call site when hot. */
export function byId<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((x) => [x.id, x]))
}
export function groupBy<T, K extends string>(list: T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const x of list) {
    const k = key(x)
    m.set(k, [...(m.get(k) ?? []), x])
  }
  return m
}
export function currentPlan(snap: Sandbox, studentId: string, weekStart = snap.meta.week_start): Plan | undefined {
  return snap.plans.find((p) => p.student_id === studentId && p.week_start === weekStart)
}
export function allSlots(snap: Sandbox, weekStart = snap.meta.week_start): Slot[] {
  return snap.plans.filter((p) => p.week_start === weekStart).flatMap((p) => p.slots)
}
export function evidenceFor(snap: Sandbox, studentId: string): Evidence[] {
  return snap.evidence.filter((e) => e.student_id === studentId)
}
export function latestByOutcome(evidence: Evidence[], asOf?: string): Map<string, Evidence> {
  const m = new Map<string, Evidence>()
  for (const e of evidence) {
    if (asOf && e.recorded_at > asOf) continue
    const cur = m.get(e.outcome_id)
    if (!cur || e.recorded_at > cur.recorded_at) m.set(e.outcome_id, e)
  }
  return m
}
export function studentById(snap: Sandbox, id: string): Student | undefined {
  return snap.students.find((s) => s.id === id)
}
export function firstName(name: string): string {
  return name.split(' ')[0]
}
