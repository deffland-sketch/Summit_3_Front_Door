import { z } from 'zod'
import { ClockTimeSchema, DateTimeSchema, ExperienceTypeSchema, LevelSchema, WeekdaySchema } from './enums'

const WindowSchema = z.object({ start: ClockTimeSchema, end: ClockTimeSchema })

/** Share of a student's week per experience type, per level. Shares sum to about 1. */
export const LevelTargetsSchema = z.record(LevelSchema, z.record(ExperienceTypeSchema, z.number().min(0).max(1)))
export type LevelTargets = z.infer<typeof LevelTargetsSchema>

export const SchoolSettingsSchema = z.object({
  id: z.literal('school'),
  school_name: z.string(),
  day_start: ClockTimeSchema,
  day_end: ClockTimeSchema,
  community_time: z.object({ all: WindowSchema, small_groups: WindowSchema }),
  workshop_size: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  grouping_threshold: z.number().int().min(1),
  required_rule: z.object({ mastery_below_pct: z.number().min(0).max(100) }),
  recommended_rule: z.object({ within_points: z.number().min(0) }),
  weekly_build_day: WeekdaySchema,
  overnight_adjustments: z.boolean(),
  max_overnight_moves: z.number().int().min(0),
  stale_days: z.number().int().min(1),
  mentor_min_touchpoints_per_week: z.number().int().min(0),
  protected_time_visible_as: z.string().min(1),
  level_targets: LevelTargetsSchema,
  changed_at: DateTimeSchema,
  changed_by: z.string(),
})
export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>

export const DEFAULT_LEVEL_TARGETS: LevelTargets = {
  expose: { DI: 0.06, PF: 0.24, DD: 0.1, IW: 0.16, PP: 0.02, RG: 0.09, RW: 0.1, WC: 0.23 },
  explore: { DI: 0.05, PF: 0.22, DD: 0.09, IW: 0.15, PP: 0.03, RG: 0.09, RW: 0.15, WC: 0.22 },
  pursue: { DI: 0.04, PF: 0.16, DD: 0.08, IW: 0.14, PP: 0.04, RG: 0.09, RW: 0.25, WC: 0.2 },
  launch: { DI: 0.01, PF: 0.04, DD: 0.03, IW: 0.05, PP: 0.03, RG: 0.08, RW: 0.62, WC: 0.14 },
}

export const DEFAULT_SETTINGS: SchoolSettings = {
  id: 'school',
  school_name: 'Summit Sierra',
  day_start: '08:30',
  day_end: '15:30',
  community_time: { all: { start: '08:30', end: '08:45' }, small_groups: { start: '08:45', end: '09:15' } },
  workshop_size: { min: 4, max: 8 },
  grouping_threshold: 4,
  required_rule: { mastery_below_pct: 70 },
  recommended_rule: { within_points: 5 },
  weekly_build_day: 'fri',
  overnight_adjustments: true,
  max_overnight_moves: 2,
  stale_days: 14,
  mentor_min_touchpoints_per_week: 2,
  protected_time_visible_as: 'Protected time',
  level_targets: DEFAULT_LEVEL_TARGETS,
  changed_at: '2026-10-16T17:00:00.000Z',
  changed_by: 'seed',
}
