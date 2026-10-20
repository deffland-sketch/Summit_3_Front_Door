import type { Evidence, Offering, Slot } from '@/model'
import type { SourceAdapter } from './types'

interface StubFile {
  name: string
  offerings: Offering[]
  evidence: Evidence[]
  lastPull: string
}

/** A sandbox stub that reads /sandbox/{name}.json and returns it as if pulled (Spec 7). */
export function stubAdapter(name: SourceAdapter['name']): SourceAdapter {
  let cache: StubFile | null = null
  const load = async (): Promise<StubFile> => {
    if (cache) return cache
    const base = import.meta.env?.BASE_URL ?? '/'
    const r = await fetch(`${base}sandbox/${name}.json`)
    cache = (await r.json()) as StubFile
    return cache
  }
  return {
    name,
    async pullOfferings(week: Date) {
      const f = await load()
      const ws = week.toISOString().slice(0, 10)
      return f.offerings.filter((o) => o.day >= ws)
    },
    async pullEvidence(since: Date) {
      const f = await load()
      return f.evidence.filter((e) => e.recorded_at >= since.toISOString())
    },
    pushCompletion(slot: Slot) {
      void slot
    },
    health() {
      return { ok: true, lastPull: new Date(cache?.lastPull ?? '2026-10-16T16:45:00Z'), message: 'Sandbox stub; fixed lastPull' }
    },
  }
}

export const kiraAdapter = stubAdapter('kira')
export const teachToOneAdapter = stubAdapter('teach_to_one')
export const calendarAdapter = stubAdapter('calendar')
export const partnerAdapter = stubAdapter('partner')
export const gradebookAdapter = stubAdapter('gradebook')
