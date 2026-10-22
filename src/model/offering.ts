import { z } from 'zod'
import { ClockTimeSchema, ExperienceTypeSchema, IdSchema, IsoDateSchema } from './enums'

export const OFFERING_KINDS = [
  'workshop',
  'practice',
  'conference',
  'seminar',
  'studio',
  'expedition',
  'partner_slot',
  'event',
  'college_course',
  'community',
  'exhibition',
  'assessment',
] as const
export const OFFERING_ENTRY = ['required', 'recommended', 'open', 'invited', 'assigned'] as const
export const OFFERING_SOURCES = ['homebase', 'kira', 'teach_to_one', 'futre', 'partner', 'calendar'] as const
export const OFFERING_STATUS = ['draft', 'published', 'cancelled'] as const

export const OfferingSchema = z.object({
  id: IdSchema,
  experience_type: ExperienceTypeSchema,
  kind: z.enum(OFFERING_KINDS),
  title: z.string().min(1),
  lesson_id: IdSchema.nullable(),
  outcomes_served: z.array(IdSchema),
  adult_ids: z.array(IdSchema),
  place_id: IdSchema,
  day: IsoDateSchema,
  start: ClockTimeSchema,
  end: ClockTimeSchema,
  capacity_min: z.number().int().min(0),
  capacity_max: z.number().int().min(1),
  entry: z.enum(OFFERING_ENTRY),
  source: z.enum(OFFERING_SOURCES),
  source_ref: z.string(),
  standing: z.boolean(),
  status: z.enum(OFFERING_STATUS),
})
export type Offering = z.infer<typeof OfferingSchema>
