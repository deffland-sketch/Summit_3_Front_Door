import { useCopy } from '@/copy'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Card, H1 } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { newLedger } from '@/engine'
import { formatTime12, minutesBetween } from '@/lib/time'

export function Events() {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const ledger = newLedger(snap)
  const events = snap.offerings.filter((o) => (o.kind === 'event' || o.kind === 'community' || o.kind === 'exhibition') && o.day >= snap.meta.week_start && o.status === 'published' && !o.source_ref.startsWith('grp_')).sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start))
  const protectedCount = snap.plans.filter((p) => p.week_start === snap.meta.week_start).flatMap((p) => p.slots).filter((s) => s.entry === 'protected').length
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.events}</H1>
        <p className="text-sm text-ink-2">{c.lead.eventsLede} {protectedCount} protected slots this week stay where they are.</p>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-ink-2"><th className="font-bold">Day</th><th className="font-bold">Start</th><th className="font-bold">Length</th><th className="font-bold">Session</th><th className="font-bold">{c.lead.who}</th><th className="font-bold">{c.lead.staff}</th><th className="font-bold">{c.lead.where}</th></tr></thead>
          <tbody>
            {events.map((o) => (
              <tr key={o.id} className="border-t border-line"><td className="py-1">{dayName(o.day).slice(0, 3)}</td><td>{formatTime12(o.start)}</td><td>{minutesBetween(o.start, o.end)} min</td><td>{o.title}</td><td>{ledger.fill.get(o.id) ?? 0}</td><td>{o.adult_ids.map((a) => idx.adults.get(a)?.display_name).join(', ')}</td><td>{idx.places.get(o.place_id)?.name}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
