import { useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useIndexes, useStudentData } from '@/app/hooks'
import { Button, Empty, H1, H2 } from '@/components/ui'
import { dayName } from '@/components/WeekGrid'
import { proposeWorkshops } from '@/engine'
import { repos } from '@/store'
import { useUi } from '@/store/ui'
import { formatTime12 } from '@/lib/time'
import type { Assignment } from '@/model'

const STATUS_STYLE: Record<string, string> = {
  mastered: 'bg-teal text-white',
  skipped_on_mastery: 'bg-teal-1 text-black',
  active: 'bg-orange text-black',
  practiced: 'bg-orange-1 text-black',
  needs_workshop: 'bg-indigo text-white',
  queued: 'border border-line bg-surface',
}

/** LessonMap: each course as a map of lessons. */
export function Courses({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { assignments, plan, snap } = useStudentData(studentId)
  const idx = useIndexes()
  const [openLesson, setOpenLesson] = useState<string | null>(null)
  const toast = useUi((u) => u.toast)
  const proposals = useMemo(() => proposeWorkshops(snap).filter((p) => p.student_ids.includes(studentId)), [snap, studentId])
  const byCourse = useMemo(() => {
    const m = new Map<string, Assignment[]>()
    for (const a of assignments) {
      const l = idx.lessons.get(a.lesson_id)
      const u = l ? idx.units.get(l.unit_id) : null
      if (!u) continue
      m.set(u.course_id, [...(m.get(u.course_id) ?? []), a])
    }
    return m
  }, [assignments, idx])
  if (!assignments.length) return <Empty>{c.app.none}</Empty>
  const weekSlots = plan?.slots ?? []
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.courses.title} <Explain id="student.courses" /></H1>
        <p className="text-sm text-ink-2">{c.courses.lede}</p>
      </div>
      <ul className="flex flex-wrap gap-3 text-xs" aria-label="Legend">
        {Object.entries(c.courses.legend).map(([k, label]) => (
          <li key={k} className="flex items-center gap-1">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${STATUS_STYLE[k === 'workshop' ? 'needs_workshop' : k === 'skipped' ? 'skipped_on_mastery' : k]}`} /> {label}
          </li>
        ))}
      </ul>
      {[...byCourse.entries()].map(([courseId, asgs]) => {
        const course = idx.courses.get(courseId)!
        const units = [...new Set(asgs.map((a) => idx.lessons.get(a.lesson_id)!.unit_id))].map((uid) => idx.units.get(uid)!).sort((a, b) => a.sequence - b.sequence)
        return (
          <section key={courseId} aria-labelledby={`course-${courseId}`}>
            <H2 id={`course-${courseId}`}>{course.title}</H2>
            {units.map((u) => (
              <div key={u.id} className="mt-2">
                <p className="text-sm text-ink-2">
                  {c.courses.unit} {u.sequence}: {u.title}
                </p>
                <ol className="mt-1 flex flex-wrap gap-2">
                  {asgs
                    .filter((a) => idx.lessons.get(a.lesson_id)!.unit_id === u.id)
                    .sort((a, b) => idx.lessons.get(a.lesson_id)!.sequence - idx.lessons.get(b.lesson_id)!.sequence)
                    .map((a) => {
                      const l = idx.lessons.get(a.lesson_id)!
                      const proposed = proposals.find((p) => p.lesson_id === l.id)
                      const slot = weekSlots.find((s) => s.offering_id && idx.offerings.get(s.offering_id)?.lesson_id === l.id)
                      const status = proposed ? 'needs_workshop' : a.status
                      const isOpen = openLesson === l.id
                      return (
                        <li key={a.id} className="min-w-[8rem] flex-1">
                          <button type="button" aria-expanded={isOpen} onClick={() => setOpenLesson(isOpen ? null : l.id)} className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${STATUS_STYLE[status]}`}>
                            <span className="block text-xs opacity-80">{l.sequence}</span>
                            <span className="block font-bold">{l.title}</span>
                          </button>
                          {isOpen ? (
                            <div className="mt-1 rounded-lg border border-line p-2 text-sm">
                              <p className="text-ink-2">{c.courses.minutes(l.estimated_minutes)} · {c.courses.legend[status === 'needs_workshop' ? 'workshop' : status === 'skipped_on_mastery' ? 'skipped' : status] ?? status}</p>
                              <p>
                                <span className="font-bold">{c.courses.builds}:</span> {l.outcomes_served.map((o) => idx.outcomes.get(o)?.name).filter(Boolean).join('; ')}
                              </p>
                              {slot ? (
                                <p className="font-bold text-indigo dark:text-indigo-1">{c.courses.workshopAt(dayName(slot.day), formatTime12(slot.start))}</p>
                              ) : proposed ? (
                                <p className="font-bold text-indigo dark:text-indigo-1">{c.courses.legend.workshop}: {c.courses.workshopAt(dayName(proposed.day), formatTime12(proposed.start))}</p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {l.kira_ref ? (
                                  <a className="rounded-lg border border-indigo px-3 py-1.5 text-sm font-bold text-indigo dark:text-indigo-1" href={`https://kira.example/lesson/${l.kira_ref}`} target="_blank" rel="noreferrer">
                                    {c.courses.openInKira}
                                  </a>
                                ) : null}
                                {a.status === 'active' ? (
                                  <Button kind="secondary" onClick={() => { repos.collection('assignments').upsert({ ...a, status: 'practiced' }); toast(c.courses.markedPracticed) }}>
                                    {c.courses.markPracticed}
                                  </Button>
                                ) : null}
                              </div>
                              {a.status === 'active' ? <p className="mt-1 text-xs text-ink-2">{c.courses.practicedNote}</p> : null}
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                </ol>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
