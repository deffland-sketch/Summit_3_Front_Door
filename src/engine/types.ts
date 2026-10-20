import type { EngineTrace, ExperienceType, Offering, Slot, TraceEdge, TracePart } from '@/model'

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
  /** "the Kira check from Thu Oct 15": the row behind the need, in the words why lines use. */
  evidence_ref: string | null
  /** For required: how far below; for in_reach: distance to the next level. */
  distance: number
  value: number | null
  /** The graph walk that found a serving lesson or experience, in plain words. */
  serves: string | null
  serving_offering_id: string | null
  trace: TracePart
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
  /** One line a teacher would accept: the shared evidence in plain words (Spec 6 rule 9). */
  rationale: string
  /** Where each student goes if the expert declines (Spec 6 rule 9). */
  if_declined: { student_id: string; text: string }[]
  collisions: { student_id: string; reason: string }[]
  kind: 'workshop' | 'conference'
  trace: TracePart
}

export interface OvernightMove {
  student_id: string
  kind: 'added' | 'moved' | 'booked' | 'swapped'
  slot: Slot
  replaced_slot_id: string | null
  why: string
  trace: TracePart
}

export interface RankedOption {
  offering: Offering
  score: number
  reasons: string[]
  builds: string[]
  /** The graph edges the ranker walked for this option (gap on the Futre pathway, pathway nearby). */
  edges: TraceEdge[]
  /** The name of the pathway gap this offering teaches, when it does. */
  gap: string | null
  /** The pathway this offering leads toward, when the bonus applied. */
  pathway: string | null
}

export interface LevelReviewSuggestion {
  student_id: string
  from: string
  to: string
  reasons: string[]
  trace: TracePart
}

export interface CapacityLedger {
  /** offering id -> number placed */
  fill: Map<string, number>
}

/** Where engine functions push the traces of stored outputs (placed slots, moves). */
export type TraceSink = EngineTrace[]

let traceCounter = 0
export function makeTrace(kind: EngineTrace['kind'], subjectId: string, refId: string, part: TracePart, runId: string, at: string): EngineTrace {
  traceCounter++
  return { id: `tr_${runId}_${traceCounter}`, kind, subject_id: subjectId, ref_id: refId, run_id: runId, at, ...part }
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
