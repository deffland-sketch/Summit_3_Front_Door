import type { Offering, Sandbox, TracePart } from '@/model'
import { en } from '@/copy/en'
import { byId } from '@/lib'
import { weekDates } from '@/lib/time'
import { subjectOfCourse } from '@/graph/catalog'
import { needs } from './needs'
import { adultFree, collisionsFor, placeFree } from './collisions'
import { BLOCKS, type WorkshopProposal } from './types'

const SUBJECT_COURSE_PREFIX: Record<string, string[]> = {
  math: ['crs_im1', 'crs_im2', 'crs_im3'],
  science: ['crs_bio', 'crs_chem', 'crs_phys'],
  english: ['crs_aplang', 'crs_aplit'],
  history: ['crs_apworld', 'crs_apush'],
}

/**
 * Group students by lesson where the assignment is needs_workshop, or active with a Required need,
 * and propose DI workshops (Spec 6). Lessons that already have a published workshop this week are skipped.
 */
export function proposeWorkshops(snap: Sandbox, opts: { weekStart?: string; asOf?: string } = {}): WorkshopProposal[] {
  const weekStart = opts.weekStart ?? snap.meta.week_start
  const dates = weekDates(weekStart)
  const lessons = byId(snap.lessons)
  const units = byId(snap.units)
  const settings = snap.settings
  const groups = new Map<string, Set<string>>()
  const needEvidence = new Map<string, string[]>()

  for (const a of snap.assignments) {
    if (a.status === 'needs_workshop') groups.set(a.lesson_id, new Set([...(groups.get(a.lesson_id) ?? []), a.student_id]))
  }
  for (const s of snap.students) {
    for (const n of needs(s.id, snap, { weekStart, asOf: opts.asOf })) {
      if (n.kind === 'required' && n.lesson_id) {
        groups.set(n.lesson_id, new Set([...(groups.get(n.lesson_id) ?? []), s.id]))
        if (n.evidence_id) needEvidence.set(n.lesson_id, [...(needEvidence.get(n.lesson_id) ?? []), n.evidence_id])
      }
    }
  }

  const alreadyPublished = new Set(
    snap.offerings.filter((o) => o.status === 'published' && o.kind === 'workshop' && o.lesson_id && o.day >= dates[0] && o.day <= dates[4]).map((o) => o.lesson_id!),
  )
  const existingSlots = snap.plans.filter((p) => p.week_start === weekStart).flatMap((p) => p.slots)
  const slotsByStudent = new Map<string, typeof existingSlots>()
  for (const sl of existingSlots) {
    const plan = snap.plans.find((p) => p.id === sl.plan_id)!
    slotsByStudent.set(plan.student_id, [...(slotsByStudent.get(plan.student_id) ?? []), sl])
  }

  const proposals: WorkshopProposal[] = []
  const used: Offering[] = []
  let n = 0
  for (const [lessonId, studentSet] of groups) {
    if (alreadyPublished.has(lessonId)) continue
    const lesson = lessons.get(lessonId)
    if (!lesson) continue
    const unit = units.get(lesson.unit_id)
    const courseId = unit?.course_id ?? 'crs_im1'
    const subject = subjectOfCourse(courseId)
    const students = [...studentSet]
    const chunks: string[][] = []
    if (students.length >= settings.grouping_threshold) {
      const size = settings.workshop_size.max
      for (let i = 0; i < students.length; i += size) chunks.push(students.slice(i, i + size))
      // A trailing chunk below the minimum joins the previous one when it fits.
      if (chunks.length > 1 && chunks[chunks.length - 1].length < settings.workshop_size.min) {
        const last = chunks.pop()!
        chunks[chunks.length - 1].push(...last)
      }
    } else {
      chunks.push(students)
    }
    for (const chunk of chunks) {
      const kind: WorkshopProposal['kind'] = chunk.length >= settings.grouping_threshold ? 'workshop' : 'conference'
      const experts = snap.adults.filter((a) => a.capacities.includes('content_expert') && a.subjects.some((c) => SUBJECT_COURSE_PREFIX[subject].includes(c)))
      const places = snap.places.filter((p) => (kind === 'workshop' ? p.kind === 'classroom' && p.capacity >= chunk.length : p.kind === 'nook' || p.kind === 'classroom'))
      let best: { day: string; start: string; end: string; adult: string; place: string; collisions: { student_id: string; reason: string }[] } | null = null
      const considered: TracePart['candidates'] = []
      for (const day of dates) {
        for (const b of BLOCKS) {
          const adult = experts.find((a) => adultFree(a.id, day, b.start, b.end, snap, used))
          if (!adult) {
            considered.push({ id: `${day} ${b.start}`, label: `${day} ${b.start}`, score: null, lost_because: 'no content expert free' })
            continue
          }
          const place = places.find((p) => placeFree(p.id, day, b.start, b.end, snap, used))
          if (!place) {
            considered.push({ id: `${day} ${b.start}`, label: `${day} ${b.start}`, score: null, lost_because: 'no room free' })
            continue
          }
          const collisions: { student_id: string; reason: string }[] = []
          for (const sid of chunk) {
            const st = snap.students.find((s) => s.id === sid)!
            for (const r of collisionsFor(st, day, b.start, b.end, slotsByStudent.get(sid) ?? [], snap).filter((r) => r === 'protected' || r === 'placement' || r.startsWith('life'))) {
              collisions.push({ student_id: sid, reason: r })
            }
          }
          considered.push({ id: `${day} ${b.start}`, label: `${day} ${b.start} with ${adult.display_name} in ${place.name}`, score: -collisions.length, lost_because: collisions.length ? `${collisions.length} collisions` : null })
          if (!best || collisions.length < best.collisions.length) best = { day, start: b.start, end: b.end, adult: adult.id, place: place.id, collisions }
          if (collisions.length === 0) break
        }
        if (best && best.collisions.length === 0) break
      }
      n++
      const id = `prop_${lessonId}_${n}`
      if (best) {
        used.push({
          id,
          experience_type: 'DI',
          kind,
          title: lesson.title,
          lesson_id: lessonId,
          outcomes_served: lesson.outcomes_served,
          adult_ids: [best.adult],
          place_id: best.place,
          day: best.day,
          start: best.start,
          end: best.end,
          capacity_min: settings.workshop_size.min,
          capacity_max: settings.workshop_size.max,
          entry: 'required',
          source: 'front_door',
          source_ref: id,
          standing: false,
          status: 'published',
        })
      }
      proposals.push({
        id,
        lesson_id: lessonId,
        lesson_title: lesson.title,
        course_id: courseId,
        subject,
        student_ids: chunk,
        adult_id: best?.adult ?? null,
        place_id: best?.place ?? null,
        day: best?.day ?? dates[0],
        start: best?.start ?? BLOCKS[0].start,
        end: best?.end ?? BLOCKS[0].end,
        why:
          (kind === 'workshop' ? en.proposals.why(lesson.title, chunk.length) : en.proposals.conference(lesson.title, chunk.length)) +
          ' ' +
          (best && best.collisions.length ? en.proposals.collisions(best.collisions.length) : en.proposals.noCollisions),
        collisions: best?.collisions ?? [],
        kind,
        trace: {
          evidence_ids: needEvidence.get(lessonId) ?? [],
          settings: { grouping_threshold: settings.grouping_threshold, workshop_min: settings.workshop_size.min, workshop_max: settings.workshop_size.max },
          edges: [],
          candidates: (() => {
            const all = considered.map((c) => (best && c.id === `${best.day} ${best.start}` ? { ...c, lost_because: null } : c.lost_because ? c : { ...c, lost_because: 'a time with fewer collisions came first' }))
            // The pick always shows, then the first eleven losers.
            return [...all.filter((c) => c.lost_because === null), ...all.filter((c) => c.lost_because !== null)].slice(0, 12)
          })(),
          decision: best ? `${chunk.length} students share ${lesson.title}; ${best.day} ${best.start} had ${best.collisions.length} collisions` : `no free adult and room this week`,
        },
      })
    }
  }
  return proposals.sort((a, b) => b.student_ids.length - a.student_ids.length)
}

/** Turn an accepted proposal into a published Offering. */
export function offeringFromProposal(p: WorkshopProposal, snap: Sandbox, overrides: Partial<Offering> = {}): Offering {
  const lesson = snap.lessons.find((l) => l.id === p.lesson_id)!
  return {
    id: `off_ws_${p.lesson_id}_${p.day}_${p.start.replace(':', '')}`,
    experience_type: p.kind === 'workshop' ? 'DI' : 'PF',
    kind: p.kind,
    title: lesson.title,
    lesson_id: p.lesson_id,
    outcomes_served: lesson.outcomes_served,
    adult_ids: p.adult_id ? [p.adult_id] : [],
    place_id: p.place_id ?? snap.places[0].id,
    day: p.day,
    start: p.start,
    end: p.end,
    capacity_min: p.kind === 'workshop' ? snap.settings.workshop_size.min : 1,
    capacity_max: p.kind === 'workshop' ? snap.settings.workshop_size.max : 2,
    entry: 'required',
    source: 'front_door',
    source_ref: p.id,
    standing: false,
    status: 'published',
    ...overrides,
  }
}
