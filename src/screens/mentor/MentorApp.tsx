import { Navigate, Route, Routes, useParams } from 'react-router'
import { LocaleContext, COPY } from '@/copy'
import { Shell } from '@/app/Shell'
import { useSnapshot } from '@/app/hooks'
import { Caseload } from './Caseload'
import { MentorStudent } from './MentorStudent'
import { Touchpoints } from './Touchpoints'
import { ConfirmMonday } from './ConfirmMonday'
import { Readiness } from './Readiness'
import { Family } from './Family'
import { SandboxControls } from '@/components/SandboxControls'

export function MentorApp() {
  const { mentorId = '' } = useParams()
  const snap = useSnapshot()
  const mentor = snap.adults.find((a) => a.id === mentorId && a.capacities.includes('mentor'))
  if (!mentor) return <Navigate to="/" replace />
  const c = COPY.en
  const base = `/m/${mentor.id}`
  const nav = [
    { to: base, label: c.nav.mentor.caseload, end: true },
    { to: `${base}/touchpoints`, label: c.nav.mentor.touchpoints },
    { to: `${base}/confirm`, label: c.nav.mentor.confirm },
    { to: `${base}/readiness`, label: c.nav.mentor.readiness },
    { to: `${base}/family`, label: c.nav.mentor.family },
  ]
  return (
    <LocaleContext.Provider value="en">
      <Shell title={mentor.display_name} subtitle={c.app.mentor} nav={nav} tools={<SandboxControls />}>
        <Routes>
          <Route index element={<Caseload mentorId={mentor.id} />} />
          <Route path="student/:studentId" element={<MentorStudent mentorId={mentor.id} />} />
          <Route path="touchpoints" element={<Touchpoints mentorId={mentor.id} />} />
          <Route path="confirm" element={<ConfirmMonday mentorId={mentor.id} />} />
          <Route path="readiness" element={<Readiness mentorId={mentor.id} />} />
          <Route path="family" element={<Family mentorId={mentor.id} />} />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      </Shell>
    </LocaleContext.Provider>
  )
}
