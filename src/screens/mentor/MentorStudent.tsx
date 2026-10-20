import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Card, Empty, Field, H1, H2, H3, inputClass } from '@/components/ui'
import { FlagDot } from '@/components/FlagDot'
import { EvidenceList } from '@/components/EvidenceList'
import { touchpointKindLabel } from '@/components/TouchpointChip'
import { WeekGrid } from '@/components/WeekGrid'
import { TouchpointForm } from './TouchpointForm'
import { flagsFor, needs, suggestLevelReview } from '@/engine'
import { addTouchpoint, confirmPlan, updatePlan, updateStudent } from '@/store/actions'
import { useUi } from '@/store/ui'
import { HABIT_BLOCKS } from '@/graph/authored/habits'
import { format, parseISO } from 'date-fns'
import { LEVELS, PLAN_AUTONOMY } from '@/model'

export function MentorStudent({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const { studentId = '' } = useParams()
  const { student, plan, evidence, touchpoints, futre, today, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const toast = useUi((u) => u.toast)
  const [day, setDay] = useState(today)
  const [level, setLevel] = useState<string>('')
  const [autonomy, setAutonomy] = useState<string>('')
  const [reason, setReason] = useState('')
  const flags = useMemo(() => (student ? flagsFor(student, snap) : []), [student, snap])
  const studentNeeds = useMemo(() => (student ? needs(student.id, snap) : []), [student, snap])
  if (!student) return <Navigate to={`/m/${mentorId}`} replace />
  const review = suggestLevelReview(student.id, snap)
  const recent = evidence.slice().sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1)).slice(0, 8)
  const weekTps = touchpoints.filter((t) => t.when.slice(0, 10) >= snap.meta.week_start).sort((a, b) => b.when.localeCompare(a.when))
  const history = touchpoints.slice().sort((a, b) => b.when.localeCompare(a.when)).slice(0, 12)
  const applyChange = () => {
    if (!reason.trim()) return
    const patch: Partial<typeof student> = {}
    if (level && level !== student.level) patch.level = level as typeof student.level
    if (autonomy && autonomy !== student.plan_autonomy) patch.plan_autonomy = autonomy as typeof student.plan_autonomy
    if (!Object.keys(patch).length) return
    updateStudent(student.id, patch)
    addTouchpoint({ student_id: student.id, mentor_id: mentorId, kind: 'goal', when: `${today}T16:00:00.000Z`, duration_min: 5, prompt: c.mentor.changeLevel, notes: `${patch.level ? `${c.mentor.level}: ${c.app.levels[student.level]} to ${c.app.levels[patch.level]}. ` : ''}${patch.plan_autonomy ? `${c.mentor.autonomy}: ${c.app.autonomy[patch.plan_autonomy]}. ` : ''}${reason.trim()}`, private: false, student_note: null, linked_outcomes: [], linked_slot_id: null, follow_up: null })
    setReason('')
    toast(c.mentor.takesEffect)
  }
  const habitIds = HABIT_BLOCKS.flatMap((b) => b.habits.map((h) => h.id))
  return (
    <div className="space-y-6">
      <div>
        <p className="flex flex-wrap gap-3 text-sm">
          <Link to={`/m/${mentorId}`} className="text-indigo underline dark:text-indigo-1">{c.mentor.caseload}</Link>
          <Link to={`/s/${student.id}`} className="text-indigo underline dark:text-indigo-1">{c.mentor.viewAsStudent}</Link>
        </p>
        <H1>{student.display_name}</H1>
        <p className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
          {c.app.levels[student.level]} · {c.app.autonomy[student.plan_autonomy]}
          {flags.map((f) => <FlagDot key={f.kind} kind={f.kind} detail={f.detail} />)}
        </p>
        {review ? <p className="mt-1 text-sm text-indigo dark:text-indigo-1">{c.mentor.levelReviewSuggested}: {c.app.levels[review.from]} to {c.app.levels[review.to]}. {review.reasons.join(' ')}</p> : null}
      </div>

      <section aria-labelledby="week">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H2 id="week">{c.mentor.thisWeek}</H2>
          {plan ? (
            plan.confirmed_by ? <span className="text-sm text-teal-ink">{c.mentor.confirmed(idx.adults.get(plan.confirmed_by)?.display_name ?? '')}</span> : <Button onClick={() => { confirmPlan(plan.id, mentorId); toast(c.mentor.confirmed(idx.adults.get(mentorId)?.display_name ?? '')) }}>{c.mentor.confirmWeek}</Button>
          ) : null}
        </div>
        {plan ? (
          <>
            <ul className="my-2 list-disc pl-5 text-sm">
              {plan.goals.map((g, i) => <li key={i}>{g.text}{g.outcome_id ? <span className="text-ink-2"> · {idx.outcomes.get(g.outcome_id)?.name}</span> : null}</li>)}
            </ul>
            <WeekGrid weekStart={plan.week_start} slots={plan.slots} offerings={idx.offerings} day={day} onDay={setDay} today={today} />
          </>
        ) : <Empty>{c.app.none}</Empty>}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="inreach">
          <H2 id="inreach">{c.mentor.inReach}</H2>
          <ul className="mt-2 space-y-2 text-sm">
            {studentNeeds.filter((n) => n.kind === 'in_reach').slice(0, 3).map((n) => (
              <li key={n.outcome_id} className="rounded-lg border border-line p-2"><span className="font-bold">{n.outcome_name}</span><br />{n.why}</li>
            ))}
            {studentNeeds.filter((n) => n.kind === 'required').slice(0, 3).map((n) => (
              <li key={n.outcome_id} className="rounded-lg border border-line border-l-4 border-l-indigo p-2"><span className="font-bold">{c.app.required}:</span> {n.why}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="pathway">
          <H2 id="pathway">{c.mentor.pathwaySummary}</H2>
          {futre ? (
            <Card className="mt-2 text-sm">
              <p className="italic">{futre.vision.vision_text}</p>
              <p className="mt-1"><span className="font-bold">{c.pathway.cns}:</span> {futre.cns.cns_type === 'undecided' ? c.pathway.undecided : futre.cns.cns_text}</p>
              <p className="mt-1 text-ink-2">{futre.experiences.map((x) => x.title).join(' · ')}</p>
            </Card>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="evidence">
        <H2 id="evidence">{c.mentor.recentEvidence}</H2>
        <Card className="mt-2">
          <EvidenceList rows={recent.map((e) => ({ ...e, source_ref: `${idx.outcomes.get(e.outcome_id)?.name ?? e.outcome_id}` }))} adults={snap.adults} students={snap.students} />
        </Card>
      </section>

      <section aria-labelledby="tp">
        <H2 id="tp">{c.mentor.addTouchpoint}</H2>
        <div className="mt-2">
          <TouchpointForm mentorId={mentorId} studentId={student.id} />
        </div>
        <H3 className="mt-4">{c.mentor.touchpointHistory} ({weekTps.length} {c.mentor.thisWeek.toLowerCase()})</H3>
        <ul className="mt-2 space-y-1 text-sm">
          {history.map((t) => (
            <li key={t.id} className="rounded-lg border border-line p-2">
              <span className="font-bold">{format(parseISO(t.when), 'EEE MMM d, h:mm a')}</span> · {touchpointKindLabel(t.kind)} · {idx.adults.get(t.mentor_id)?.display_name}
              {t.private ? <span className="ml-2 rounded-full bg-tan-grey-2 px-2 text-xs">{c.mentor.privateNote.split(' ')[0]}</span> : null}
              <br />{t.notes}
              {t.student_note ? <span className="block text-ink-2">{student.display_name.split(' ')[0]}: {t.student_note}</span> : null}
              {t.follow_up ? <span className="block text-orange-ink">{c.mentor.followUp}: {t.follow_up.text} · {t.follow_up.due}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="settings">
        <H2 id="settings">{c.mentor.changeLevel}</H2>
        <Card className="mt-2 grid gap-3 md:grid-cols-3">
          <Field label={c.mentor.level}>
            <select className={inputClass} value={level || student.level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{c.app.levels[l]}</option>)}
            </select>
          </Field>
          <Field label={c.mentor.autonomy}>
            <select className={inputClass} value={autonomy || student.plan_autonomy} onChange={(e) => setAutonomy(e.target.value)}>
              {PLAN_AUTONOMY.map((a) => <option key={a} value={a}>{c.app.autonomy[a]}</option>)}
            </select>
          </Field>
          <Field label={c.mentor.reason} hint={c.mentor.takesEffect}>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="md:col-span-3"><Button onClick={applyChange} disabled={!reason.trim()}>{c.app.save}</Button></div>
        </Card>
        {plan ? (
          <Card className="mt-3">
            <Field label={c.mentor.focusHabits}>
              <div className="flex flex-wrap gap-1">
                {habitIds.map((h) => {
                  const on = plan.focus_habits.includes(h)
                  return (
                    <button key={h} type="button" aria-pressed={on} onClick={() => updatePlan(plan.id, { focus_habits: on ? plan.focus_habits.filter((x) => x !== h) : [...plan.focus_habits, h].slice(-2) })} className={`rounded-full px-2 py-0.5 text-xs font-bold ${on ? 'bg-teal text-white' : 'border border-line'}`}>
                      {idx.outcomes.get(h)?.name}
                    </button>
                  )
                })}
              </div>
            </Field>
          </Card>
        ) : null}
      </section>
    </div>
  )
}
