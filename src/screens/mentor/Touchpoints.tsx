import { useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { touchpointKindLabel } from '@/components/TouchpointChip'
import { TouchpointForm, suggestComponent } from './TouchpointForm'
import { format, parseISO } from 'date-fns'

export function Touchpoints({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const [studentId, setStudentId] = useState('')
  const mentees = snap.students.filter((s) => s.mentor_id === mentorId).sort((a, b) => a.display_name.localeCompare(b.display_name))
  const todays = snap.touchpoints.filter((t) => t.mentor_id === mentorId && t.when.slice(0, 10) === today).sort((a, b) => a.when.localeCompare(b.when))
  return (
    <div className="space-y-6">
      <H1>{c.mentor.touchpointsToday} <Explain id="mentor.touchpoints" /></H1>
      <Card>
        <H2 id="quick">{c.mentor.quickAdd}</H2>
        <div className="mt-2 flex flex-wrap gap-2">
          <select aria-label={c.mentor.pickStudent} className={`${inputClass} md:max-w-xs`} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">{c.mentor.pickStudent}</option>
            {mentees.map((s) => (
              <option key={s.id} value={s.id}>{s.display_name} · {c.mentor.components[suggestComponent(s.id, snap, today)]}</option>
            ))}
          </select>
          {studentId ? <Button kind="quiet" onClick={() => setStudentId('')}>{c.app.cancel}</Button> : null}
        </div>
        {studentId ? <div className="mt-3"><TouchpointForm mentorId={mentorId} studentId={studentId} compact onSaved={() => setStudentId('')} /></div> : null}
      </Card>
      <section aria-labelledby="list">
        <H2 id="list">{c.app.today}</H2>
        {todays.length ? (
          <ol className="mt-2 space-y-1 text-sm">
            {todays.map((t) => (
              <li key={t.id} className="rounded-lg border border-line p-2">
                <span className="font-bold">{format(parseISO(t.when), 'h:mm a')}</span> · <Link className="text-indigo underline dark:text-indigo-1" to={`/m/${mentorId}/student/${t.student_id}`}>{idx.students.get(t.student_id)?.display_name}</Link> · {touchpointKindLabel(t.kind)} · {t.notes}
              </li>
            ))}
          </ol>
        ) : <Empty>{c.app.none}</Empty>}
      </section>
    </div>
  )
}
