import type { Sandbox } from '@/model'
import { weekDates } from '@/lib/time'
import { newLedger } from './build'
import { BLOCKS } from './types'

export interface HubBlock {
  day: string
  start: string
  placed: number
  adults: number
  adults_required: number
  capacity: number
  /** Students are placed and fewer adults than the hub requires are in it that block. */
  adults_short: boolean
  over_capacity: boolean
}

/** The practice hub block by block: students placed, adults in the room, and whether either rule is broken (Spec 4 The Weekly Build, Spec 5 alerts). */
export function hubLoad(snap: Sandbox, weekStart = snap.meta.week_start): HubBlock[] {
  const hub = snap.places.find((p) => p.kind === 'hub')
  if (!hub) return []
  const ledger = newLedger(snap, weekStart)
  const out: HubBlock[] = []
  for (const day of weekDates(weekStart)) {
    for (const b of BLOCKS) {
      const here = snap.offerings.filter((o) => o.day === day && o.start === b.start && o.place_id === hub.id && o.status === 'published')
      const placed = here.reduce((m, o) => m + (ledger.fill.get(o.id) ?? 0), 0)
      const adults = new Set(here.flatMap((o) => o.adult_ids)).size
      out.push({ day, start: b.start, placed, adults, adults_required: hub.adults_required, capacity: hub.capacity, adults_short: placed > 0 && adults < hub.adults_required, over_capacity: placed > hub.capacity })
    }
  }
  return out
}
