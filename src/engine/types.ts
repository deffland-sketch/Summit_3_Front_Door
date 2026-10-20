import type { ExperienceType, Offering, Slot } from '@/model'

export type NeedKind = 'required' | 'recommended' | 'in_reach' | 'readiness'

export interface Need {
  kind: NeedKind
  student_id: string
  outcome_id: string
  outcome_name: string
  lesson_id: string | null
  family: 'cognitive' | 'content' | 'durable'
  why: string
  evidence_id: string | null
  /** For required: how far below; for in_reach: distance to the next level. */
  distance: number
  value: number | null
  /** The graph walk that found a serving lesson or experience, in plain words. */
  serves: string | null
  serving_offering_id: string | null
}

export interface NeedsYouItem {
  kind: 'stale' | 'opt_out' | 'flag_required'
  student_id: string
  outcome_id: string | null
  lesson_id: string | null
  text: string
  subject: 'math' | 'science' | 'english' | 'history'
}

export interface WorkshopProposal {
  id: string
  lesson_id: string
  lesson_title: string
  course_id: string
  subject: 'math' | 'science' | 'english' | 'history'
  student_ids: string[]
  adult_id: string | null
  place_id: string | null
  day: string
  start: string
  end: string
  why: string
  collisions: { student_id: string; reason: string }[]
  kind: 'workshop' | 'conference'
}

export interface OvernightMove {
  student_id: string
  kind: 'added' | 'moved' | 'booked' | 'swapped'
  slot: Slot
  replaced_slot_id: string | null
  why: string
}

export interface RankedOption {
  offering: Offering
  score: number
  reasons: string[]
  builds: string[]
}

export interface LevelReviewSuggestion {
  student_id: string
  from: string
  to: string
  reasons: string[]
}

export interface CapacityLedger {
  /** offering id -> number placed */
  fill: Map<string, number>
}

export const BLOCKS: { start: string; end: string }[] = [
  { start: '09:15', end: '10:00' },
  { start: '10:00', end: '10:45' },
  { start: '10:45', end: '11:30' },
  { start: '11:30', end: '12:15' },
  { start: '12:45', end: '13:30' },
  { start: '13:30', end: '14:15' },
  { start: '14:15', end: '15:00' },
]

export const TYPE_ORDER: ExperienceType[] = ['DI', 'PF', 'DD', 'IW', 'PP', 'RG', 'RW', 'WC']
