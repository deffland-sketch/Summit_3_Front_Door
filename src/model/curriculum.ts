import { z } from 'zod'
import { IdSchema, LevelSchema } from './enums'

export const CURRICULA = ['im', 'openscied', 'ap_english', 'ap_history', 'spanish', 'elective'] as const
export const LESSON_MODES = ['self_directed', 'workshop', 'seminar', 'lab'] as const
export const LessonModeSchema = z.enum(LESSON_MODES)
export type LessonMode = z.infer<typeof LessonModeSchema>

export const CourseSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  curriculum: z.enum(CURRICULA),
  levels: z.array(LevelSchema),
  units: z.array(IdSchema),
})
export type Course = z.infer<typeof CourseSchema>

export const UnitSchema = z.object({
  id: IdSchema,
  course_id: IdSchema,
  sequence: z.number().int().min(1),
  title: z.string().min(1),
  outcomes_served: z.array(IdSchema),
  estimated_slots: z.number().int().min(1),
})
export type Unit = z.infer<typeof UnitSchema>

export const LessonSchema = z.object({
  id: IdSchema,
  unit_id: IdSchema,
  sequence: z.number().int().min(1),
  title: z.string().min(1),
  outcomes_served: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema),
  modes: z.array(LessonModeSchema).min(1),
  estimated_minutes: z.number().int().min(5),
  kira_ref: z.string().nullable(),
  materials_url: z.string().nullable(),
})
export type Lesson = z.infer<typeof LessonSchema>
