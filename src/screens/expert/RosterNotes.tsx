import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Empty, H1, inputClass } from '@/components/ui'
import { addEvidence, updateSlot } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12 } from '@/lib/time'
import { rosterFor, weekOfferingsFor } from './shared'

const SIGNAL_TEXT: Record<string, string> = { got_it: 'Got it.', need_more: 'Need more.', ready_for_more: 'Ready for more.' }

export function RosterNotes({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const toast = useUi((u) => u.toast)
  const sessions = useMemo(() => weekOfferingsFor(snap, adultId).filter((o) => o.day === today && o.status === 'published' && o.kind !== 'community'), [snap, adultId, today])
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.id ?? '')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const session = sessions.find((o) => o.id === sessionId) ?? sessions[0]
  const roster = session ? rosterFor(snap, session.id) : []
  if (!sessions.length) return <div><H1>{c.expert.rosterNotes} <Explain id="expert.roster" /></H1><Empty>{c.app.none}</Empty></div>
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.rosterNotes} <Explain id="expert.roster" /></H1>
        <p className="text-sm text-ink-2">{c.expert.rosterLede}</p>
      </div>
      <label className="block text-sm">
        <span className="font-bold">{c.expert.pickSession}</span>
        <select className={`${inputClass} md:max-w-md`} value={session?.id} onChange={(e) => setSessionId(e.target.value)}>
          {sessions.map((o) => <option key={o.id} value={o.id}>{formatTime12(o.start)} · {o.title}</option>)}
        </select>
      </label>
      {session ? (
        <Card>
          <ul className="divide-y divide-line">
            {roster.map(({ student, slot }) => (
              <li key={student.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto_2fr]">
                <div>
                  <p className="font-bold">{student.display_name}</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={slot.status === 'attended'} onChange={(e) => updateSlot(slot.plan_id, slot.id, { status: e.target.checked ? 'attended' : 'confirmed' })} /> {c.expert.here}
                  </label>
                </div>
                <div className="flex flex-wrap gap-1" role="group" aria-label={`${c.expert.exit}: ${student.display_name}`}>
                  {(['got_it', 'need_more', 'ready_for_more'] as const).map((r) => (
                    <Button key={r} kind={slot.rating === r ? 'primary' : 'secondary'} ariaPressed={slot.rating === r} onClick={() => updateSlot(slot.plan_id, slot.id, { rating: r })}>{c.slot.ratings[r]}</Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input aria-label={`${c.expert.observation}: ${student.display_name}`} className={inputClass} placeholder={c.expert.observation} value={notes[student.id] ?? ''} onChange={(e) => setNotes({ ...notes, [student.id]: e.target.value })} />
                  <Button kind="secondary" disabled={!(notes[student.id] ?? '').trim()} onClick={() => { addEvidence({ student_id: student.id, outcome_id: session.outcomes_served[0] ?? (session.lesson_id ? idx.lessons.get(session.lesson_id)?.outcomes_served[0] ?? 'HOS.SELF_DIRECTION' : 'HOS.SELF_DIRECTION'), source: 'adult_note', source_ref: session.title, value_kind: 'text', value: `${slot.rating ? SIGNAL_TEXT[slot.rating] + ' ' : ''}${notes[student.id].trim()}`, artifact_url: null, recorded_by: adultId, slot_id: slot.id }); setNotes({ ...notes, [student.id]: '' }); toast(c.expert.savedObservation) }}>{c.expert.saveObservation}</Button>
                </div>
              </li>
            ))}
          </ul>
          {!roster.length ? <p className="text-sm text-ink-2">{c.expert.noRoster}</p> : null}
        </Card>
      ) : null}
    </div>
  )
}
