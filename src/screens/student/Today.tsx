import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { SlotCard } from '@/components/SlotCard'
import { EvidenceList } from '@/components/EvidenceList'
import { TouchpointChip } from '@/components/TouchpointChip'
import { Button, Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { updateSlot } from '@/store/actions'
import { firstName } from '@/lib'
import { shiftDate, toMin } from '@/lib/time'
import type { Slot } from '@/model'

/** The current clock inside the sandbox day: 10:30 on the demo day so one slot is "now". */
const DEMO_NOW = '10:30'

export function Today({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, plan, mentor, evidence, touchpoints, today, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [goalDraft, setGoalDraft] = useState<Record<string, string>>({})
  const daySlots = useMemo(() => (plan?.slots ?? []).filter((s) => s.day === today && s.status !== 'cancelled' && s.status !== 'moved').sort((a, b) => a.start.localeCompare(b.start)), [plan, today])
  const struck = useMemo(() => (plan?.slots ?? []).filter((s) => s.day === today && s.status === 'moved'), [plan, today])
  if (!student || !plan) return <Empty>{c.app.none}</Empty>
  const nowMin = toMin(DEMO_NOW)
  const current = daySlots.find((s) => toMin(s.start) <= nowMin && toMin(s.end) > nowMin)
  const next = daySlots.filter((s) => toMin(s.start) > nowMin)
  const done = daySlots.filter((s) => toMin(s.end) <= nowMin)
  const todaysTouchpoints = touchpoints.filter((t) => t.when.slice(0, 10) === today).sort((a, b) => a.when.localeCompare(b.when))
  const followUps = touchpoints.filter((t) => t.follow_up && t.follow_up.due >= today && t.follow_up.due <= shiftDate(today, 2))
  const yesterday = (plan.slots ?? []).filter((s) => s.day === shiftDate(today, -1) && s.goal)
  const isLaunch = student.level === 'launch'
  const onSite = daySlots.filter((s) => s.experience_type === 'RW')
  const campus = daySlots.filter((s) => s.experience_type !== 'RW')

  const card = (s: Slot, pinned = false, isStruck = false) => {
    const o = s.offering_id ? idx.offerings.get(s.offering_id) : null
    const place = o ? idx.places.get(o.place_id) : null
    const leads = o ? o.adult_ids.map((a) => idx.adults.get(a)).filter((a): a is NonNullable<typeof a> => Boolean(a)) : []
    const peopleCount = o ? snap.plans.filter((p) => p.week_start === snap.meta.week_start).flatMap((p) => p.slots).filter((x) => x.offering_id === o.id && x.status !== 'cancelled' && x.status !== 'moved').length : 0
    const ev = s.evidence_id ? evidence.filter((e) => e.id === s.evidence_id) : []
    const canCheckIn = pinned && s.status !== 'attended'
    return (
      <SlotCard key={s.id} slot={s} offering={o} place={place} leads={leads} peopleCount={peopleCount} pinned={pinned} struck={isStruck}>
        <div className="space-y-3 text-sm">
          {s.bring ? (
            <p>
              <span className="font-bold">{c.slot.bring}:</span> {s.bring}
            </p>
          ) : null}
          {o?.kind === 'workshop' && o.lesson_id ? (
            <p>
              <span className="font-bold">{c.courses.builds}:</span> {o.outcomes_served.map((x) => idx.outcomes.get(x)?.name).filter(Boolean).join(', ')}
            </p>
          ) : null}
          {s.entry !== 'whole_group' && s.entry !== 'protected' ? (
            <label className="block">
              <span className="font-bold">{c.slot.goal}</span>
              <div className="mt-1 flex gap-2">
                <input className={inputClass} placeholder={c.slot.goalPlaceholder} value={goalDraft[s.id] ?? s.goal ?? ''} onChange={(e) => setGoalDraft({ ...goalDraft, [s.id]: e.target.value })} />
                <Button kind="secondary" onClick={() => updateSlot(plan.id, s.id, { goal: goalDraft[s.id] ?? s.goal ?? '' })}>
                  {c.app.save}
                </Button>
              </div>
            </label>
          ) : null}
          {canCheckIn ? (
            <Button onClick={() => updateSlot(plan.id, s.id, { status: 'attended' })}>{c.slot.checkIn}</Button>
          ) : s.status === 'attended' && toMin(s.end) <= nowMin && s.entry !== 'whole_group' ? (
            <div>
              <p className="font-bold">{c.slot.rate}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(['got_it', 'need_more', 'ready_for_more'] as const).map((r) => (
                  <Button key={r} kind={s.rating === r ? 'primary' : 'secondary'} ariaPressed={s.rating === r} onClick={() => updateSlot(plan.id, s.id, { rating: r })}>
                    {c.slot.ratings[r]}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {ev.length ? (
            <div>
              <p className="font-bold">{c.slot.evidenceBehind}</p>
              <EvidenceList rows={ev} adults={snap.adults} students={snap.students} />
            </div>
          ) : null}
        </div>
      </SlotCard>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>{c.today.greeting(firstName(student.display_name))}</H1>
        <p className="text-ink-2">{c.today.dayLine(dayName(today))}</p>
      </div>
      {todaysTouchpoints.length || followUps.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {todaysTouchpoints.map((t) => (
            <TouchpointChip key={t.id} tp={t} who={mentor && t.mentor_id === mentor.id ? firstName(mentor.display_name) : idx.adults.get(t.mentor_id)?.display_name} />
          ))}
          {followUps.map((t) => (
            <span key={t.id} className="rounded-full bg-orange-2 px-2 py-0.5 text-xs text-orange-ink">
              {c.slot.followUp}: {t.follow_up?.text}
            </span>
          ))}
        </div>
      ) : null}
      {isLaunch && onSite.length ? (
        <section aria-labelledby="onsite">
          <H2 id="onsite">{c.slot.onSite}</H2>
          <div className="mt-2 space-y-2">{onSite.map((s) => card(s, s.id === current?.id))}</div>
        </section>
      ) : null}
      <section aria-labelledby="now">
        <H2 id="now">{isLaunch ? c.slot.onCampus : c.slot.whereNow}</H2>
        <div className="mt-2 space-y-2">
          {isLaunch ? campus.map((s) => card(s, s.id === current?.id)) : current ? card(current, true) : <Empty>{daySlots.length ? c.today.nothingNow : c.slot.noSlotsToday}</Empty>}
        </div>
      </section>
      {!isLaunch ? (
        <>
          <section aria-labelledby="next">
            <H2 id="next">{c.slot.upNext}</H2>
            <div className="mt-2 space-y-2">{next.length ? next.map((s) => card(s)) : <Empty>{c.app.none}</Empty>}</div>
            {struck.length ? <div className="mt-2 space-y-2">{struck.map((s) => card(s, false, true))}</div> : null}
          </section>
          <section aria-labelledby="done">
            <H2 id="done">{c.slot.done}</H2>
            <div className="mt-2 space-y-2">{done.length ? done.map((s) => card(s)) : <Empty>{c.app.none}</Empty>}</div>
          </section>
        </>
      ) : null}
      <section aria-labelledby="goals">
        <H2 id="goals">{c.today.goalsForWeek}</H2>
        <Card className="mt-2">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {plan.goals.map((g, i) => (
              <li key={i}>
                {g.text}
                {g.outcome_id ? <span className="text-ink-2"> · {idx.outcomes.get(g.outcome_id)?.name}</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      </section>
      {yesterday.length ? (
        <section aria-labelledby="yesterday">
          <H2 id="yesterday">{c.today.tomorrowGoals}</H2>
          <Card className="mt-2">
            <ul className="space-y-2 text-sm">
              {yesterday.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className={s.rating ? 'line-through' : ''}>{s.goal}</span>
                  {!s.rating ? (
                    <Button kind="secondary" onClick={() => updateSlot(plan.id, s.id, { rating: 'got_it' })}>
                      {c.today.checkOff}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
