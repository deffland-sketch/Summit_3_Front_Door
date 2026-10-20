import { z } from 'zod'
import { IdSchema } from './enums'

export const PLACE_KINDS = ['classroom', 'hub', 'seminar_room', 'nook', 'gym', 'off_campus', 'partner_site'] as const
export const PlaceSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  kind: z.enum(PLACE_KINDS),
  capacity: z.number().int().min(1),
  adults_required: z.number().int().min(0),
})
export type Place = z.infer<typeof PlaceSchema>

export const GROUP_KINDS = ['community', 'expedition_team', 'study_group', 'mentor_group'] as const
export const GroupSchema = z.object({
  id: IdSchema,
  kind: z.enum(GROUP_KINDS),
  name: z.string().min(1),
  student_ids: z.array(IdSchema),
  adult_ids: z.array(IdSchema),
  approved_by: IdSchema.nullable(),
})
export type Group = z.infer<typeof GroupSchema>
