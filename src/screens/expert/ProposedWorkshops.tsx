import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Button, Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { proposeWorkshops, BLOCKS } from '@/engine'
import { acceptProposal } from '@/store/actions'
import { useUi } from '@/store/ui'
import { weekDates } from '@/lib/time'
import { subjectOfCourse } from '@/graph/catalog'

export function ProposedWorkshops({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const toast = useUi((u) => u.toast)
  const decisions = useUi((u) => u.decisions)
  const decide = useUi((u) => u.decide)
  const [declineFor, setDeclineFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [changeFor, setChangeFor] = useState<string | null>(null)
  const [when, setWhen] = useState('')
  const adult = idx.adults.get(adultId)
  const mySubjects = new Set((adult?.subjects ?? []).map((cid) => subjectOfCourse(cid)))
  const proposals = useMemo(() => proposeWorkshops(snap).filter((p) => !decisions[p.id] || decisions[p.id].decision === 'changed'), [snap, decisions])
  const mine = proposals.filter((p) => !mySubjects.size || mySubjects.has(p.subject)).filter((p) => !decisions[p.id])
  const others = proposals.filter((p) => mySubjects.size && !mySubjects.has(p.subject))
  const dates = weekDates(snap.meta.week_start).filter((d) => d > snap.meta.today)
  const accept = (p: (typeof proposals)[number], overrides?: { day: string; start: string; end: string }) => {
    const offering = acceptProposal(p, overrides ? { ...overrides, id: `off_ws_${p.lesson_id}_${overrides.day}_${overrides.start.replace(':', '')}` } : {})
    decide({ proposal: p, decision: overrides ? 'changed' : 'accepted', reason: null, offering_id: offering?.id ?? null })
    toast(c.expert.accepted(p.student_ids.length))
    setChangeFor(null)
  }
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.proposed} <Explain id="expert.proposed" /></H1>
        <p className="text-sm text-ink-2">{c.expert.proposedLede}</p>
      </div>
      {mine.length ? (
        <ul className="space-y-3">
          {mine.map((p) => (
            <Card key={p.id} as="li" accent={p.kind === 'workshop' ? 'border-t-indigo' : 'border-t-teal'}>
              <H2>{p.lesson_title}</H2>
              <p className="text-sm text-ink-2">
                {idx.courses.get(p.course_id)?.title} · {c.expert.suggested}: {dayName(p.day)} {p.start} to {p.end} · {idx.places.get(p.place_id ?? '')?.name} · {idx.adults.get(p.adult_id ?? '')?.display_name}
              </p>
              <p className="text-sm">{p.why}</p>
              <p className="mt-1 text-sm font-bold">{c.expert.students} ({p.student_ids.length})</p>
              <ul className="flex flex-wrap gap-1 text-sm">
                {p.student_ids.map((sid) => (
                  <li key={sid} className="rounded-full border border-line px-2 py-0.5">
                    {idx.students.get(sid)?.display_name}
                    {p.collisions.some((x) => x.student_id === sid) ? <span className="text-orange-ink"> · {p.collisions.find((x) => x.student_id === sid)?.reason}</span> : null}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={() => accept(p)}>{c.expert.accept}</Button>
                <Button kind="secondary" onClick={() => { setChangeFor(changeFor === p.id ? null : p.id); setDeclineFor(null) }} ariaExpanded={changeFor === p.id}>{c.expert.change}</Button>
                <Button kind="quiet" onClick={() => { setDeclineFor(declineFor === p.id ? null : p.id); setChangeFor(null) }} ariaExpanded={declineFor === p.id}>{c.expert.decline}</Button>
              </div>
              {changeFor === p.id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <select aria-label={c.mentor.pickTime} className={`${inputClass} md:max-w-xs`} value={when} onChange={(e) => setWhen(e.target.value)}>
                    <option value="">{c.mentor.pickTime}</option>
                    {dates.flatMap((d) => BLOCKS.map((b) => <option key={`${d}|${b.start}`} value={`${d}|${b.start}|${b.end}`}>{dayName(d)} {b.start}</option>))}
                  </select>
                  <Button disabled={!when} onClick={() => { const [day, start, end] = when.split('|'); accept(p, { day, start, end }) }}>{c.expert.accept}</Button>
                </div>
              ) : null}
              {declineFor === p.id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input aria-label={c.expert.declineReason} className={`${inputClass} md:max-w-md`} placeholder={c.expert.declineReason} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button kind="danger" disabled={!reason.trim()} onClick={() => { decide({ proposal: p, decision: 'declined', reason, offering_id: null }); setReason(''); setDeclineFor(null); toast(c.expert.declined) }}>{c.expert.decline}</Button>
                </div>
              ) : null}
            </Card>
          ))}
        </ul>
      ) : <Empty>{c.expert.noProposals}</Empty>}
      {others.length ? (
        <p className="text-sm text-ink-2">{c.expert.proposalsWaiting(others.length)}: {others.map((p) => p.lesson_title).join(' · ')}</p>
      ) : null}
    </div>
  )
}
