import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'
import { useSnapshot, useToday } from './hooks'
import { Card, H1, H2, inputClass } from '@/components/ui'
import { TypeLegend } from '@/components/WeekGrid'

export function Landing() {
  const c = useCopy()
  const snap = useSnapshot()
  const today = useToday()
  const [q, setQ] = useState('')
  const [rwOnly, setRwOnly] = useState(false)
  const students = useMemo(() => {
    const plans = new Map(snap.plans.filter((p) => p.week_start === snap.meta.week_start).map((p) => [p.student_id, p]))
    return snap.students
      .filter((s) => s.display_name.toLowerCase().includes(q.toLowerCase()))
      .filter((s) => !rwOnly || plans.get(s.id)?.slots.some((x) => x.day === today && x.experience_type === 'RW'))
      .map((s) => ({ s, rw: plans.get(s.id)?.slots.some((x) => x.day === today && x.experience_type === 'RW') ?? false }))
  }, [snap, q, rwOnly, today])
  const mentors = snap.adults.filter((a) => a.capacities.includes('mentor'))
  const experts = snap.adults.filter((a) => (a.capacities.includes('content_expert') || a.capacities.includes('facilitator') || a.capacities.includes('system_architect')) && !a.capacities.includes('mentor') && !a.capacities.includes('partner'))
  return (
    <main id="main" className="mx-auto max-w-[1100px] px-4 py-8">
      <H1>{c.landing.title}</H1>
      <p className="mt-2 max-w-prose">{c.landing.lede}</p>
      <p className="mt-1 text-sm text-ink-2">{c.landing.sandboxNote}</p>
      <p className="mt-3">
        <Link to="/overview" className="inline-block rounded-lg bg-orange px-4 py-2 text-sm font-bold text-black hover:bg-orange-1">
          {c.overview.title}
        </Link>
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card as="section" accent="border-t-indigo">
          <H2 id="pick-student">{c.landing.pickStudent}</H2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input aria-label={c.landing.search} placeholder={c.landing.search} value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} md:max-w-xs`} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rwOnly} onChange={(e) => setRwOnly(e.target.checked)} /> {c.landing.withRwToday}
            </label>
          </div>
          <ul className="mt-3 max-h-96 divide-y divide-line overflow-y-auto">
            {students.map(({ s, rw }) => (
              <li key={s.id}>
                <Link to={`/s/${s.id}`} className="flex items-center justify-between py-2 text-sm hover:bg-indigo-2">
                  <span className="font-bold">{s.display_name}</span>
                  <span className="text-ink-2">
                    {c.app.levels[s.level]}
                    {rw ? ' · RW' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card as="section" accent="border-t-teal">
            <H2 id="pick-mentor">{c.landing.pickMentor}</H2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {mentors.map((m) => (
                <li key={m.id}>
                  <Link to={`/m/${m.id}`} className="inline-block rounded-lg border border-teal px-3 py-1.5 text-sm font-bold text-teal-ink hover:bg-teal-2">
                    {m.display_name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card as="section" accent="border-t-orange">
            <H2 id="pick-expert">{c.landing.pickExpert}</H2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {experts.map((m) => (
                <li key={m.id}>
                  <Link to={`/x/${m.id}`} className="inline-block rounded-lg border border-orange px-3 py-1.5 text-sm font-bold text-orange-ink hover:bg-orange-2">
                    {m.display_name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card as="section" accent="border-t-brown">
            <H2 id="pick-lead">{c.landing.pickLead}</H2>
            <Link to="/l" className="mt-2 inline-block rounded-lg bg-brown px-3 py-1.5 text-sm font-bold text-white">
              {c.app.lead}
            </Link>
          </Card>
        </div>
      </div>
      <div className="mt-8">
        <TypeLegend />
      </div>
    </main>
  )
}
