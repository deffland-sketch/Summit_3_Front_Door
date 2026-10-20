import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot } from '@/app/hooks'
import { Button, Card, Empty, H1 } from '@/components/ui'
import { needsYou } from '@/engine'
import { repos } from '@/store'
import { useUi } from '@/store/ui'
import { subjectOfCourse } from '@/graph/catalog'

export function NeedsYou({ adultId }: { adultId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const toast = useUi((u) => u.toast)
  const [done, setDone] = useState<Set<string>>(new Set())
  const adult = idx.adults.get(adultId)
  const mySubjects = new Set((adult?.subjects ?? []).map((cid) => subjectOfCourse(cid)))
  const items = useMemo(() => needsYou(snap).filter((i) => !mySubjects.size || mySubjects.has(i.subject)), [snap, mySubjects])
  const key = (i: (typeof items)[number]) => `${i.kind}:${i.student_id}:${i.lesson_id}`
  const open = items.filter((i) => !done.has(key(i)))
  const act = (i: (typeof items)[number], action: 'skip' | 'flag' | 'looked') => {
    const asg = snap.assignments.find((a) => a.student_id === i.student_id && a.lesson_id === i.lesson_id)
    if (asg && action === 'skip') repos.collection('assignments').upsert({ ...asg, status: 'skipped_on_mastery', mastered_at: new Date().toISOString() })
    if (asg && action === 'flag') repos.collection('assignments').upsert({ ...asg, status: 'needs_workshop' })
    setDone(new Set([...done, key(i)]))
    toast(c.expert.done)
  }
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.expert.needsYou}</H1>
        <p className="text-sm text-ink-2">{c.expert.needsYouLede}</p>
      </div>
      {open.length ? (
        <ul className="space-y-2">
          {open.map((i) => (
            <Card key={key(i)} as="li" accent={i.kind === 'stale' ? 'border-t-tan-grey' : i.kind === 'opt_out' ? 'border-t-teal' : 'border-t-indigo'}>
              <p className="text-sm text-ink-2">{c.expert.kinds[i.kind]}</p>
              <p className="font-bold">{idx.students.get(i.student_id)?.display_name}</p>
              <p className="text-sm">{i.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {i.kind === 'opt_out' ? <Button onClick={() => act(i, 'skip')}>{c.expert.confirmSkip}</Button> : null}
                {i.kind === 'flag_required' ? <Button onClick={() => act(i, 'flag')}>{c.expert.flagRequired}</Button> : null}
                <Button kind="secondary" onClick={() => act(i, 'looked')}>{c.expert.lookedAt}</Button>
              </div>
            </Card>
          ))}
        </ul>
      ) : <Empty>{c.app.none}</Empty>}
    </div>
  )
}
