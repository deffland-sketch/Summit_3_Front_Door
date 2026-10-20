import { z } from 'zod'
import { DateTimeSchema, IdSchema, IsoDateSchema } from './enums'

export const TOUCHPOINT_KINDS = ['plan', 'check_in', 'feedback', 'reflection', 'goal', 'family', 'validation_prep'] as const

export const TouchpointSchema = z.object({
  id: IdSchema,
  student_id: IdSchema,
  mentor_id: IdSchema,
  kind: z.enum(TOUCHPOINT_KINDS),
  when: DateTimeSchema,
  duration_min: z.number().int().min(0),
  prompt: z.string(),
  notes: z.string(),
  private: z.boolean(),
  student_note: z.string().nullable(),
  linked_outcomes: z.array(IdSchema),
  linked_slot_id: IdSchema.nullable(),
  follow_up: z.object({ text: z.string(), due: IsoDateSchema }).nullable(),
})
export type Touchpoint = z.infer<typeof TouchpointSchema>
