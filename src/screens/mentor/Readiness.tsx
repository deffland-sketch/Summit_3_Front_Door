import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { Assumed } from '@/components/Assumed'
import { Explain } from '@/components/Explain'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Button, Card, Empty, H1, inputClass } from '@/components/ui'
import { EvidenceList } from '@/components/EvidenceList'
import { needs, BLOCKS } from '@/engine'
import { upsertOffering, updatePlan } from '@/store/actions'
import { useUi } from '@/store/ui'
import { weekDates } from '@/lib/time'
import { dayName } from '@/components/WeekGrid'
import type { Offering, Slot } from '@/model'

export function Readiness({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const toast = useUi((u) => u.toast)
  const [when, setWhen] = useState<Record<string, string>>({})
  const ready = useMemo(
    () => snap.students.filter((s) => s.mentor_id === mentorId).flatMap((s) => needs(s.id, snap).filter((n) => n.kind === 'readiness').map((n) => ({ student: s, need: n }))),
    [snap, mentorId],
  )
  const dates = weekDates(snap.meta.week_start).filter((d) => d > snap.meta.today)
  const book = (studentId: string, outcomeId: string, kind: 'assessment' | 'exhibition', title: string) => {
    const key = `${studentId}:${outcomeId}`
    const [day, start] = (when[key] ?? `${dates[0]}|${BLOCKS[1].start}`).split('|')
    const block = BLOCKS.find((b) => b.start === start) ?? BLOCKS[1]
    const plan = snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
    if (!plan) return
    const offering: Offering = { id: `off_assess_${studentId}_${outcomeId}_${day}`, experience_type: 'PP', kind, title, lesson_id: null, outcomes_served: [outcomeId], adult_ids: [mentorId], place_id: 'pl_nook_1', day, start: block.start, end: block.end, capacity_min: 1, capacity_max: 1, entry: 'invited', source: 'front_door', source_ref: `assess:${studentId}`, standing: false, status: 'published' }
    upsertOffering(offering)
    const overlapping = plan.slots.filter((s) => s.day === day && s.start < block.end && block.start < s.end && s.status !== 'cancelled')
    if (overlapping.some((s) => s.entry === 'protected' || s.experience_type === 'RW')) {
      toast(c.build.noOptions)
      return
    }
    const slot: Slot = { id: `${plan.id}_assess_${outcomeId}`, plan_id: plan.id, day, start: block.start, end: block.end, experience_type: 'PP', offering_id: offering.id, entry: 'assigned', why: c.why.assessment(idx.outcomes.get(outcomeId)?.name ?? outcomeId, ready.find((r) => r.student.id === studentId && r.need.outcome_id === outcomeId)?.need.evidence_ref ?? 'your latest strong scores'), goal: null, status: plan.confirmed_by ? 'confirmed' : 'planned', rating: null, bring: 'The evidence you want in the room', evidence_id: null, added_at: new Date().toISOString() }
    updatePlan(plan.id, { version: plan.version + 1, slots: [...plan.slots.map((s) => (overlapping.includes(s) ? { ...s, status: 'moved' as const } : s)), slot].sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day))) })
    toast(c.mentor.booked)
  }
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.mentor.readiness} <Explain id="mentor.readiness" /> <Assumed q={3} /></H1>
        <p className="text-sm text-ink-2">{c.mentor.readinessLede}</p>
      </div>
      {ready.length ? (
        <ul className="space-y-3">
          {ready.map(({ student, need }) => {
            const key = `${student.id}:${need.outcome_id}`
            return (
              <Card key={key} as="li" accent="border-t-teal">
                <p>
                  <Link className="font-bold text-indigo underline dark:text-indigo-1" to={`/m/${mentorId}/student/${student.id}`}>{student.display_name}</Link>
                  <span className="text-sm text-ink-2"> · {c.app.levels[student.level]}</span>
                </p>
                <p className="text-sm"><span className="font-bold">{need.outcome_name}.</span> {need.why}</p>
                <div className="mt-2">
                  <EvidenceList rows={snap.evidence.filter((e) => e.student_id === student.id && e.outcome_id === need.outcome_id && e.value_kind === 'score_1_8')} adults={snap.adults} students={snap.students} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select aria-label={c.mentor.pickTime} className={`${inputClass} md:max-w-xs`} value={when[key] ?? `${dates[0]}|${BLOCKS[1].start}`} onChange={(e) => setWhen({ ...when, [key]: e.target.value })}>
                    {dates.flatMap((d) => BLOCKS.map((b) => <option key={`${d}|${b.start}`} value={`${d}|${b.start}`}>{dayName(d)} {b.start}</option>))}
                  </select>
                  <Button onClick={() => book(student.id, need.outcome_id, 'assessment', `Assessment: ${need.outcome_name}`)}>{c.mentor.bookAssessment}</Button>
                  <Button kind="secondary" onClick={() => book(student.id, need.outcome_id, 'exhibition', `Portfolio review: ${need.outcome_name}`)}>{c.mentor.bookPortfolio}</Button>
                  <Button kind="secondary" onClick={() => book(student.id, need.outcome_id, 'exhibition', `Defense: ${need.outcome_name}`)}>{c.mentor.bookDefense}</Button>
                </div>
              </Card>
            )
          })}
        </ul>
      ) : <Empty>{c.mentor.noReadiness}</Empty>}
    </div>
  )
}
