import { z } from 'zod'
import { ClockTimeSchema, DateTimeSchema, ExperienceTypeSchema, IdSchema, IsoDateSchema } from './enums'

export const SLOT_ENTRY = ['required', 'recommended', 'chosen', 'protected', 'assigned', 'whole_group'] as const
export const SLOT_STATUS = ['planned', 'confirmed', 'attended', 'missed', 'moved', 'cancelled'] as const
export const SLOT_RATINGS = ['got_it', 'need_more', 'ready_for_more'] as const

export const SlotSchema = z.object({
  id: IdSchema,
  plan_id: IdSchema,
  day: IsoDateSchema,
  start: ClockTimeSchema,
  end: ClockTimeSchema,
  experience_type: ExperienceTypeSchema,
  offering_id: IdSchema.nullable(),
  entry: z.enum(SLOT_ENTRY),
  why: z.string(),
  goal: z.string().nullable(),
  status: z.enum(SLOT_STATUS),
  rating: z.enum(SLOT_RATINGS).nullable(),
  bring: z.string().nullable(),
  /** The evidence row that placed this slot, when a need placed it. */
  evidence_id: IdSchema.nullable(),
  /** When the slot was added after publish; null for slots in the published week. */
  added_at: DateTimeSchema.nullable(),
})
export type Slot = z.infer<typeof SlotSchema>
