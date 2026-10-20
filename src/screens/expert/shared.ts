import type { Offering, Sandbox, Slot, Student } from '@/model'

/** Students placed into an offering this week. */
export function rosterFor(snap: Sandbox, offeringId: string): { student: Student; slot: Slot }[] {
  const out: { student: Student; slot: Slot }[] = []
  for (const p of snap.plans) {
    if (p.week_start !== snap.meta.week_start) continue
    for (const s of p.slots) {
      if (s.offering_id === offeringId && s.status !== 'cancelled' && s.status !== 'moved') {
        const st = snap.students.find((x) => x.id === p.student_id)
        if (st) out.push({ student: st, slot: s })
      }
    }
  }
  return out.sort((a, b) => a.student.display_name.localeCompare(b.student.display_name))
}

export function weekOfferingsFor(snap: Sandbox, adultId?: string): Offering[] {
  return snap.offerings
    .filter((o) => o.day >= snap.meta.week_start && o.day <= shift(snap.meta.week_start, 4) && (!adultId || o.adult_ids.includes(adultId)))
    .sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day)))
}
function shift(d: string, n: number): string {
  const x = new Date(`${d}T12:00:00Z`)
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
