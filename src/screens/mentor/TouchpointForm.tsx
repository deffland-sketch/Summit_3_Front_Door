import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Field, inputClass } from '@/components/ui'
import { addTouchpoint } from '@/store/actions'
import { useUi } from '@/store/ui'
import { needs } from '@/engine'
import { shiftDate } from '@/lib/time'
import type { Touchpoint } from '@/model'

type Component = 'plan' | 'academics' | 'habits' | 'pathway' | 'reflection' | 'validation_prep' | 'check_in' | 'feedback' | 'family' | 'goal'
const KIND_OF: Record<Component, Touchpoint['kind']> = { plan: 'plan', academics: 'check_in', habits: 'check_in', pathway: 'reflection', reflection: 'reflection', validation_prep: 'validation_prep', check_in: 'check_in', feedback: 'feedback', family: 'family', goal: 'goal' }

/** The conversation bank (Spec 3): suggests a component from the student's week; the mentor assembles the touchpoint. */
export function suggestComponent(studentId: string, snap: ReturnType<typeof useSnapshot>, today: string): Component {
  const plan = snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
  const n = needs(studentId, snap)
  if (n.some((x) => x.kind === 'readiness')) return 'validation_prep'
  if (plan?.slots.some((s) => s.offering_id === null && s.entry === 'chosen' && s.day >= today)) return 'plan'
  if (plan?.slots.some((s) => s.experience_type === 'RW' && s.day < today && s.status === 'attended')) return 'pathway'
  if (plan?.slots.some((s) => s.entry === 'required') || n.some((x) => x.kind === 'in_reach' && x.family === 'content')) return 'academics'
  return 'habits'
}

export function TouchpointForm({ mentorId, studentId, onSaved, compact }: { mentorId: string; studentId: string; onSaved?: () => void; compact?: boolean }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const toast = useUi((u) => u.toast)
  const suggested = useMemo(() => suggestComponent(studentId, snap, today), [studentId, snap, today])
  const [component, setComponent] = useState<Component>(suggested)
  const [notes, setNotes] = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [due, setDue] = useState(shiftDate(today, 2))
  const [outcome, setOutcome] = useState('')
  const [duration, setDuration] = useState(5)
  const plan = snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
  const prompt = c.prompts[component] ?? ''
  const outcomeChoices = [...new Set([...(plan?.focus_habits ?? []), ...needs(studentId, snap).map((n) => n.outcome_id)])].map((o) => idx.outcomes.get(o)).filter((o): o is NonNullable<typeof o> => Boolean(o))
  const save = () => {
    addTouchpoint({
      student_id: studentId,
      mentor_id: mentorId,
      kind: KIND_OF[component],
      when: new Date(`${today}T${new Date().toISOString().slice(11, 19)}Z`).toISOString(),
      duration_min: duration,
      prompt,
      notes: notes.trim(),
      private: isPrivate,
      student_note: null,
      linked_outcomes: outcome ? [outcome] : component === 'habits' ? (plan?.focus_habits ?? []) : [],
      linked_slot_id: null,
      follow_up: followUp.trim() ? { text: followUp.trim(), due } : null,
    })
    setNotes('')
    setFollowUp('')
    toast(c.mentor.savedTouchpoint)
    onSaved?.()
  }
  return (
    <div className={`space-y-3 ${compact ? '' : 'rounded-xl border border-line p-4'}`}>
      <div className="flex flex-wrap gap-1" role="group" aria-label={c.mentor.component}>
        {(Object.keys(c.mentor.components) as Component[]).map((k) => (
          <button key={k} type="button" aria-pressed={component === k} onClick={() => setComponent(k)} className={`rounded-full px-3 py-1 text-sm font-bold ${component === k ? 'bg-indigo text-white' : 'border border-line'}`}>
            {c.mentor.components[k]}
            {k === suggested ? <span className="sr-only"> ({c.mentor.suggested})</span> : null}
          </button>
        ))}
      </div>
      <p className="text-sm">
        <span className="font-bold">{c.mentor.suggested}:</span> {c.mentor.components[suggested]} · <span className="italic">{prompt}</span>
      </p>
      <Field label={c.mentor.notes}>
        <textarea className={inputClass} rows={compact ? 2 : 3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="grid gap-2 md:grid-cols-3">
        <Field label={c.mentor.linkOutcomes}>
          <select className={inputClass} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="">{c.build.noOutcome}</option>
            {outcomeChoices.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </Field>
        <Field label={c.mentor.followUp}>
          <input className={inputClass} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </Field>
        <Field label={c.mentor.followUpDue}>
          <input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} /> {c.mentor.privateNote}
        </label>
        <label className="flex items-center gap-2">
          <select className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))} aria-label="Duration">
            {[3, 5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>{c.mentor.durationMin(n)}</option>
            ))}
          </select>
        </label>
        <Button onClick={save} disabled={!notes.trim()}>{c.mentor.saveTouchpoint}</Button>
      </div>
    </div>
  )
}
