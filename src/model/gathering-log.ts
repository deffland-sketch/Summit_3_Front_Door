import { z } from 'zod'
import { DateTimeSchema, IdSchema } from './enums'

/** One line in the gathering log: what a source sent in a pull (Spec 4 step 1, Spec 5 Evidence Log). */
export const GatheringLogEntrySchema = z.object({
  id: IdSchema,
  source: z.string(),
  pulled_at: DateTimeSchema,
  received: z.number().int().min(0),
  unmapped: z.number().int().min(0),
  refused: z.number().int().min(0),
  stale: z.boolean(),
  message: z.string(),
})
export type GatheringLogEntry = z.infer<typeof GatheringLogEntrySchema>
