import { useCopy } from '@/copy'

/** A student's best score against the expectation for their level, shown as a band, never a grade. */
export function OutcomeBand({ score, expected, next, levelName, nextName }: { score: number | null; expected: number; next: number | null; levelName: string; nextName: string | null }) {
  const c = useCopy()
  const pct = (v: number) => `${((v - 1) / 7) * 100}%`
  return (
    <div>
      <div className="relative h-3 w-full rounded-full bg-tan-grey-2" role="img" aria-label={score !== null ? c.progress.bandLabel(score, expected) : c.progress.noEvidence}>
        <div className="absolute top-0 h-3 rounded-l-full bg-teal" style={{ width: score !== null ? pct(score) : '0%' }} />
        <span aria-hidden="true" className="absolute -top-1 h-5 w-0.5 bg-indigo" style={{ left: pct(expected) }} />
        {next !== null ? <span aria-hidden="true" className="absolute -top-1 h-5 w-0.5 bg-orange" style={{ left: pct(next) }} /> : null}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-2">
        <span>{score !== null ? c.progress.scoreOf8(score) : c.app.none}</span>
        <span>
          {c.progress.expectation(levelName)} {expected}
          {next !== null && nextName ? ` · ${c.progress.nextLevel(nextName)} ${next}` : ''}
        </span>
      </div>
    </div>
  )
}
