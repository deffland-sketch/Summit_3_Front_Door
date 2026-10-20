import type { Offering, Sandbox, Slot, Student } from '@/model'
import { overlaps, weekdayOf } from '@/lib/time'

/** Why a student cannot be at a given day and time. Empty when free. */
export function collisionsFor(student: Student, day: string, start: string, end: string, existing: Slot[], snap: Sandbox): string[] {
  const wd = weekdayOf(day)
  const reasons: string[] = []
  for (const p of student.protected_slots) if (p.day === wd && overlaps(p.start, p.end, start, end)) reasons.push('protected')
  for (const c of student.life_constraints) if (c.day === wd && overlaps(c.start, c.end, start, end)) reasons.push(`life: ${c.label}`)
  for (const s of existing) {
    if (s.day !== day || s.status === 'cancelled' || s.status === 'moved') continue
    if (overlaps(s.start, s.end, start, end)) {
      const o = s.offering_id ? snap.offerings.find((x) => x.id === s.offering_id) : null
      reasons.push(s.experience_type === 'RW' ? 'placement' : s.entry === 'protected' ? 'protected' : `slot: ${o?.title ?? s.experience_type}`)
    }
  }
  return reasons
}

export function adultFree(adultId: string, day: string, start: string, end: string, snap: Sandbox, extra: Offering[] = []): boolean {
  const adult = snap.adults.find((a) => a.id === adultId)
  if (!adult) return false
  const wd = weekdayOf(day)
  const teaching = adult.availability.some((a) => a.day === wd && a.kind !== 'out' && a.kind !== 'prep' && a.start <= start && a.end >= end)
  if (!teaching) return false
  const busy = [...snap.offerings, ...extra].some(
    (o) => o.status === 'published' && o.day === day && o.adult_ids.includes(adultId) && overlaps(o.start, o.end, start, end) && o.kind !== 'practice',
  )
  return !busy
}

export function placeFree(placeId: string, day: string, start: string, end: string, snap: Sandbox, extra: Offering[] = []): boolean {
  return ![...snap.offerings, ...extra].some((o) => o.status === 'published' && o.day === day && o.place_id === placeId && overlaps(o.start, o.end, start, end))
}
