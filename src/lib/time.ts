import { addDays, format, parseISO } from 'date-fns'
import type { Weekday } from '@/model'

export const WEEKDAY_INDEX: Record<Weekday, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 }
export const WEEKDAYS_ORDERED: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri']

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export function fromMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd)
}
export function minutesBetween(start: string, end: string): number {
  return toMin(end) - toMin(start)
}
export function weekdayOf(isoDate: string): Weekday {
  const d = parseISO(isoDate).getDay() // 0 Sunday
  const map: Record<number, Weekday> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' }
  return map[d] ?? 'mon'
}
export function dateOf(weekStart: string, day: Weekday): string {
  return format(addDays(parseISO(weekStart), WEEKDAY_INDEX[day]), 'yyyy-MM-dd')
}
export function weekDates(weekStart: string): string[] {
  return WEEKDAYS_ORDERED.map((d) => dateOf(weekStart, d))
}
export function shiftDate(isoDate: string, days: number): string {
  return format(addDays(parseISO(isoDate), days), 'yyyy-MM-dd')
}
export function isoAt(isoDate: string, time: string): string {
  return `${isoDate}T${time}:00.000Z`
}
export function dayPart(iso: string): string {
  return iso.slice(0, 10)
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(dayPart(b)).getTime() - parseISO(dayPart(a)).getTime()) / 86_400_000)
}
/** School days between two dates (Mon to Fri), exclusive of a, inclusive of b. */
export function schoolDaysBetween(a: string, b: string): number {
  let n = 0
  let d = parseISO(dayPart(a))
  const end = parseISO(dayPart(b))
  while (d < end) {
    d = addDays(d, 1)
    const wd = d.getDay()
    if (wd >= 1 && wd <= 5) n++
  }
  return n
}
export function formatTime12(t: string): string {
  const m = toMin(t)
  const h = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${mm} ${h < 12 ? 'am' : 'pm'}`
}
