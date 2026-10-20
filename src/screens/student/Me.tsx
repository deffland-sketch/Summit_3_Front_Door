import { useCopy } from '@/copy'
import { useStudentData } from '@/app/hooks'
import { Card, Empty, Field, H1, H2, inputClass, Toggle } from '@/components/ui'
import { updateStudent } from '@/store/actions'
import { useUi } from '@/store/ui'
import { formatTime12 } from '@/lib/time'

const DAY: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }

export function Me({ studentId }: { studentId: string }) {
  const c = useCopy()
  const { student, mentor, snap } = useStudentData(studentId)
  const toast = useUi((u) => u.toast)
  if (!student) return <Empty>{c.app.none}</Empty>
  const set = (patch: Parameters<typeof updateStudent>[1]) => {
    updateStudent(student.id, patch)
    toast(c.me.saved)
  }
  const group = snap.groups.find((g) => g.id === student.community_group_id)
  return (
    <div className="space-y-6">
      <div>
        <H1>{c.me.title}</H1>
        <p className="text-sm text-ink-2">{c.me.lede}</p>
      </div>
      <Card>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div><dt className="font-bold">{c.me.level}</dt><dd>{c.app.levels[student.level]}</dd></div>
          <div><dt className="font-bold">{c.me.autonomy}</dt><dd>{c.app.autonomy[student.plan_autonomy]}</dd></div>
          <div><dt className="font-bold">{c.me.mentor}</dt><dd>{mentor?.display_name}</dd></div>
          <div><dt className="font-bold">{c.me.group}</dt><dd>{group?.name}</dd></div>
        </dl>
      </Card>
      <section aria-labelledby="supports">
        <H2 id="supports">{c.me.supports}</H2>
        {student.supports.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {student.supports.map((s, i) => (
              <li key={i} className="rounded-lg border border-line p-2">{s.note}</li>
            ))}
          </ul>
        ) : (
          <Empty>{c.me.noSupports}</Empty>
        )}
        {student.protected_slots.length ? (
          <div className="mt-3">
            <p className="text-sm font-bold">{c.me.protectedTime}</p>
            <ul className="text-sm">
              {student.protected_slots.map((p, i) => (
                <li key={i}>{DAY[p.day]} {formatTime12(p.start)} to {formatTime12(p.end)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {student.life_constraints.length ? (
          <div className="mt-3">
            <p className="text-sm font-bold">{c.me.lifeConstraints}</p>
            <ul className="text-sm">
              {student.life_constraints.map((p, i) => (
                <li key={i}>{DAY[p.day]} {formatTime12(p.start)} to {formatTime12(p.end)} · {p.label}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <section aria-labelledby="notif">
        <H2 id="notif">{c.me.notifications}</H2>
        <Card className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label={c.me.channel}>
            <select className={inputClass} value={student.notification_prefs.channel} onChange={(e) => set({ notification_prefs: { ...student.notification_prefs, channel: e.target.value as 'banner' } })}>
              {Object.entries(c.me.channels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label={c.me.warning}>
            <select className={inputClass} value={student.notification_prefs.warning_minutes} onChange={(e) => set({ notification_prefs: { ...student.notification_prefs, warning_minutes: Number(e.target.value) } })}>
              {[0, 5, 10].map((n) => (
                <option key={n} value={n}>{c.me.warningMinutes(n)}</option>
              ))}
            </select>
          </Field>
        </Card>
      </section>
      <section aria-labelledby="prefs">
        <H2 id="prefs">{c.nav.student.me}</H2>
        <Card className="mt-2 grid gap-3 md:grid-cols-2">
          <Field label={c.me.language}>
            <select className={inputClass} value={student.locale} onChange={(e) => set({ locale: e.target.value as 'en' | 'es' })}>
              {Object.entries(c.me.languages).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label={c.me.textSize}>
            <select className={inputClass} value={student.text_size} onChange={(e) => set({ text_size: e.target.value as 'default' })}>
              {Object.entries(c.me.textSizes).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Toggle label={c.me.darkMode} on={student.dark_mode} onChange={(v) => set({ dark_mode: v })} />
          <Toggle label={c.me.reducedMotion} on={student.reduced_motion} onChange={(v) => set({ reduced_motion: v })} />
        </Card>
      </section>
    </div>
  )
}
