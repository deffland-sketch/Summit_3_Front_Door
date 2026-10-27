import { z } from 'zod'
import { DateTimeSchema, IdSchema } from './enums'

/** Spec 1 object 14: the trace behind an engine output (Spec 6 Traceability). */
export const TRACE_KINDS = ['need', 'proposal', 'slot', 'move', 'level_review'] as const

export const TraceEdgeSchema = z.object({ from: z.string(), to: z.string(), type: z.string(), source: z.string() })
export const TraceCandidateSchema = z.object({ id: z.string(), label: z.string(), score: z.number().nullable(), lost_because: z.string().nullable() })

export const EngineTraceSchema = z.object({
  id: IdSchema,
  kind: z.enum(TRACE_KINDS),
  subject_id: z.string(),
  ref_id: z.string(),
  evidence_ids: z.array(z.string()),
  settings: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  edges: z.array(TraceEdgeSchema),
  candidates: z.array(TraceCandidateSchema),
  decision: z.string(),
  run_id: z.string(),
  at: DateTimeSchema,
})
export type EngineTrace = z.infer<typeof EngineTraceSchema>
export type TraceEdge = z.infer<typeof TraceEdgeSchema>
export type TraceCandidate = z.infer<typeof TraceCandidateSchema>
/** The part of a trace an engine function fills in; the store adds id, run, and time. */
export type TracePart = Pick<EngineTrace, 'evidence_ids' | 'settings' | 'edges' | 'candidates' | 'decision'>
export const emptyTrace = (): TracePart => ({ evidence_ids: [], settings: {}, edges: [], candidates: [], decision: '' })
