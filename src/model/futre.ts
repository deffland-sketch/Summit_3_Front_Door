import { z } from 'zod'
import { DateTimeSchema, IdSchema, IsoDateSchema } from './enums'

/** Read-only context from Futre (Spec 7). Homebase reads it and writes back only experience reflections. */
export const CNS_TYPES = ['four_year', 'two_year', 'apprenticeship', 'military', 'work', 'training', 'undecided'] as const
export const EXPERIENCE_LEVELS = ['expose', 'explore', 'pursue'] as const

export const FutreCareerSchema = z.object({
  career_id: z.string(),
  title: z.string(),
  cluster: z.string(),
  fit_score: z.number().min(0).max(100),
  explored_at: DateTimeSchema,
  saved: z.boolean(),
})

export const FutreExperienceSchema = z.object({
  experience_id: z.string(),
  title: z.string(),
  type: z.enum(EXPERIENCE_LEVELS),
  provider: z.string(),
  start: IsoDateSchema,
  end: IsoDateSchema,
  status: z.enum(['planned', 'in_progress', 'complete']),
  reflection_text: z.string().nullable(),
  reflection_at: DateTimeSchema.nullable(),
})

export const FutreRecordSchema = z.object({
  futre_student_id: z.string(),
  student_id: IdSchema,
  consent: z.boolean(),
  vision: z.object({ vision_text: z.string(), vision_board_url: z.string(), updated_at: DateTimeSchema }),
  cns: z.object({
    cns_type: z.enum(CNS_TYPES),
    cns_text: z.string(),
    target_careers: z.array(z.object({ career_id: z.string(), title: z.string(), fit_score: z.number() })),
    /** The knowledge-graph pathway id this CNS points at, when one matches. */
    pathway_id: z.string().nullable(),
    updated_at: DateTimeSchema,
  }),
  careers_explored: z.array(FutreCareerSchema),
  experiences: z.array(FutreExperienceSchema),
  portfolio: z.object({
    portfolio_url: z.string(),
    item_count: z.number().int().min(0),
    latest_item: z
      .object({ title: z.string(), url: z.string(), reflection: z.string(), added_at: DateTimeSchema })
      .nullable(),
  }),
  caregiver_view_enabled: z.boolean(),
})
export type FutreRecord = z.infer<typeof FutreRecordSchema>
export type FutreExperience = z.infer<typeof FutreExperienceSchema>
