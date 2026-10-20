import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCopy } from '@/copy'
import { useIndexes, useStudentData } from '@/app/hooks'
import { WeekGrid, TypeLegend } from '@/components/WeekGrid'
import { TouchpointChip } from '@/components/TouchpointChip'
import { Empty, H1 } from '@/components/ui'
import { weekDates } from '@/lib/time'

export function Week({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { plan, touchpoints, today, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const nav = useNavigate()
  const [day, setDay] = useState(today)
  if (!plan) return <Empty>{c.app.none}</Empty>
  const dates = weekDates(plan.week_start)
  const weekTps = touchpoints.filter((t) => t.when.slice(0, 10) >= dates[0] && t.when.slice(0, 10) <= dates[4])
  return (
    <div className="space-y-4">
      <div>
        <H1>{c.week.title}</H1>
        <p className="text-sm text-ink-2">
          {c.week.version(plan.version)} · {plan.confirmed_by ? c.week.confirmedBy(idx.adults.get(plan.confirmed_by)?.display_name ?? '') : c.week.awaiting}
        </p>
      </div>
      <TypeLegend />
      <WeekGrid weekStart={plan.week_start} slots={plan.slots} offerings={idx.offerings} day={day} onDay={setDay} today={today} onSlot={(s) => nav(s.offering_id === null && s.entry === 'chosen' ? `/s/${studentId}/build?slot=${s.id}` : `/s/${studentId}`)} />
      {weekTps.length ? (
        <div className="flex flex-wrap gap-2">
          {weekTps
            .slice()
            .sort((a, b) => a.when.localeCompare(b.when))
            .map((t) => (
              <TouchpointChip key={t.id} tp={t} who={`${dates.indexOf(t.when.slice(0, 10)) >= 0 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dates.indexOf(t.when.slice(0, 10))] : ''} · ${snap.adults.find((a) => a.id === t.mentor_id)?.display_name ?? ''}`} />
            ))}
        </div>
      ) : null}
    </div>
  )
}
