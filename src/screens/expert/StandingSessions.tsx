import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Button, Card, Empty, H1 } from '@/components/ui'
import { TypeChip } from '@/components/SlotCard'
import { upsertOffering } from '@/store/actions'
import { formatTime12, weekdayOf } from '@/lib/time'
import { weekOfferingsFor } from './shared'

const DAY: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }

export function StandingSessions({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const adult = idx.adults.get(adultId)
  const isArchitect = adult?.capacities.includes('system_architect')
  const groups = useMemo(() => {
    const list = weekOfferingsFor(snap, isArchitect ? undefined : adultId).filter((o) => o.kind !== 'community' || isArchitect)
    const m = new Map<string, typeof list>()
    for (const o of list) m.set(`${o.title}|${o.start}|${o.standing}`, [...(m.get(`${o.title}|${o.start}|${o.standing}`) ?? []), o])
    return [...m.values()].sort((a, b) => a[0].start.localeCompare(b[0].start))
  }, [snap, adultId, isArchitect])
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.standing}</H1>
        <p className="text-sm text-ink-2">{c.expert.standingLede}</p>
      </div>
      {groups.length ? (
        <ul className="space-y-2">
          {groups.map((list) => {
            const o = list[0]
            return (
              <Card key={o.id} as="li" className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2"><TypeChip type={o.experience_type} /><span className="font-bold">{o.title}</span></p>
                  <p className="text-sm text-ink-2">{list.map((x) => DAY[weekdayOf(x.day)]).join(', ')} · {formatTime12(o.start)} to {formatTime12(o.end)} · {idx.places.get(o.place_id)?.name} · {o.adult_ids.map((a) => idx.adults.get(a)?.display_name).join(', ')}</p>
                </div>
                <Button kind="secondary" onClick={() => { for (const x of list) upsertOffering({ ...x, standing: !o.standing }) }}>{o.standing ? c.expert.stopStanding : c.expert.makeStanding}</Button>
              </Card>
            )
          })}
        </ul>
      ) : <Empty>{c.app.none}</Empty>}
    </div>
  )
}
