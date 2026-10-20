import { useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { Button, Card, Empty, H1, inputClass } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { confirmPlan, swapSlot } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12 } from '@/lib/time'
import { newLedger } from '@/engine'

export function ConfirmMonday({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const toast = useUi((u) => u.toast)
  const [editing, setEditing] = useState<{ planId: string; slotId: string } | null>(null)
  const [reason, setReason] = useState('')
  const menteeIds = new Set(snap.students.filter((s) => s.mentor_id === mentorId).map((s) => s.id))
  const waiting = snap.plans.filter((p) => p.week_start === snap.meta.week_start && menteeIds.has(p.student_id) && !p.confirmed_by)
  const ledger = newLedger(snap)
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.mentor.confirmMonday}</H1>
        <p className="text-sm text-ink-2">{c.mentor.confirmLede} {c.mentor.awaiting(waiting.length)}</p>
      </div>
      {waiting.length ? (
        <Button onClick={() => { for (const p of waiting) confirmPlan(p.id, mentorId); toast(c.mentor.allConfirmed) }}>{c.mentor.approveAll}</Button>
      ) : <Empty>{c.mentor.allConfirmed}</Empty>}
      <ul className="space-y-3">
        {waiting.map((p) => {
          const s = idx.students.get(p.student_id)!
          return (
            <Card key={p.id} as="li">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  <Link className="font-bold text-indigo underline dark:text-indigo-1" to={`/m/${mentorId}/student/${s.id}`}>{s.display_name}</Link>
                  <span className="text-sm text-ink-2"> · {c.app.levels[s.level]} · {c.mentor.weekBuiltBy(p.built_by)} · {p.published_at ? c.mentor.weekPublished(p.published_at.slice(0, 10)) : c.mentor.draft}</span>
                </p>
                <Button onClick={() => { confirmPlan(p.id, mentorId); toast(c.mentor.confirmed(idx.adults.get(mentorId)?.display_name ?? '')) }}>{c.mentor.approve}</Button>
              </div>
              <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                {p.slots.filter((x) => x.day >= today && x.entry !== 'whole_group' && x.entry !== 'protected' && x.status !== 'moved').map((x) => {
                  const o = x.offering_id ? idx.offerings.get(x.offering_id) : null
                  const isEditing = editing?.slotId === x.id
                  return (
                    <li key={x.id} className="rounded-lg border border-line p-2">
                      <span className="font-bold">{dayName(x.day).slice(0, 3)} {formatTime12(x.start)}</span> · {o?.title ?? c.app.openSlot} <span className="text-ink-2">· {x.entry}</span>
                      {x.entry !== 'required' && x.entry !== 'assigned' ? (
                        isEditing ? (
                          <div className="mt-1 space-y-1">
                            <input className={inputClass} placeholder={c.mentor.changeReason} value={reason} onChange={(e) => setReason(e.target.value)} aria-label={c.mentor.changeReason} />
                            <select className={inputClass} aria-label={c.mentor.replacement} onChange={(e) => { const o2 = idx.offerings.get(e.target.value); if (o2 && reason.trim()) { swapSlot(p.id, x.id, o2, reason); setEditing(null); setReason(''); toast(c.mentor.changed) } }} defaultValue="">
                              <option value="">{c.mentor.replacement}</option>
                              {snap.offerings.filter((o2) => o2.status === 'published' && o2.day === x.day && o2.start === x.start && o2.id !== x.offering_id && o2.kind !== 'community' && o2.kind !== 'event' && o2.entry !== 'invited' && o2.entry !== 'assigned' && (ledger.fill.get(o2.id) ?? 0) < o2.capacity_max).map((o2) => <option key={o2.id} value={o2.id}>{o2.title}</option>)}
                            </select>
                            <Button kind="quiet" onClick={() => setEditing(null)}>{c.app.cancel}</Button>
                          </div>
                        ) : (
                          <Button kind="quiet" className="ml-2" onClick={() => setEditing({ planId: p.id, slotId: x.id })}>{c.mentor.changeSlot}</Button>
                        )
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </ul>
    </div>
  )
}
