import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { useCopy } from '@/copy'
import { useSnapshot, useToday } from '@/app/hooks'
import { Button, Chevron, Field, Toggle, inputClass } from './ui'
import { useUi } from '@/store/ui'
import { addEvidence, runOvernight, upsertOffering, updatePlan } from '@/store/actions'
import { repos } from '@/store'
import { buildWeek, newLedger } from '@/engine'
import { futreAdapter } from '@/adapters/futre'
import { shiftDate, weekDates } from '@/lib/time'

/** The demo driver's panel (Spec 7 and Spec 8). Nudges one source; the week responds. */
export function SandboxControls({ studentId }: { studentId?: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const today = useToday()
  const location = useLocation()
  const toast = useUi((u) => u.toast)
  const setToday = useUi((u) => u.setTodayOverride)
  const moves = useUi((u) => u.moves)
  const showAssumptions = useUi((u) => u.showAssumptions)
  const setShowAssumptions = useUi((u) => u.setShowAssumptions)
  const [open, setOpen] = useState(false)
  const routeStudent = location.pathname.match(/\/(?:s|student)\/(stu_\d+)/)?.[1]
  const [picked, setPicked] = useState('')
  const [score, setScore] = useState(41)
  const sid = picked || studentId || routeStudent || snap.students[0]?.id
  const student = snap.students.find((s) => s.id === sid)
  const active = useMemo(() => snap.assignments.find((a) => a.student_id === sid && (a.status === 'active' || a.status === 'practiced' || a.status === 'needs_workshop') && a.lesson_id.startsWith('les_im')), [snap, sid])
  const lesson = active ? snap.lessons.find((l) => l.id === active.lesson_id) : null

  const lower = () => {
    if (!student || !lesson) return
    addEvidence({ student_id: student.id, outcome_id: lesson.outcomes_served[0], source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: score, artifact_url: null, recorded_by: 'system', slot_id: null, recorded_at: `${today}T20:05:00.000Z` })
    toast(c.sandbox.lowered(lesson.title, score))
  }
  const master = () => {
    if (!student || !lesson || !active) return
    addEvidence({ student_id: student.id, outcome_id: lesson.outcomes_served[0], source: 'kira', source_ref: lesson.id, value_kind: 'mastery_pct', value: 92, artifact_url: null, recorded_by: 'system', slot_id: null, recorded_at: `${today}T20:06:00.000Z` })
    repos.collection('assignments').upsert({ ...active, status: 'mastered', mastered_at: `${today}T20:06:00.000Z` })
    const next = snap.assignments.find((a) => a.student_id === student.id && a.status === 'queued' && snap.lessons.find((l) => l.id === a.lesson_id)?.unit_id === lesson.unit_id)
    if (next) repos.collection('assignments').upsert({ ...next, status: 'active', opened_at: `${today}T20:06:00.000Z` })
    toast(c.sandbox.mastered(lesson.title))
  }
  const rebuild = () => {
    if (!student) return
    const s2 = repos.snapshot()
    const plan = s2.plans.find((p) => p.student_id === student.id && p.week_start === s2.meta.week_start)
    if (!plan) return
    const ledger = newLedger(s2)
    for (const s of plan.slots) if (s.offering_id) ledger.fill.set(s.offering_id, Math.max(0, (ledger.fill.get(s.offering_id) ?? 0) - 1))
    const rw = plan.slots.filter((s) => s.experience_type === 'RW' && s.offering_id && s.status !== 'cancelled').map((s) => s.offering_id!)
    const next = buildWeek(student.id, s2, { ledger, rwPlacements: rw, goals: plan.goals, focusHabits: plan.focus_habits, planId: plan.id, version: plan.version + 1 })
    // Keep what already happened; replace the rest of the week.
    const kept = plan.slots.filter((s) => s.day < today || (s.day === today && s.status === 'attended'))
    const fresh = next.slots.filter((s) => !(s.day < today || kept.some((k) => k.day === s.day && k.start === s.start)))
    updatePlan(plan.id, { version: plan.version + 1, built_by: 'engine', slots: [...kept, ...fresh].sort((a, b) => (a.day === b.day ? a.start.localeCompare(b.start) : a.day.localeCompare(b.day))) })
    toast(c.sandbox.rebuilt)
  }
  const futre = () => {
    if (!student) return
    const f = snap.futre.find((x) => x.student_id === student.id)
    const exp = f?.experiences.find((x) => !x.reflection_text) ?? f?.experiences[f.experiences.length - 1]
    if (!exp) return
    futreAdapter.pushReflection(student.id, exp.experience_id, 'The placement changed how I see the next step. I want to keep going.')
    toast(c.sandbox.futreAdded)
  }
  const cancelPartner = () => {
    const tomorrow = shiftDate(today, 1)
    const ledger = newLedger(snap)
    const o = snap.offerings.filter((x) => x.experience_type === 'RW' && x.day === tomorrow && x.status === 'published' && (ledger.fill.get(x.id) ?? 0) > 0).sort((a, b) => (ledger.fill.get(b.id) ?? 0) - (ledger.fill.get(a.id) ?? 0))[0]
    if (!o) {
      toast(c.sandbox.nothingToCancel)
      return
    }
    upsertOffering({ ...o, status: 'cancelled' })
    const ms = runOvernight(`${today}T12:00:00.000Z`, today)
    toast(c.sandbox.partnerCancelled(o.title, ms.filter((m) => m.kind === 'moved').length))
  }
  const overnight = () => {
    const ms = runOvernight(`${today}T12:00:00.000Z`, today)
    toast(c.sandbox.overnightRan(ms.length))
  }
  return (
    <div className="relative no-print">
      <Button kind="secondary" onClick={() => setOpen((v) => !v)} ariaExpanded={open}>
        {c.sandbox.open} <Chevron open={open} />
      </Button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,26rem)] space-y-3 rounded-xl border border-line bg-surface p-4 text-sm shadow" role="dialog" aria-label={c.sandbox.title}>
          <p className="text-ink-2">{c.sandbox.lede}</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label={c.sandbox.student}>
              <select className={inputClass} value={sid} onChange={(e) => setPicked(e.target.value)}>
                {snap.students.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </Field>
            <Field label={c.sandbox.today}>
              <select className={inputClass} value={today} onChange={(e) => setToday(e.target.value === snap.meta.today ? null : e.target.value)}>
                {weekDates(snap.meta.week_start).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          {lesson ? (
            <div className="space-y-2 rounded-lg border border-line p-2">
              <p className="text-ink-2">{lesson.title}</p>
              <div className="flex items-end gap-2">
                <Field label={c.sandbox.score}><input type="number" min={0} max={100} className={inputClass} value={score} onChange={(e) => setScore(Number(e.target.value))} /></Field>
                <Button onClick={lower}>{c.sandbox.lowerKira}</Button>
              </div>
              <Button kind="secondary" onClick={master}>{c.sandbox.masterLesson}</Button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={overnight}>{c.sandbox.runOvernight}</Button>
            <Button kind="secondary" onClick={rebuild}>{c.sandbox.rebuild}</Button>
            <Button kind="secondary" onClick={futre}>{c.sandbox.addFutre}</Button>
            <Button kind="danger" onClick={cancelPartner}>{c.sandbox.cancelPartner}</Button>
          </div>
          <Toggle label={c.sandbox.showAssumptions} on={showAssumptions} onChange={setShowAssumptions} />
          {moves.length ? (
            <div>
              <p className="font-bold">{c.sandbox.lastMoves} ({moves.length})</p>
              <ul className="max-h-32 overflow-y-auto text-xs text-ink-2">
                {moves.slice(0, 10).map((m, i) => <li key={i}>{snap.students.find((s) => s.id === m.student_id)?.display_name}: {m.why}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
