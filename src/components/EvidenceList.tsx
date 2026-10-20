import type { Adult, Evidence, Student } from '@/model'
import { useCopy } from '@/copy'
import { format, parseISO } from 'date-fns'

const SOURCE_LABEL: Record<string, string> = {
  kira: 'Kira', teach_to_one: 'Teach to One', gradebook: 'Gradebook', assessment: 'Assessment', futre: 'Futre', adult_note: 'Adult note', student_reflection: 'Reflection', exhibition: 'Exhibition', external: 'External',
}

export function evidenceValue(e: Evidence): string {
  if (e.value_kind === 'mastery_pct') return `${Math.round(Number(e.value))}%`
  if (e.value_kind === 'score_1_8') return `${e.value} of 8`
  return String(e.value)
}

export function EvidenceList({ rows, adults, students }: { rows: Evidence[]; adults?: Adult[]; students?: Student[] }) {
  const c = useCopy()
  if (!rows.length) return <p className="text-sm text-ink-2">{c.progress.noEvidence}</p>
  const who = (id: string) => adults?.find((a) => a.id === id)?.display_name ?? students?.find((s) => s.id === id)?.display_name ?? (id === 'system' ? 'System' : id)
  return (
    <ul className="divide-y divide-line text-sm">
      {rows
        .slice()
        .sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1))
        .map((e) => (
          <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
            <span>
              <span className="font-bold">{evidenceValue(e)}</span> · {SOURCE_LABEL[e.source] ?? e.source}
              {e.source_ref && e.value_kind !== 'text' ? ` · ${e.source_ref.replace(/^(kira:|tto:|unit:)/, '')}` : ''}
              <span className="text-ink-2"> · {who(e.recorded_by)}</span>
            </span>
            <span className="text-ink-2">
              {format(parseISO(e.recorded_at), 'MMM d')}
              {e.artifact_url ? (
                <>
                  {' · '}
                  <a className="text-indigo underline dark:text-indigo-1" href={e.artifact_url} target="_blank" rel="noreferrer">
                    {c.progress.openArtifact}
                  </a>
                </>
              ) : null}
            </span>
          </li>
        ))}
    </ul>
  )
}
