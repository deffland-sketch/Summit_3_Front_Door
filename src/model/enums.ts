import { z } from 'zod'

export const LEVELS = ['expose', 'explore', 'pursue', 'launch'] as const
export const LevelSchema = z.enum(LEVELS)
export type Level = z.infer<typeof LevelSchema>

export const EXPERIENCE_TYPES = ['DI', 'PF', 'DD', 'IW', 'PP', 'RG', 'RW', 'WC'] as const
export const ExperienceTypeSchema = z.enum(EXPERIENCE_TYPES)
export type ExperienceType = z.infer<typeof ExperienceTypeSchema>

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
export const WeekdaySchema = z.enum(WEEKDAYS)
export type Weekday = z.infer<typeof WeekdaySchema>

export const OUTCOME_FAMILIES = ['cognitive', 'content', 'durable', 'pathway'] as const
export const OutcomeFamilySchema = z.enum(OUTCOME_FAMILIES)
export type OutcomeFamily = z.infer<typeof OutcomeFamilySchema>

export const PLAN_AUTONOMY = ['guided', 'shared', 'owned'] as const
export const PlanAutonomySchema = z.enum(PLAN_AUTONOMY)
export type PlanAutonomy = z.infer<typeof PlanAutonomySchema>

/** ISO calendar date, YYYY-MM-DD. */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
/** Clock time, HH:mm, 24 hour. */
export const ClockTimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm')
/** ISO 8601 datetime string. */
export const DateTimeSchema = z.string().min(10)

export const IdSchema = z.string().min(1)
