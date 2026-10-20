import { useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { Assumed } from '@/components/Assumed'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Empty, H1, inputClass } from '@/components/ui'
import { FlagDot } from '@/components/FlagDot'
import { addTouchpoint } from '@/store/actions'
import { useUi } from '@/store/ui'
import { flagsFor } from '@/engine'
import { shiftDate } from '@/lib/time'
import { format, parseISO } from 'date-fns'

export function Family({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const toast = useUi((u) => u.toast)
  const [open, setOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const mentees = snap.students.filter((s) => s.mentor_id === mentorId).sort((a, b) => a.display_name.localeCompare(b.display_name))
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.mentor.family} <Explain id="mentor.family" /> <Assumed q={1} /></H1>
        <p className="text-sm text-ink-2">{c.mentor.familyLede}</p>
      </div>
      <ul className="space-y-2">
        {mentees.map((s) => {
          const fam = snap.touchpoints.filter((t) => t.student_id === s.id && t.kind === 'family').sort((a, b) => b.when.localeCompare(a.when))
          const last = fam[0]
          const flagged = flagsFor(s, snap).some((f) => f.kind === 'family')
          const next = last?.follow_up?.due ?? (last ? shiftDate(last.when.slice(0, 10), 28) : null)
          return (
            <Card key={s.id} as="li">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p>
                  <Link className="font-bold text-indigo underline dark:text-indigo-1" to={`/m/${mentorId}/student/${s.id}`}>{s.display_name}</Link>
                  {flagged ? <span className="ml-2"><FlagDot kind="family" /></span> : null}
                </p>
                <p className="text-ink-2">
                  {c.mentor.lastFamily}: {last ? format(parseISO(last.when), 'MMM d') : c.app.none} · {c.mentor.nextStepBack}: {next ?? c.app.none}
                </p>
              </div>
              {last ? <p className="mt-1 text-sm">{last.notes}{last.follow_up ? <span className="block text-orange-ink">{c.mentor.followUp}: {last.follow_up.text} · {last.follow_up.due}</span> : null}</p> : <p className="mt-1 text-sm text-ink-2">{c.mentor.noFamilyYet}</p>}
              {open === s.id ? (
                <div className="mt-2 space-y-2">
                  <textarea aria-label={c.mentor.familyNotes} className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={c.prompts.family} />
                  <div className="flex gap-2">
                    <Button disabled={!notes.trim()} onClick={() => { addTouchpoint({ student_id: s.id, mentor_id: mentorId, kind: 'family', when: `${today}T16:30:00.000Z`, duration_min: 20, prompt: c.prompts.family, notes: notes.trim(), private: false, student_note: null, linked_outcomes: [], linked_slot_id: null, follow_up: { text: c.mentor.nextStepBack, due: shiftDate(today, 28) } }); setNotes(''); setOpen(null); toast(c.mentor.savedTouchpoint) }}>{c.app.save}</Button>
                    <Button kind="quiet" onClick={() => setOpen(null)}>{c.app.cancel}</Button>
                  </div>
                </div>
              ) : (
                <Button kind="secondary" className="mt-2" onClick={() => setOpen(s.id)}>{c.mentor.logFamily}</Button>
              )}
            </Card>
          )
        })}
      </ul>
      {!mentees.length ? <Empty>{c.app.none}</Empty> : null}
      <p className="sr-only">{idx.adults.size}</p>
    </div>
  )
}
