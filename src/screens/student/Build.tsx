import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Card, Empty, H1, H2, inputClass, Chip } from '@/components/ui'
import { TypeChip, WhyLine } from '@/components/SlotCard'
import { dayName } from '@/components/WeekGrid'
import { needs, newLedger, optionsForSlot, type RankedOption } from '@/engine'
import { chooseOffering, swapSlot, updatePlan } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12 } from '@/lib/time'
import type { Offering, Slot } from '@/model'
import { nowIso } from '@/store/actions'

export function Build({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, plan, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [params] = useSearchParams()
  const [activeSlot, setActiveSlot] = useState<string | null>(params.get('slot'))
  const [goalText, setGoalText] = useState('')
  const [goalOutcome, setGoalOutcome] = useState('')
  const [swapFor, setSwapFor] = useState<string | null>(null)
  const [swapReason, setSwapReason] = useState('')
  const [request, setRequest] = useState('')
  const toast = useUi((u) => u.toast)
  const addRequest = useUi((u) => u.addRequest)
  const studentNeeds = useMemo(() => (student ? needs(student.id, snap) : []), [student, snap])
  const ledger = useMemo(() => newLedger(snap), [snap])
  if (!student || !plan) return <Empty>{c.app.none}</Empty>
  const openSlots = plan.slots.filter((s) => s.offering_id === null && s.entry === 'chosen' && (s.status === 'planned' || s.status === 'confirmed'))
  const recommended = plan.slots.filter((s) => s.entry === 'recommended' && s.status !== 'attended' && s.status !== 'missed')
  const active = openSlots.find((s) => s.id === activeSlot) ?? openSlots[0]
  const options: RankedOption[] = active ? optionsForSlot(plan, active, student, snap, ledger, studentNeeds) : []
  const fullMenu: Offering[] = active
    ? snap.offerings.filter((o) => o.status === 'published' && o.day === active.day && o.start >= active.start && o.kind !== 'community' && o.kind !== 'event' && o.kind !== 'assessment' && o.entry !== 'invited' && o.entry !== 'assigned' && (ledger.fill.get(o.id) ?? 0) < o.capacity_max).sort((a, b) => a.start.localeCompare(b.start))
    : []
  const outcomeOptions = snap.outcomes.filter((o) => o.family !== 'pathway' && !o.id.startsWith('CCSS.ELA')).slice(0, 400)

  const addGoal = () => {
    if (!goalText.trim() || plan.goals.length >= 4) return
    updatePlan(plan.id, { goals: [...plan.goals, { text: goalText.trim(), outcome_id: goalOutcome || null }] })
    setGoalText('')
    setGoalOutcome('')
  }
  const choose = (slot: Slot, o: Offering) => {
    chooseOffering(plan.id, slot.id, o)
    toast(c.build.mentorSees)
    setActiveSlot(null)
  }
  const OptionCard = ({ o, reasons, builds }: { o: Offering; reasons?: string[]; builds?: string[] }) => {
    const place = idx.places.get(o.place_id)
    const leads = o.adult_ids.map((a) => idx.adults.get(a)?.display_name).filter(Boolean)
    const inIt = ledger.fill.get(o.id) ?? 0
    return (
      <li className="rounded-xl border border-line p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip type={o.experience_type} />
          <span className="font-bold">{o.title}</span>
        </div>
        <p className="text-sm text-ink-2">
          {formatTime12(o.start)} to {formatTime12(o.end)} · {place?.name}
          {leads.length ? ` · ${c.slot.leads} ${leads.join(', ')}` : ''} · {c.slot.people(inIt)}
        </p>
        {builds?.length ? (
          <p className="text-sm">
            <span className="font-bold">{c.build.builds}:</span> {builds.join(', ')}
          </p>
        ) : null}
        {reasons?.length ? (
          <p className="mt-1 flex flex-wrap gap-1">
            {reasons.map((r) => (
              <Chip key={r} className={r === 'collides' || r === 'same_type_day' ? 'bg-tan-grey-2 text-tan-grey-ink' : 'bg-teal-2 text-teal-ink'}>
                {c.build.reasons[r]}
              </Chip>
            ))}
          </p>
        ) : null}
        <div className="mt-2">
          {swapFor ? (
            <Button onClick={() => { const s = plan.slots.find((x) => x.id === swapFor); if (s) { swapSlot(plan.id, s.id, o, swapReason); setSwapFor(null); setSwapReason(''); toast(c.build.mentorSees) } }} disabled={!swapReason.trim()}>
              {c.build.choose}
            </Button>
          ) : active ? (
            <Button onClick={() => choose(active, o)} disabled={reasons?.includes('collides')}>
              {c.build.choose}
            </Button>
          ) : null}
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>{c.build.title} <Explain id="student.build" /></H1>
        <p className="mt-1 max-w-prose text-sm">{c.build.lede[student.plan_autonomy]}</p>
        <p className="text-xs text-ink-2">
          {c.build.autonomy}: {c.app.autonomy[student.plan_autonomy]}
        </p>
      </div>

      <section aria-labelledby="goals">
        <H2 id="goals">{c.build.goals}</H2>
        <Card className="mt-2 space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {plan.goals.map((g, i) => (
              <li key={i}>
                {g.text}
                {g.outcome_id ? <span className="text-ink-2"> · {idx.outcomes.get(g.outcome_id)?.name}</span> : null}
              </li>
            ))}
          </ol>
          {plan.goals.length < 4 ? (
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input aria-label={c.build.addGoal} className={inputClass} placeholder={c.build.goalPlaceholder} value={goalText} onChange={(e) => setGoalText(e.target.value)} />
              <select aria-label={c.build.linkOutcome} className={inputClass} value={goalOutcome} onChange={(e) => setGoalOutcome(e.target.value)}>
                <option value="">{c.build.noOutcome}</option>
                {outcomeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <Button onClick={addGoal}>{c.build.addGoal}</Button>
            </div>
          ) : null}
        </Card>
      </section>

      <section aria-labelledby="open">
        <H2 id="open">{c.build.openSlots} <Explain id="student.build.options" /></H2>
        {openSlots.length ? (
          <div className="mt-2 grid gap-4 md:grid-cols-[1fr_2fr]">
            <ul className="space-y-1">
              {openSlots.map((s) => (
                <li key={s.id}>
                  <button type="button" aria-pressed={active?.id === s.id} onClick={() => { setActiveSlot(s.id); setSwapFor(null) }} className={`w-full rounded-lg border border-dashed border-line p-2 text-left text-sm ${active?.id === s.id ? 'bg-indigo-2 border-indigo' : ''}`}>
                    <span className="font-bold">{dayName(s.day)}</span> · {formatTime12(s.start)} to {formatTime12(s.end)}
                  </button>
                </li>
              ))}
            </ul>
            <div>
              {active ? (
                <>
                  <h3 className="text-base">{c.build.pickFor(dayName(active.day), formatTime12(active.start))}</h3>
                  <p className="mt-2 text-sm font-bold">{c.build.options}</p>
                  <ol className="mt-1 space-y-2">
                    {options.length ? options.map((r) => <OptionCard key={r.offering.id} o={r.offering} reasons={r.reasons} builds={r.builds} />) : <Empty>{c.build.noOptions}</Empty>}
                  </ol>
                  {student.plan_autonomy !== 'guided' ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-bold text-indigo dark:text-indigo-1">{c.build.fullMenu}</summary>
                      <ol className="mt-2 space-y-2">
                        {fullMenu.filter((o) => !options.some((r) => r.offering.id === o.id)).map((o) => (
                          <OptionCard key={o.id} o={o} builds={o.outcomes_served.map((x) => idx.outcomes.get(x)?.name ?? '').filter(Boolean).slice(0, 3)} />
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <Empty>{c.build.noOpenSlots}</Empty>
        )}
      </section>

      {student.plan_autonomy !== 'guided' && recommended.length ? (
        <section aria-labelledby="swap">
          <H2 id="swap">{c.app.recommended}</H2>
          <ul className="mt-2 space-y-2">
            {recommended.map((s) => {
              const o = s.offering_id ? idx.offerings.get(s.offering_id) : null
              return (
                <li key={s.id} className="rounded-xl border border-line p-3 text-sm">
                  <p className="font-bold">
                    {dayName(s.day)} · {formatTime12(s.start)} · {o?.title}
                  </p>
                  <WhyLine why={s.why} entry={s.entry} />
                  {swapFor === s.id ? (
                    <div className="mt-2 space-y-2">
                      <label className="block">
                        <span className="font-bold">{c.build.swapReason}</span>
                        <input className={inputClass} placeholder={c.build.swapReasonPlaceholder} value={swapReason} onChange={(e) => setSwapReason(e.target.value)} />
                      </label>
                      <ol className="space-y-2">
                        {snap.offerings
                          .filter((o2) => o2.status === 'published' && o2.day === s.day && o2.start === s.start && o2.id !== s.offering_id && o2.kind !== 'community' && o2.kind !== 'event' && o2.entry !== 'invited' && o2.entry !== 'assigned' && (ledger.fill.get(o2.id) ?? 0) < o2.capacity_max)
                          .slice(0, 6)
                          .map((o2) => (
                            <OptionCard key={o2.id} o={o2} builds={o2.outcomes_served.map((x) => idx.outcomes.get(x)?.name ?? '').filter(Boolean).slice(0, 3)} />
                          ))}
                      </ol>
                      <Button kind="quiet" onClick={() => setSwapFor(null)}>
                        {c.app.cancel}
                      </Button>
                    </div>
                  ) : (
                    <Button kind="secondary" className="mt-2" onClick={() => { setSwapFor(s.id); setActiveSlot(null) }}>
                      {c.build.swap}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="requests">
        <H2 id="requests">{c.build.requestOneOnOne}</H2>
        <Card className="mt-2 space-y-2">
          <input aria-label={c.build.proposeStudyGroup} className={inputClass} placeholder={c.build.studyGroupPlaceholder} value={request} onChange={(e) => setRequest(e.target.value)} />
          <div className="flex gap-2">
            <Button kind="secondary" disabled={!request.trim()} onClick={() => { addRequest({ student_id: studentId, kind: '1on1', text: request, at: nowIso() }); setRequest(''); toast(c.build.requested) }}>
              {c.build.requestOneOnOne}
            </Button>
            <Button kind="secondary" disabled={!request.trim()} onClick={() => { addRequest({ student_id: studentId, kind: 'study_group', text: request, at: nowIso() }); setRequest(''); toast(c.build.requested) }}>
              {c.build.proposeStudyGroup}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
