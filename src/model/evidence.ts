import { z } from 'zod'
import { DateTimeSchema, IdSchema } from './enums'

export const EVIDENCE_SOURCES = [
  'kira',
  'teach_to_one',
  'gradebook',
  'assessment',
  'futre',
  'adult_note',
  'student_reflection',
  'exhibition',
  'external',
] as const
export const VALUE_KINDS = ['score_1_8', 'mastery_pct', 'level', 'pass_fail', 'text'] as const

export const EvidenceSchema = z.object({
  id: IdSchema,
  student_id: IdSchema,
  outcome_id: IdSchema,
  source: z.enum(EVIDENCE_SOURCES),
  source_ref: z.string().nullable(),
  value_kind: z.enum(VALUE_KINDS),
  value: z.union([z.number(), z.string()]),
  artifact_url: z.string().nullable(),
  recorded_by: z.string().min(1),
  recorded_at: DateTimeSchema,
  slot_id: IdSchema.nullable(),
})
export type Evidence = z.infer<typeof EvidenceSchema>
