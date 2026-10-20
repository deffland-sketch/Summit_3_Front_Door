import type { ExperienceType, Plan, Sandbox } from '@/model'
import { minutesBetween } from '@/lib/time'
import { TYPE_ORDER } from '@/engine/types'

export function currentPlans(snap: Sandbox): Plan[] {
  return snap.plans.filter((p) => p.week_start === snap.meta.week_start)
}

export function liveSlots(plans: Plan[]) {
  return plans.flatMap((p) => p.slots.filter((s) => s.offering_id !== null && s.status !== 'cancelled' && s.status !== 'moved'))
}

/** Share of student minutes per experience type across the given plans. */
export function typeShares(plans: Plan[]): Record<ExperienceType, number> {
  const mins: Record<string, number> = {}
  let total = 0
  for (const s of liveSlots(plans)) {
    const m = minutesBetween(s.start, s.end)
    mins[s.experience_type] = (mins[s.experience_type] ?? 0) + m
    total += m
  }
  const out = {} as Record<ExperienceType, number>
  for (const t of TYPE_ORDER) out[t] = total ? (mins[t] ?? 0) / total : 0
  return out
}

/** Weighted target shares across the student mix. */
export function targetShares(snap: Sandbox): Record<ExperienceType, number> {
  const out = {} as Record<ExperienceType, number>
  for (const t of TYPE_ORDER) out[t] = 0
  for (const s of snap.students) for (const t of TYPE_ORDER) out[t] += (snap.settings.level_targets[s.level]?.[t] ?? 0) / snap.students.length
  return out
}

export const pct = (v: number) => Math.round(v * 100)
