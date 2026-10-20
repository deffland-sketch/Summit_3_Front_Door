import { create } from 'zustand'
import type { OvernightMove, WorkshopProposal } from '@/engine'

export interface ProposalDecision {
  proposal: WorkshopProposal
  decision: 'accepted' | 'changed' | 'declined'
  reason: string | null
  offering_id: string | null
}

export interface Toast {
  id: number
  text: string
}

export interface UiState {
  todayOverride: string | null
  setTodayOverride: (d: string | null) => void
  decisions: Record<string, ProposalDecision>
  decide: (d: ProposalDecision) => void
  moves: OvernightMove[]
  setMoves: (m: OvernightMove[]) => void
  lastBuildAt: string | null
  lastBuildCount: number
  setLastBuild: (at: string, count: number) => void
  toasts: Toast[]
  toast: (text: string) => void
  dismissToast: (id: number) => void
  requests: { student_id: string; kind: '1on1' | 'study_group'; text: string; at: string }[]
  addRequest: (r: UiState['requests'][number]) => void
  outToday: Record<string, string>
  setOutToday: (adultId: string, day: string) => void
  settingsLog: { at: string; by: string; key: string; from: string; to: string }[]
  logSetting: (e: UiState['settingsLog'][number]) => void
  /** Sandbox setting: show the "assumed" chip on elements that rest on an open QUESTIONS.md item. Default on. */
  showAssumptions: boolean
  setShowAssumptions: (v: boolean) => void
}

let toastId = 0
export const useUi = create<UiState>((set) => ({
  todayOverride: null,
  setTodayOverride: (d) => set({ todayOverride: d }),
  decisions: {},
  decide: (d) => set((s) => ({ decisions: { ...s.decisions, [d.proposal.id]: d } })),
  moves: [],
  setMoves: (moves) => set({ moves }),
  lastBuildAt: null,
  lastBuildCount: 0,
  setLastBuild: (at, count) => set({ lastBuildAt: at, lastBuildCount: count }),
  toasts: [],
  toast: (text) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, text }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  requests: [],
  addRequest: (r) => set((s) => ({ requests: [...s.requests, r] })),
  outToday: {},
  setOutToday: (adultId, day) => set((s) => ({ outToday: { ...s.outToday, [adultId]: day } })),
  settingsLog: [],
  logSetting: (e) => set((s) => ({ settingsLog: [e, ...s.settingsLog] })),
  showAssumptions: true,
  setShowAssumptions: (v) => set({ showAssumptions: v }),
}))
