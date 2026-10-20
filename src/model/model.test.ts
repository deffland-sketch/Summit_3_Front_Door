import { describe, expect, it } from 'vitest'
import {
  AdultSchema,
  AssignmentSchema,
  CourseSchema,
  EvidenceSchema,
  GroupSchema,
  LessonSchema,
  OfferingSchema,
  OutcomeSchema,
  PlaceSchema,
  PlanSchema,
  SchoolSettingsSchema,
  DEFAULT_SETTINGS,
  SlotSchema,
  StudentSchema,
  TouchpointSchema,
  UnitSchema,
  type Student,
} from './index'
import { createMemoryStore, repositoriesFor } from '@/store/memory'

export const studentFixture: Student = {
  id: 'stu_001',
  display_name: 'Amara Okafor',
  level: 'explore',
  mentor_id: 'adu_mentor_1',
  community_group_id: 'grp_community_1',
  plan_autonomy: 'shared',
  supports: [{ kind: 'five_minute_warning', note: 'A heads-up five minutes before each move' }],
  protected_slots: [{ day: 'tue', start: '10:00', end: '10:45' }],
  life_constraints: [{ day: 'fri', start: '14:00', end: '15:30', label: 'Work shift' }],
  futre_student_id: 'futre_001',
  notification_prefs: { channel: 'banner', warning_minutes: 5 },
  locale: 'en',
  text_size: 'default',
  reduced_motion: false,
  dark_mode: false,
}

