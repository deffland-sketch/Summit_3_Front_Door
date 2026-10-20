export * from './enums'
export * from './student'
export * from './adult'
export * from './outcome'
export * from './offering'
export * from './slot'
export * from './plan'
export * from './evidence'
export * from './touchpoint'
export * from './curriculum'
export * from './assignment'
export * from './place'
export * from './settings'
export * from './futre'
export * from './gathering-log'

import { z } from 'zod'
import { StudentSchema } from './student'
import { AdultSchema } from './adult'
import { OutcomeSchema } from './outcome'
import { OfferingSchema } from './offering'
import { PlanSchema } from './plan'
import { EvidenceSchema } from './evidence'
import { TouchpointSchema } from './touchpoint'
import { CourseSchema, LessonSchema, UnitSchema } from './curriculum'
import { AssignmentSchema } from './assignment'
import { GroupSchema, PlaceSchema } from './place'
import { SchoolSettingsSchema } from './settings'
import { FutreRecordSchema } from './futre'
import { GatheringLogEntrySchema } from './gathering-log'

/** The whole sandbox as one snapshot. The engine is pure functions over this. */
export const SandboxSchema = z.object({
  meta: z.object({
    seed: z.number(),
    generated_at: z.string(),
    week_start: z.string(),
    today: z.string(),
    graph_source: z.string(),
  }),
  students: z.array(StudentSchema),
  adults: z.array(AdultSchema),
  outcomes: z.array(OutcomeSchema),
  offerings: z.array(OfferingSchema),
  plans: z.array(PlanSchema),
  evidence: z.array(EvidenceSchema),
  touchpoints: z.array(TouchpointSchema),
  courses: z.array(CourseSchema),
  units: z.array(UnitSchema),
  lessons: z.array(LessonSchema),
  assignments: z.array(AssignmentSchema),
  places: z.array(PlaceSchema),
  groups: z.array(GroupSchema),
  settings: SchoolSettingsSchema,
  futre: z.array(FutreRecordSchema),
  gathering_log: z.array(GatheringLogEntrySchema),
})
export type Sandbox = z.infer<typeof SandboxSchema>
