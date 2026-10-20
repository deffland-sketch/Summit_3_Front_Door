import { useMemo } from 'react'
import { useCopy } from '@/copy'
import { Explain } from '@/components/Explain'
import { useSnapshot } from '@/app/hooks'
import { Button, Card, Field, H1, H2, inputClass, Toggle } from '@/components/ui'
import { patchSettings, runWeeklyBuild } from '@/store/actions'
import { useUi } from '@/store/ui'
import { proposeWorkshops } from '@/engine'
import { format, parseISO } from 'date-fns'

export function Settings() {
  const c = useCopy()
  const snap = useSnapshot()
  const toast = useUi((u) => u.toast)
  const log = useUi((u) => u.settingsLog)
  const s = snap.settings
  const proposals = useMemo(() => proposeWorkshops(snap).filter((p) => p.kind === 'workshop').length, [snap])
  const num = (key: string, value: number | string, extra?: Record<string, unknown>) => patchSettings(extra ?? { [key]: value }, 'adu_director')
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.lead.settings} <Explain id="lead.settings" /></H1>
        <p className="text-sm text-ink-2">{c.lead.settingsLede} {c.lead.lastChange}: {format(parseISO(s.changed_at), 'MMM d, h:mm a')} · {s.changed_by}.</p>
      </div>
      <Card className="grid gap-3 md:grid-cols-3">
        <Field label={c.lead.settingLabels.grouping_threshold} hint={c.lead.proposalsNow(proposals)}>
          <input type="number" min={1} className={inputClass} value={s.grouping_threshold} onChange={(e) => num('grouping_threshold', Number(e.target.value))} />
        </Field>
        <Field label={c.lead.settingLabels.workshop_min}><input type="number" min={1} className={inputClass} value={s.workshop_size.min} onChange={(e) => num('workshop_size', 0, { workshop_size: { ...s.workshop_size, min: Number(e.target.value) } })} /></Field>
        <Field label={c.lead.settingLabels.workshop_max}><input type="number" min={1} className={inputClass} value={s.workshop_size.max} onChange={(e) => num('workshop_size', 0, { workshop_size: { ...s.workshop_size, max: Number(e.target.value) } })} /></Field>
        <Field label={c.lead.settingLabels.mastery_below_pct}><input type="number" className={inputClass} value={s.required_rule.mastery_below_pct} onChange={(e) => num('required_rule', 0, { required_rule: { mastery_below_pct: Number(e.target.value) } })} /></Field>
        <Field label={c.lead.settingLabels.within_points}><input type="number" className={inputClass} value={s.recommended_rule.within_points} onChange={(e) => num('recommended_rule', 0, { recommended_rule: { within_points: Number(e.target.value) } })} /></Field>
        <Field label={c.lead.settingLabels.stale_days}><input type="number" className={inputClass} value={s.stale_days} onChange={(e) => num('stale_days', Number(e.target.value))} /></Field>
        <Field label={c.lead.settingLabels.max_overnight_moves}><input type="number" className={inputClass} value={s.max_overnight_moves} onChange={(e) => num('max_overnight_moves', Number(e.target.value))} /></Field>
        <Field label={c.lead.settingLabels.mentor_min_touchpoints_per_week}><input type="number" className={inputClass} value={s.mentor_min_touchpoints_per_week} onChange={(e) => num('mentor_min_touchpoints_per_week', Number(e.target.value))} /></Field>
        <Field label={c.lead.settingLabels.weekly_build_day}>
          <select className={inputClass} value={s.weekly_build_day} onChange={(e) => num('weekly_build_day', e.target.value)}>{['mon', 'tue', 'wed', 'thu', 'fri'].map((d) => <option key={d} value={d}>{d}</option>)}</select>
        </Field>
        <Field label={c.lead.settingLabels.day_start}><input type="time" className={inputClass} value={s.day_start} onChange={(e) => num('day_start', e.target.value)} /></Field>
        <Field label={c.lead.settingLabels.day_end}><input type="time" className={inputClass} value={s.day_end} onChange={(e) => num('day_end', e.target.value)} /></Field>
        <Field label={c.lead.settingLabels.protected_time_visible_as}><input className={inputClass} value={s.protected_time_visible_as} onChange={(e) => num('protected_time_visible_as', e.target.value)} /></Field>
        <div className="md:col-span-3"><Toggle label={c.lead.settingLabels.overnight_adjustments} on={s.overnight_adjustments} onChange={(v) => num('overnight_adjustments', 0, { overnight_adjustments: v })} /></div>
      </Card>
      <Button onClick={() => { const n = runWeeklyBuild(false); toast(c.expert.built(n, 'now')) }}>{c.lead.rerun}</Button>
      <section aria-labelledby="log">
        <H2 id="log">{c.lead.lastChange}</H2>
        <ul className="mt-2 text-sm">
          {log.map((e, i) => <li key={i} className="border-t border-line py-1">{format(parseISO(e.at), 'h:mm a')} · {e.by} · {e.key}: {e.from} to {e.to}</li>)}
        </ul>
      </section>
    </div>
  )
}
