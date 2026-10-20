import { z } from 'zod'
import { IdSchema, LevelSchema, OutcomeFamilySchema } from './enums'

export const VALIDATION_KINDS = ['rubric_score', 'standard_mastery', 'teacher_check', 'reflection', 'external'] as const

export const OutcomeSchema = z.object({
  id: IdSchema,
  family: OutcomeFamilySchema,
  domain: z.string(),
  name: z.string().min(1),
  description: z.string(),
  level_expectations: z.partialRecord(LevelSchema, z.number()).nullable(),
  validation: z.enum(VALIDATION_KINDS),
  prerequisites: z.array(IdSchema),
})
export type Outcome = z.infer<typeof OutcomeSchema>
