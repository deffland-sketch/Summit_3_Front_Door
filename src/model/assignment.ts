import { z } from 'zod'
import { DateTimeSchema, IdSchema } from './enums'
import { LessonModeSchema } from './curriculum'

export const ASSIGNMENT_STATUS = ['queued', 'active', 'practiced', 'mastered', 'needs_workshop', 'skipped_on_mastery'] as const
export const ASSIGNED_BY = ['engine', 'teacher', 'student'] as const

export const AssignmentSchema = z.object({
  id: IdSchema,
  student_id: IdSchema,
  lesson_id: IdSchema,
  status: z.enum(ASSIGNMENT_STATUS),
  mode: LessonModeSchema.nullable(),
  assigned_by: z.enum(ASSIGNED_BY),
  opened_at: DateTimeSchema.nullable(),
  mastered_at: DateTimeSchema.nullable(),
})
export type Assignment = z.infer<typeof AssignmentSchema>
