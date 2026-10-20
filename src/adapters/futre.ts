import type { Evidence, Offering, Slot } from '@/model'
import { appStore, repos } from '@/store'
import { addEvidence, nowIso } from '@/store/actions'
import type { SourceAdapter } from './types'

/** Futre stub: reads the seed's Futre records from the store and writes back only experience reflections. */
export const futreAdapter: SourceAdapter & { pushReflection: (studentId: string, experienceId: string, text: string) => void } = {
  name: 'futre',
  async pullOfferings(): Promise<Offering[]> {
    return repos.snapshot().offerings.filter((o) => o.source === 'futre')
  },
  async pullEvidence(since: Date): Promise<Evidence[]> {
    return repos.snapshot().evidence.filter((e) => e.source === 'futre' && e.recorded_at >= since.toISOString())
  },
  pushCompletion(slot: Slot) {
    void slot
  },
  pushReflection(studentId, experienceId, text) {
    const all = appStore.getState().futre
    const f = all.find((x) => x.student_id === studentId)
    if (!f) return
    const now = nowIso()
    // Futre records carry no id of their own; the student id is the key.
    appStore.getState().replace(
      'futre',
      all.map((r) => (r.student_id !== studentId ? r : { ...r, experiences: r.experiences.map((x) => (x.experience_id === experienceId ? { ...x, reflection_text: text, reflection_at: now, status: 'complete' as const } : x)) })),
    )
    addEvidence({ student_id: studentId, outcome_id: 'HOS.RELEVANCE', source: 'futre', source_ref: experienceId, value_kind: 'text', value: text, artifact_url: null, recorded_by: studentId, slot_id: null })
  },
  health() {
    return { ok: true, lastPull: new Date('2026-10-16T16:45:00Z'), message: 'Sandbox stub' }
  },
}
