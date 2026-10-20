import type { Evidence, Offering, Slot } from '@/model'

/** Spec 7 adapter interface. In sandbox mode every adapter is a stub fed by the seed. */
export interface SourceAdapter {
  name: 'futre' | 'kira' | 'teach_to_one' | 'calendar' | 'partner' | 'gradebook'
  pullOfferings(week: Date): Promise<Offering[]>
  pullEvidence(since: Date): Promise<Evidence[]>
  pushCompletion?(slot: Slot): void
  health(): { ok: boolean; lastPull: Date; message: string }
}