describe('model schemas', () => {
  it('parses a valid student and rejects a grade level', () => {
    expect(StudentSchema.parse(studentFixture)).toEqual(studentFixture)
    expect(() => StudentSchema.parse({ ...studentFixture, level: 'grade_9' })).toThrow()
  })

  it('parses the other core objects', () => {
    expect(() =>
      AdultSchema.parse({
        id: 'adu_1',
        display_name: 'Jordan Lee',
        capacities: ['mentor', 'facilitator'],
        subjects: [],
        mentees: ['stu_001'],
        availability: [{ day: 'mon', start: '08:30', end: '15:30', kind: 'teaching' }],
        external_org: null,
      }),
    ).not.toThrow()
    expect(() =>
      OutcomeSchema.parse({
        id: 'CS.ARG.CLAIM',
        family: 'cognitive',
        domain: 'Argumentative reasoning',
        name: 'Claim',
        description: 'Takes a clear position.',
        level_expectations: { expose: 3, explore: 4, pursue: 5, launch: 6 },
        validation: 'rubric_score',
        prerequisites: [],
      }),
    ).not.toThrow()
    expect(() =>
      OfferingSchema.parse({
        id: 'off_1',
        experience_type: 'DI',
        kind: 'workshop',
        title: 'Solving linear systems',
        lesson_id: 'les_1',
        outcomes_served: ['CCSS.HSA.REI.C.6'],
        adult_ids: ['adu_math'],
        place_id: 'pl_room_1',
        day: '2026-10-20',
        start: '09:30',
        end: '10:15',
        capacity_min: 4,
        capacity_max: 8,
        entry: 'required',
        source: 'front_door',
        source_ref: '',
        standing: false,
        status: 'published',
      }),
    ).not.toThrow()
    const slot = SlotSchema.parse({
      id: 'slot_1',
      plan_id: 'plan_1',
      day: '2026-10-20',
      start: '09:30',
      end: '10:15',
      experience_type: 'DI',
      offering_id: 'off_1',
      entry: 'required',
      why: 'Your Solving linear systems score is 58; this workshop is where it moves.',
      goal: null,
      status: 'planned',
      rating: null,
      bring: null,
      evidence_id: 'ev_1',
      added_at: null,
    })
    expect(() =>
      PlanSchema.parse({
        id: 'plan_1',
        student_id: 'stu_001',
        week_start: '2026-10-19',
        slots: [slot],
        goals: [{ text: 'Finish the systems unit', outcome_id: 'CCSS.HSA.REI.C.6' }],
        focus_habits: ['HOS.SELF_DIRECTION'],
        built_by: 'engine',
        confirmed_by: null,
        published_at: '2026-10-16T17:00:00.000Z',
        version: 1,
      }),
    ).not.toThrow()
    expect(() =>
      EvidenceSchema.parse({
        id: 'ev_1',
        student_id: 'stu_001',
        outcome_id: 'CCSS.HSA.REI.C.6',
        source: 'kira',
        source_ref: 'les_1',
        value_kind: 'mastery_pct',
        value: 58,
        artifact_url: null,
        recorded_by: 'system',
        recorded_at: '2026-10-15T20:00:00.000Z',
        slot_id: null,
      }),
    ).not.toThrow()
    expect(() =>
      TouchpointSchema.parse({
        id: 'tp_1',
        student_id: 'stu_001',
        mentor_id: 'adu_1',
        kind: 'check_in',
        when: '2026-10-20T16:00:00.000Z',
        duration_min: 5,
        prompt: 'Which lesson is in reach this week?',
        notes: 'Wants to finish systems before Friday.',
        private: false,
        student_note: null,
        linked_outcomes: [],
        linked_slot_id: null,
        follow_up: null,
      }),
    ).not.toThrow()
    expect(() =>
      CourseSchema.parse({ id: 'crs_im1', title: 'IM Math 1', curriculum: 'im', levels: ['expose', 'explore'], units: ['unit_1'] }),
    ).not.toThrow()
    expect(() =>
      UnitSchema.parse({ id: 'unit_1', course_id: 'crs_im1', sequence: 1, title: 'One-variable statistics', outcomes_served: ['CCSS.HSS.ID.A.1'], estimated_slots: 10 }),
    ).not.toThrow()
    expect(() =>
      LessonSchema.parse({
        id: 'les_1',
        unit_id: 'unit_1',
        sequence: 1,
        title: 'Getting to know you',
        outcomes_served: ['CCSS.HSS.ID.A.1'],
        prerequisites: [],
        modes: ['self_directed', 'workshop'],
        estimated_minutes: 45,
        kira_ref: 'kira:im1:u1:l1',
        materials_url: null,
      }),
    ).not.toThrow()
    expect(() =>
      AssignmentSchema.parse({ id: 'asg_1', student_id: 'stu_001', lesson_id: 'les_1', status: 'active', mode: null, assigned_by: 'engine', opened_at: null, mastered_at: null }),
    ).not.toThrow()
    expect(() => PlaceSchema.parse({ id: 'pl_1', name: 'Commons', kind: 'hub', capacity: 40, adults_required: 2 })).not.toThrow()
    expect(() => GroupSchema.parse({ id: 'grp_1', kind: 'community', name: 'Cedar', student_ids: [], adult_ids: [], approved_by: null })).not.toThrow()
    expect(() => SchoolSettingsSchema.parse(DEFAULT_SETTINGS)).not.toThrow()
  })

  it('refuses a lesson with no outcome', () => {
    expect(() =>
      LessonSchema.parse({
        id: 'les_x',
        unit_id: 'unit_1',
        sequence: 1,
        title: 'Untagged',
        outcomes_served: [],
        prerequisites: [],
        modes: ['self_directed'],
        estimated_minutes: 45,
        kira_ref: null,
        materials_url: null,
      }),
    ).toThrow()
  })
})

describe('memory store', () => {
  it('round-trips a student through the repository and JSON', () => {
    const store = createMemoryStore()
    const repos = repositoriesFor(store)
    repos.collection('students').upsert(studentFixture)
    const back = repos.collection('students').get('stu_001')
    expect(back).toEqual(studentFixture)
    const viaJson = StudentSchema.parse(JSON.parse(JSON.stringify(back)))
    expect(viaJson).toEqual(studentFixture)
    repos.collection('students').upsert({ ...studentFixture, level: 'pursue' })
    expect(repos.collection('students').all()).toHaveLength(1)
    expect(repos.collection('students').get('stu_001')?.level).toBe('pursue')
    repos.collection('students').remove('stu_001')
    expect(repos.collection('students').all()).toHaveLength(0)
  })
})
