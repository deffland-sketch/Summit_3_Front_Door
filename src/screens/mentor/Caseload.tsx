import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { useIndexes, useSnapshot, useToday } from '@/app/hooks'
import { caseloadFlags, needs } from '@/engine'
import { FlagDot } from '@/components/FlagDot'
import { Card, Empty, H1, H2, inputClass } from '@/components/ui'
import { useUi } from '@/store/ui'
import { format, parseISO } from 'date-fns'
import { LEVELS, OUTCOME_FAMILIES } from '@/model'

export function Caseload({ mentorId }: { mentorId: string }) {
  const c = useCopy()
  const snap = useSnapshot()
  const idx = useIndexes()
  const today = useToday()
  const moves = useUi((u) => u.moves)
  const requests = useUi((u) => u.requests)
  const [sort, setSort] = useState<'attention' | 'name'>('attention')
  const [level, setLevel] = useState('')
  const [family, setFamily] = useState('')
  const rows = useMemo(() => {
    const flags = caseloadFlags(snap, mentorId)
    return flags.map((f) => {
      const n = needs(f.student.id, snap)
      const lastTp = snap.touchpoints.filter((t) => t.student_id === f.student.id && t.when <= `${today}T23:59`).sort((a, b) => (a.when < b.when ? 1 : -1))[0]
      const plan = snap.plans.find((p) => p.student_id === f.student.id && p.week_start === snap.meta.week_start)
      const required = plan?.slots.filter((s) => s.entry === 'required').length ?? 0
      const families = new Set(n.map((x) => x.family))
      const weight = f.flags.reduce((w, x) => w + (x.kind === 'family' ? 5 : x.kind === 'nudge' ? 4 : x.kind === 'ready' ? 3 : x.kind === 'level_review' ? 2 : 1), 0)
      return { ...f, needs: n, lastTp, required, families, weight }
    })
  }, [snap, mentorId, today])
  const filtered = rows
    .filter((r) => !level || r.student.level === level)
    .filter((r) => !family || r.families.has(family as 'cognitive'))
    .sort((a, b) => (sort === 'attention' ? b.weight - a.weight || a.student.display_name.localeCompare(b.student.display_name) : a.student.display_name.localeCompare(b.student.display_name)))
  const myMoves = moves.filter((m) => idx.students.get(m.student_id)?.mentor_id === mentorId)
  const myRequests = requests.filter((r) => idx.students.get(r.student_id)?.mentor_id === mentorId)
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.mentor.caseload}</H1>
        <p className="text-sm text-ink-2">{c.mentor.caseloadLede(rows.length)}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <label>
          <span className="sr-only">{c.mentor.attention}</span>
          <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value as 'attention')}>
            <option value="attention">{c.mentor.sortAttention}</option>
            <option value="name">{c.mentor.sortName}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{c.mentor.filterLevel}</span>
          <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">{c.mentor.filterLevel}: {c.app.all}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{c.app.levels[l]}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{c.mentor.filterFamily}</span>
          <select className={inputClass} value={family} onChange={(e) => setFamily(e.target.value)}>
            <option value="">{c.mentor.filterFamily}: {c.app.all}</option>
            {OUTCOME_FAMILIES.filter((f) => f !== 'pathway').map((f) => (
              <option key={f} value={f}>{c.app.families[f]}</option>
            ))}
          </select>
        </label>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-2">
              <th className="py-1 pr-2 font-bold">{c.mentor.student}</th>
              <th className="py-1 pr-2 font-bold">{c.mentor.level}</th>
              <th className="py-1 pr-2 font-bold">{c.mentor.attention}</th>
              <th className="py-1 pr-2 font-bold">{c.mentor.requiredThisWeek}</th>
              <th className="py-1 pr-2 font-bold">{c.mentor.lastTouchpoint}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.student.id} className="border-t border-line">
                <td className="py-2 pr-2">
                  <Link to={`/m/${mentorId}/student/${r.student.id}`} className="font-bold text-indigo underline dark:text-indigo-1">
                    {r.student.display_name}
                  </Link>
                </td>
                <td className="py-2 pr-2">{c.app.levels[r.student.level]}</td>
                <td className="py-2 pr-2">
                  <span className="flex flex-wrap gap-2">
                    {r.flags.length ? r.flags.map((f) => <FlagDot key={f.kind} kind={f.kind} detail={f.detail} />) : <span className="text-teal-ink">{c.mentor.onTrack}</span>}
                  </span>
                </td>
                <td className="py-2 pr-2">{r.required}</td>
                <td className="py-2 pr-2 text-ink-2">{r.lastTp ? format(parseISO(r.lastTp.when), 'EEE MMM d') : c.app.none}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <section aria-labelledby="moves">
        <H2 id="moves">{c.mentor.overnightMoves}</H2>
        {myMoves.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {myMoves.map((m, i) => (
              <li key={i} className="rounded-lg border border-line p-2">{c.mentor.moveLine(idx.students.get(m.student_id)?.display_name ?? m.student_id, m.why)}</li>
            ))}
          </ul>
        ) : (
          <Empty>{c.mentor.noMoves}</Empty>
        )}
      </section>
      {myRequests.length ? (
        <section aria-labelledby="requests">
          <H2 id="requests">{c.mentor.requests}</H2>
          <ul className="mt-2 space-y-1 text-sm">
            {myRequests.map((r, i) => (
              <li key={i} className="rounded-lg border border-line p-2">
                <span className="font-bold">{idx.students.get(r.student_id)?.display_name}</span> · {c.mentor.requestKinds[r.kind]} · {r.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
