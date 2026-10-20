import { useMemo } from 'react'
import { useSandbox } from '@/store'
import { useUi } from '@/store/ui'
import type { Sandbox } from '@/model'
import { byId } from '@/lib'

/** The whole snapshot as one memoized object (re-created when any collection changes). */
export function useSnapshot(): Sandbox {
  const s = useSandbox((st) => st)
  return useMemo(
    () => ({
      meta: s.meta, students: s.students, adults: s.adults, outcomes: s.outcomes, offerings: s.offerings, plans: s.plans, evidence: s.evidence, touchpoints: s.touchpoints, courses: s.courses, units: s.units, lessons: s.lessons, assignments: s.assignments, places: s.places, groups: s.groups, settings: s.settings, futre: s.futre, gathering_log: s.gathering_log,
    }),
    [s.meta, s.students, s.adults, s.outcomes, s.offerings, s.plans, s.evidence, s.touchpoints, s.courses, s.units, s.lessons, s.assignments, s.places, s.groups, s.settings, s.futre, s.gathering_log],
  )
}

export function useToday(): string {
  const override = useUi((u) => u.todayOverride)
  const today = useSandbox((s) => s.meta.today)
  return override ?? today
}

export function useIndexes() {
  const snap = useSnapshot()
  return useMemo(
    () => ({
      offerings: byId(snap.offerings),
      places: byId(snap.places),
      adults: byId(snap.adults),
      outcomes: byId(snap.outcomes),
      lessons: byId(snap.lessons),
      units: byId(snap.units),
      courses: byId(snap.courses),
      students: byId(snap.students),
    }),
    [snap],
  )
}

export function useStudentData(studentId: string) {
  const snap = useSnapshot()
  const today = useToday()
  return useMemo(() => {
    const student = snap.students.find((s) => s.id === studentId)
    const plan = snap.plans.find((p) => p.student_id === studentId && p.week_start === snap.meta.week_start)
    const mentor = snap.adults.find((a) => a.id === student?.mentor_id)
    const futre = snap.futre.find((f) => f.student_id === studentId)
    const evidence = snap.evidence.filter((e) => e.student_id === studentId)
    const touchpoints = snap.touchpoints.filter((t) => t.student_id === studentId)
    const assignments = snap.assignments.filter((a) => a.student_id === studentId)
    return { student, plan, mentor, futre, evidence, touchpoints, assignments, today, snap }
  }, [snap, studentId, today])
}
