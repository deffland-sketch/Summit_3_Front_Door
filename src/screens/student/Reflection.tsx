import { useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { addEvidence, addTouchpoint, updateSlot } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12, shiftDate } from '@/lib/time'
import { firstName } from '@/lib'

export function Reflection({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, plan, evidence, today, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [moved, setMoved] = useState('')
  const [need, setNeed] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [note, setNote] = useState('')
  const [about, setAbout] = useState('')
  const toast = useUi((u) => u.toast)
  if (!student || !plan) return <Empty>{c.app.none}</Empty>
  const daySlots = plan.slots.filter((s) => s.day === today && s.offering_id && s.entry !== 'protected' && s.experience_type !== 'WC' && s.experience_type !== 'RG' && s.status !== 'cancelled' && s.status !== 'moved')
  const outcomesToday = [...new Set(daySlots.flatMap((s) => idx.offerings.get(s.offering_id!)?.outcomes_served ?? []))].map((o) => idx.outcomes.get(o)).filter((o): o is NonNullable<typeof o> => Boolean(o))
  const yesterday = evidence.filter((e) => e.source === 'student_reflection' && e.recorded_at.slice(0, 10) === shiftDate(today, -1) && e.value_kind === 'text')
  const save = () => {
    const outcomeId = about || plan.focus_habits[0] || outcomesToday[0]?.id || 'HOS.SELF_DIRECTION'
    const rg = plan.slots.find((s) => s.day === today && s.experience_type === 'RG')
    if (moved.trim() || need.trim()) {
      addEvidence({ student_id: studentId, outcome_id: outcomeId, source: 'student_reflection', source_ref: null, value_kind: 'text', value: [moved.trim(), need.trim()].filter(Boolean).join(' Next: '), artifact_url: null, recorded_by: studentId, slot_id: rg?.id ?? null, recorded_at: `${today}T15:25:00.000Z` })
    }
    if (rg) updateSlot(plan.id, rg.id, { status: 'attended' })
    if (tomorrow.trim()) {
      const first = plan.slots.find((s) => s.day === shiftDate(today, 1) && s.entry !== 'whole_group' && s.entry !== 'protected')
      if (first) updateSlot(plan.id, first.id, { goal: tomorrow.trim() })
    }
    if (note.trim()) {
      addTouchpoint({ student_id: studentId, mentor_id: student.mentor_id, kind: 'reflection', when: `${today}T15:28:00.000Z`, duration_min: 0, prompt: c.prompts.reflection, notes: '', private: false, student_note: note.trim(), linked_outcomes: [outcomeId], linked_slot_id: rg?.id ?? null, follow_up: null })
    }
    setMoved('')
    setNeed('')
    setTomorrow('')
    setNote('')
    toast(c.reflection.saved)
  }
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.reflection.title}</H1>
        <p className="text-sm text-ink-2">{c.reflection.lede}</p>
      </div>
      <Card accent="border-t-peach" className="space-y-3">
        <label className="block text-sm">
          <span className="font-bold">{c.reflection.moved}</span>
          <input className={inputClass} placeholder={c.reflection.movedPlaceholder} value={moved} onChange={(e) => setMoved(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-bold">{c.reflection.need}</span>
          <input className={inputClass} placeholder={c.reflection.needPlaceholder} value={need} onChange={(e) => setNeed(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-bold">{c.reflection.linkTo}</span>
          <select className={inputClass} value={about} onChange={(e) => setAbout(e.target.value)}>
            <option value="">{c.build.noOutcome}</option>
            {[...plan.focus_habits.map((h) => idx.outcomes.get(h)).filter((o): o is NonNullable<typeof o> => Boolean(o)), ...outcomesToday].map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </Card>
      <section aria-labelledby="rate">
        <H2 id="rate">{c.reflection.rateSlots}</H2>
        <ul className="mt-2 space-y-2">
          {daySlots.map((s) => (
            <li key={s.id} className="rounded-xl border border-line p-3 text-sm">
              <p className="font-bold">
                {formatTime12(s.start)} · {idx.offerings.get(s.offering_id!)?.title}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(['got_it', 'need_more', 'ready_for_more'] as const).map((r) => (
                  <Button key={r} kind={s.rating === r ? 'primary' : 'secondary'} ariaPressed={s.rating === r} onClick={() => updateSlot(plan.id, s.id, { rating: r, status: s.status === 'missed' ? s.status : 'attended' })}>
                    {c.slot.ratings[r]}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Card className="space-y-3">
        <label className="block text-sm">
          <span className="font-bold">{c.reflection.tomorrow}</span>
          <input className={inputClass} placeholder={c.reflection.tomorrowPlaceholder} value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-bold">{c.reflection.mentorNote}</span>
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`${firstName(snap.adults.find((a) => a.id === student.mentor_id)?.display_name ?? '')}`} />
        </label>
        <Button onClick={save}>{c.reflection.save}</Button>
      </Card>
      {yesterday.length ? (
        <section aria-labelledby="yday">
          <H2 id="yday">{c.reflection.yesterday}</H2>
          <ul className="mt-2 space-y-1 text-sm">
            {yesterday.map((e) => (
              <li key={e.id} className="rounded-lg border border-line p-2">{String(e.value)}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
