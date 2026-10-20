import type { Evidence, Offering, Sandbox, Slot, TraceEdge, TracePart } from '@/model'
import { en } from '@/copy/en'
import { byId } from '@/lib'
import { formatTime12, shortDate, weekDates } from '@/lib/time'
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

/** A hard collision keeps a time off the table (Spec 6 rule 7); a soft one is listed on the card and moved aside on accept. */
const isHard = (r: string) => r === 'protected' || r === 'placement' || r.startsWith('life')

interface Member {
  student_id: string
  /** The lesson the need named before any prerequisite redirect. */
  from_lesson: string
  evidence: Evidence | null
}

/**
 * Group students by lesson where the assignment is needs_workshop, or active with a Required need,
 * and propose DI workshops or 1:1 conferences (Spec 6 rules 1 to 9). Lessons that already have a
 * published workshop this week are skipped.
 */
export function proposeWorkshops(snap: Sandbox, opts: { weekStart?: string; asOf?: string } = {}): WorkshopProposal[] {
  const weekStart = opts.weekStart ?? snap.meta.week_start
  const dates = weekDates(weekStart)
  const lessons = byId(snap.lessons)
  const units = byId(snap.units)
  const students = byId(snap.students)
  const settings = snap.settings
  const threshold = settings.grouping_threshold

  // Mastered lessons per student, for the prerequisite rule (rule 6).
  const mastered = new Map<string, Set<string>>()
  for (const a of snap.assignments) {
    if (a.status === 'mastered' || a.status === 'skipped_on_mastery') mastered.set(a.student_id, new Set([...(mastered.get(a.student_id) ?? []), a.lesson_id]))
  }
  const hasMastered = (sid: string, lessonId: string) => mastered.get(sid)?.has(lessonId) ?? false
  /** The first prerequisite the student has not mastered, following the chain down at most five steps. */
  const openPrerequisite = (sid: string, lessonId: string, depth = 0): string | null => {
    const lesson = lessons.get(lessonId)
    if (!lesson || depth > 5) return null
    for (const pid of lesson.prerequisites) {
      if (hasMastered(sid, pid)) continue
      return openPrerequisite(sid, pid, depth + 1) ?? pid
    }
    return null
  }

  // Rules 1 and 6: collect members per lesson, then redirect each student with an open prerequisite to that prerequisite.
  const raw = new Map<string, Member[]>()
  const addRaw = (lessonId: string, m: Member) => {
    const list = raw.get(lessonId) ?? []
    if (!list.some((x) => x.student_id === m.student_id)) raw.set(lessonId, [...list, m])
  }
  const latestKira = (sid: string, lessonId: string): Evidence | null =>
    snap.evidence.filter((e) => e.student_id === sid && e.source_ref === lessonId && typeof e.value === 'number').sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))[0] ?? null
  for (const a of snap.assignments) {
    if (a.status === 'needs_workshop') addRaw(a.lesson_id, { student_id: a.student_id, from_lesson: a.lesson_id, evidence: latestKira(a.student_id, a.lesson_id) })
  }
  for (const s of snap.students) {
    for (const n of needs(s.id, snap, { weekStart, asOf: opts.asOf })) {
      if (n.kind === 'required' && n.lesson_id) addRaw(n.lesson_id, { student_id: s.id, from_lesson: n.lesson_id, evidence: n.evidence_id ? (snap.evidence.find((e) => e.id === n.evidence_id) ?? null) : null })
    }
  }
  const groups = new Map<string, Member[]>()
  const redirects = new Map<string, TraceEdge[]>()
  for (const [lessonId, members] of raw) {
    for (const m of members) {
      const gap = openPrerequisite(m.student_id, lessonId)
      const target = gap ?? lessonId
      const list = groups.get(target) ?? []
      if (!list.some((x) => x.student_id === m.student_id)) groups.set(target, [...list, m])
      if (gap) redirects.set(target, [...(redirects.get(target) ?? []), { from: lessonId, to: gap, type: 'prerequisite', source: 'catalog' }])
    }
  }

  const alreadyPublished = new Set(
    snap.offerings.filter((o) => o.status === 'published' && o.kind === 'workshop' && o.lesson_id && o.day >= dates[0] && o.day <= dates[4]).map((o) => o.lesson_id!),
  )
  const published = snap.offerings.filter((o) => o.status === 'published' && o.day >= dates[0] && o.day <= dates[4])
  const existingSlots = snap.plans.filter((p) => p.week_start === weekStart).flatMap((p) => p.slots)
  const slotsByStudent = new Map<string, Slot[]>()
  for (const sl of existingSlots) {
    const plan = snap.plans.find((p) => p.id === sl.plan_id)!
    slotsByStudent.set(plan.student_id, [...(slotsByStudent.get(plan.student_id) ?? []), sl])
  }
  const live = (s: Slot) => s.status !== 'cancelled' && s.status !== 'moved'
  const freeFor = (sid: string, o: Offering) => !(slotsByStudent.get(sid) ?? []).some((s) => live(s) && s.day === o.day && s.start < o.end && o.start < s.end)
  const fill = new Map<string, number>()
  for (const s of existingSlots) if (live(s) && s.offering_id) fill.set(s.offering_id, (fill.get(s.offering_id) ?? 0) + 1)
  /** Where a student goes if the expert declines (rule 9): an existing 1:1 conference on the lesson, else the earliest practice block with room. */
  const fallbackFor = (sid: string, lessonId: string, afterDay: string): string => {
    const conf = published.find((o) => o.kind === 'conference' && o.lesson_id === lessonId && o.day >= afterDay && (fill.get(o.id) ?? 0) < o.capacity_max && freeFor(sid, o))
    if (conf) return en.proposals.fallbackConference(shortDate(conf.day), formatTime12(conf.start))
    const pb = published.filter((o) => o.kind === 'practice' && o.experience_type === 'PF' && o.day >= afterDay && (fill.get(o.id) ?? 0) < o.capacity_max).find((o) => freeFor(sid, o))
    if (pb) return en.proposals.fallbackPractice(pb.title, shortDate(pb.day), formatTime12(pb.start))
    return en.proposals.fallbackNone
  }

  const proposals: WorkshopProposal[] = []
  const used: Offering[] = []
  let n = 0

  /** Search the week for a time with a free expert and room and no hard collision for any member; soft collisions are counted. */
  const findTime = (members: Member[], experts: Sandbox['adults'], places: Sandbox['places']) => {
    const considered: TracePart['candidates'] = []
    let best: { day: string; start: string; end: string; adult: string; place: string; collisions: { student_id: string; reason: string }[] } | null = null
    let hardBlockers = new Map<string, number>()
    for (const day of dates) {
      if (day <= snap.meta.today && dates.indexOf(day) < 4) continue
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
        const hard: { student_id: string; reason: string }[] = []
        const soft: { student_id: string; reason: string }[] = []
        for (const m of members) {
          const st = students.get(m.student_id)!
          for (const r of collisionsFor(st, day, b.start, b.end, slotsByStudent.get(m.student_id) ?? [], snap)) (isHard(r) ? hard : soft).push({ student_id: m.student_id, reason: r })
        }
        if (hard.length) {
          const who = [...new Set(hard.map((h) => h.student_id))]
          for (const sid of who) hardBlockers.set(sid, (hardBlockers.get(sid) ?? 0) + 1)
          considered.push({ id: `${day} ${b.start}`, label: `${day} ${b.start} with ${adult.display_name} in ${place.name}`, score: null, lost_because: `overlaps ${hard[0].reason === 'placement' ? 'a placement' : hard[0].reason === 'protected' ? 'protected time' : 'a life constraint'} for ${who.map((sid) => students.get(sid)?.display_name).join(', ')}` })
          continue
        }
        considered.push({ id: `${day} ${b.start}`, label: `${day} ${b.start} with ${adult.display_name} in ${place.name}`, score: -soft.length, lost_because: soft.length ? `${soft.length} collisions` : null })
        if (!best || soft.length < best.collisions.length) best = { day, start: b.start, end: b.end, adult: adult.id, place: place.id, collisions: soft }
        if (soft.length === 0) break
      }
      if (best && best.collisions.length === 0) break
    }
    hardBlockers = new Map([...hardBlockers].sort((a, b) => b[1] - a[1]))
    return { best, considered, hardBlockers }
  }

  const emit = (lessonId: string, members: Member[], kind: WorkshopProposal['kind'], splitNote: string | null) => {
    const lesson = lessons.get(lessonId)!
    const unit = units.get(lesson.unit_id)
    const courseId = unit?.course_id ?? 'crs_im1'
    const subject = subjectOfCourse(courseId)
    const experts = snap.adults.filter((a) => a.capacities.includes('content_expert') && a.subjects.some((c) => SUBJECT_COURSE_PREFIX[subject].includes(c)))
    const places = snap.places.filter((p) => (kind === 'workshop' ? p.kind === 'classroom' && p.capacity >= members.length : p.kind === 'nook' || p.kind === 'classroom'))
    const { best, considered, hardBlockers } = findTime(members, experts, places)
    // Rule 7: when no time is free of hard collisions for everyone, the student who blocks most times goes to a conference of their own.
    if (!best && members.length > 1 && hardBlockers.size) {
      const [blocker] = [...hardBlockers.keys()]
      emit(lessonId, members.filter((m) => m.student_id === blocker), 'conference', en.proposals.splitHard(students.get(blocker)?.display_name ?? blocker))
      emitGroup(lessonId, members.filter((m) => m.student_id !== blocker), splitNote)
      return
    }
    n++
    const id = `prop_${lessonId}_${n}`
    if (best) {
      used.push({ id, experience_type: kind === 'workshop' ? 'DI' : 'PF', kind, title: lesson.title, lesson_id: lessonId, outcomes_served: lesson.outcomes_served, adult_ids: [best.adult], place_id: best.place, day: best.day, start: best.start, end: best.end, capacity_min: kind === 'workshop' ? settings.workshop_size.min : 1, capacity_max: kind === 'workshop' ? settings.workshop_size.max : 2, entry: 'required', source: 'front_door', source_ref: id, standing: false, status: 'published' })
    }
    const scores = members.map((m) => m.evidence).filter((e): e is Evidence => e !== null && typeof e.value === 'number')
    const values = scores.map((e) => e.value as number)
    const days = scores.map((e) => e.recorded_at.slice(0, 10)).sort()
    const sources = [...new Set(scores.map((e) => e.source))]
    const rationale = scores.length
      ? en.proposals.rationale(members.length, lesson.title, sources.join(' and '), Math.min(...values), Math.max(...values), shortDate(days[0]), shortDate(days[days.length - 1]), settings.required_rule.mastery_below_pct)
      : en.proposals.rationaleAssigned(members.length, lesson.title)
    const if_declined = members.map((m) => ({ student_id: m.student_id, text: fallbackFor(m.student_id, lessonId, best?.day ?? snap.meta.today) }))
    const why = [rationale, splitNote, best && best.collisions.length ? en.proposals.collisions(best.collisions.length) : best ? en.proposals.noCollisions : en.proposals.noTime].filter(Boolean).join(' ')
    const evidenceIds = members.map((m) => m.evidence?.id).filter((x): x is string => Boolean(x))
    proposals.push({
      id,
      lesson_id: lessonId,
      lesson_title: lesson.title,
      course_id: courseId,
      subject,
      student_ids: members.map((m) => m.student_id),
      adult_id: best?.adult ?? null,
      place_id: best?.place ?? null,
      day: best?.day ?? dates[0],
      start: best?.start ?? BLOCKS[0].start,
      end: best?.end ?? BLOCKS[0].end,
      why,
      rationale,
      if_declined,
      collisions: best?.collisions ?? [],
      kind,
      trace: {
        evidence_ids: evidenceIds,
        settings: { grouping_threshold: threshold, workshop_min: settings.workshop_size.min, workshop_max: settings.workshop_size.max, mastery_below_pct: settings.required_rule.mastery_below_pct },
        edges: (redirects.get(lessonId) ?? []).filter((e) => members.some((m) => m.from_lesson === e.from)),
        candidates: (() => {
          const all = considered.map((c) => (best && c.id === `${best.day} ${best.start}` ? { ...c, lost_because: null } : c.lost_because ? c : { ...c, lost_because: 'a time with fewer collisions came first' }))
          // The pick always shows, then the first eleven losers.
          return [...all.filter((c) => c.lost_because === null), ...all.filter((c) => c.lost_because !== null)].slice(0, 12)
        })(),
        decision: best
          ? `${members.length} ${members.length === 1 ? 'student shares' : 'students share'} ${lesson.title} with every prerequisite mastered; ${best.day} ${best.start} overlaps no placement, protected time, or life constraint and has ${best.collisions.length} soft collisions; ${kind === 'workshop' ? `${members.length} is at or above the threshold of ${threshold}` : `${members.length} is below the threshold of ${threshold}, so a 1:1 conference`}`
          : `no time this week with a free expert and room that overlaps no placement, protected time, or life constraint`,
      },
    })
  }

  /** Rules 2 and 8: a group at or above threshold becomes one workshop (or several by workshop size); anything below becomes one 1:1 conference per student. */
  function emitGroup(lessonId: string, members: Member[], splitNote: string | null) {
    if (members.length >= threshold) {
      const size = settings.workshop_size.max
      const chunks: Member[][] = []
      for (let i = 0; i < members.length; i += size) chunks.push(members.slice(i, i + size))
      // A trailing chunk below the minimum joins the previous one; one still below threshold becomes conferences.
      if (chunks.length > 1 && chunks[chunks.length - 1].length < settings.workshop_size.min) chunks[chunks.length - 2].push(...chunks.pop()!)
      for (const chunk of chunks) {
        if (chunk.length >= threshold) emit(lessonId, chunk, 'workshop', splitNote)
        else emitGroup(lessonId, chunk, splitNote)
      }
    } else {
      for (const m of members) emit(lessonId, [m], 'conference', m.from_lesson !== lessonId ? en.proposals.splitPrerequisite(1, lessons.get(m.from_lesson)?.title ?? m.from_lesson) : null)
    }
  }

  for (const [lessonId, members] of groups) {
    if (alreadyPublished.has(lessonId) || !lessons.get(lessonId)) continue
    const redirected = members.filter((m) => m.from_lesson !== lessonId)
    const splitNote = redirected.length ? en.proposals.splitPrerequisite(redirected.length, [...new Set(redirected.map((m) => lessons.get(m.from_lesson)?.title ?? m.from_lesson))].join(', ')) : null
    emitGroup(lessonId, members, splitNote)
  }
  return proposals.sort((a, b) => Number(b.kind === 'workshop') - Number(a.kind === 'workshop') || b.student_ids.length - a.student_ids.length)
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
