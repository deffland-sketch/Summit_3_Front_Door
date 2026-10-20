import { z } from 'zod'
import { ClockTimeSchema, IdSchema, WeekdaySchema } from './enums'

export const CAPACITIES = [
  'mentor',
  'content_expert',
  'facilitator',
  'system_architect',
  'leader',
  'case_manager',
  'partner',
] as const
export const CapacitySchema = z.enum(CAPACITIES)
export type Capacity = z.infer<typeof CapacitySchema>

export const AVAILABILITY_KINDS = ['teaching', 'circulation', 'prep', 'out'] as const
export const AvailabilitySchema = z.object({
  day: WeekdaySchema,
  start: ClockTimeSchema,
  end: ClockTimeSchema,
  kind: z.enum(AVAILABILITY_KINDS),
})
export type Availability = z.infer<typeof AvailabilitySchema>

export const AdultSchema = z.object({
  id: IdSchema,
  display_name: z.string().min(1),
  capacities: z.array(CapacitySchema).min(1),
  subjects: z.array(IdSchema),
  mentees: z.array(IdSchema),
  availability: z.array(AvailabilitySchema),
  external_org: z.string().nullable(),
})
export type Adult = z.infer<typeof AdultSchema>
