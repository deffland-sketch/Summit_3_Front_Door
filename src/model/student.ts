import { z } from 'zod'
import { ClockTimeSchema, IdSchema, LevelSchema, PlanAutonomySchema, WeekdaySchema } from './enums'

export const SUPPORT_KINDS = [
  'five_minute_warning',
  'printed_roster',
  'large_text',
  'quiet_space',
  'check_in_first',
  'extended_time',
  'other',
] as const
export const SupportSchema = z.object({
  kind: z.enum(SUPPORT_KINDS),
  note: z.string(),
})
export type Support = z.infer<typeof SupportSchema>

export const ProtectedSlotSchema = z.object({
  day: WeekdaySchema,
  start: ClockTimeSchema,
  end: ClockTimeSchema,
})
export type ProtectedSlot = z.infer<typeof ProtectedSlotSchema>

export const LifeConstraintSchema = ProtectedSlotSchema.extend({ label: z.string() })
export type LifeConstraint = z.infer<typeof LifeConstraintSchema>

export const NOTIFICATION_CHANNELS = ['banner', 'board', 'mentor', 'email'] as const

export const StudentSchema = z.object({
  id: IdSchema,
  display_name: z.string().min(1),
  level: LevelSchema,
  mentor_id: IdSchema,
  community_group_id: IdSchema,
  plan_autonomy: PlanAutonomySchema,
  supports: z.array(SupportSchema),
  protected_slots: z.array(ProtectedSlotSchema),
  life_constraints: z.array(LifeConstraintSchema),
  futre_student_id: z.string(),
  notification_prefs: z.object({
    channel: z.enum(NOTIFICATION_CHANNELS),
    warning_minutes: z.number().int().min(0),
  }),
  locale: z.enum(['en', 'es']),
  text_size: z.enum(['default', 'large', 'larger']),
  reduced_motion: z.boolean(),
  dark_mode: z.boolean(),
})
export type Student = z.infer<typeof StudentSchema>
