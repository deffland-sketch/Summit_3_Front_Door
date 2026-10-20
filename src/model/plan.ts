import { z } from 'zod'
import { DateTimeSchema, IdSchema, IsoDateSchema } from './enums'
import { SlotSchema } from './slot'

export const PLAN_BUILT_BY = ['student', 'mentor', 'engine', 'lead'] as const

export const PlanGoalSchema = z.object({
  text: z.string(),
  outcome_id: IdSchema.nullable(),
})
export type PlanGoal = z.infer<typeof PlanGoalSchema>

export const PlanSchema = z.object({
  id: IdSchema,
  student_id: IdSchema,
  week_start: IsoDateSchema,
  slots: z.array(SlotSchema),
  goals: z.array(PlanGoalSchema),
  focus_habits: z.array(IdSchema),
  built_by: z.enum(PLAN_BUILT_BY),
  confirmed_by: IdSchema.nullable(),
  published_at: DateTimeSchema.nullable(),
  version: z.number().int().min(1),
})
export type Plan = z.infer<typeof PlanSchema>
