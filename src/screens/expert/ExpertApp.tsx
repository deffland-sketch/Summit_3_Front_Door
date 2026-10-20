import { Navigate, Route, Routes, useParams } from 'react-router'
import { LocaleContext, COPY } from '@/copy'
import { Shell } from '@/app/Shell'
import { useSnapshot } from '@/app/hooks'
import { MyOfferings } from './MyOfferings'
import { ProposedWorkshops } from './ProposedWorkshops'
import { NeedsYou } from './NeedsYou'
import { RosterNotes } from './RosterNotes'
import { Menu } from './Menu'
import { StandingSessions } from './StandingSessions'
import { WeeklyBuild } from './WeeklyBuild'
import { SandboxControls } from '@/components/SandboxControls'

export function ExpertApp() {
  const { adultId = '' } = useParams()
  const snap = useSnapshot()
  const adult = snap.adults.find((a) => a.id === adultId)
  if (!adult) return <Navigate to="/" replace />
  const c = COPY.en
  const base = `/x/${adult.id}`
  const isArchitect = adult.capacities.includes('system_architect')
  const nav = [
    { to: base, label: c.nav.expert.offerings, end: true },
    { to: `${base}/proposed`, label: c.nav.expert.proposed },
    { to: `${base}/needs-you`, label: c.nav.expert.needsYou },
    { to: `${base}/roster`, label: c.nav.expert.roster },
    { to: `${base}/menu`, label: c.nav.expert.menu },
    { to: `${base}/standing`, label: c.nav.expert.standing },
    ...(isArchitect ? [{ to: `${base}/build`, label: c.nav.expert.build }] : []),
  ]
  const subtitle = adult.capacities.map((k) => ({ content_expert: 'Content expert', facilitator: 'Facilitator', system_architect: 'System architect', mentor: 'Mentor', leader: 'Leader', case_manager: 'Case manager', partner: 'Partner' })[k]).join(' · ')
  return (
    <LocaleContext.Provider value="en">
      <Shell title={adult.display_name} subtitle={subtitle} nav={nav} tools={<SandboxControls />}>
        <Routes>
          <Route index element={<MyOfferings adultId={adult.id} />} />
          <Route path="proposed" element={<ProposedWorkshops adultId={adult.id} />} />
          <Route path="needs-you" element={<NeedsYou adultId={adult.id} />} />
          <Route path="roster" element={<RosterNotes adultId={adult.id} />} />
          <Route path="menu" element={<Menu />} />
          <Route path="standing" element={<StandingSessions adultId={adult.id} />} />
          {isArchitect ? <Route path="build" element={<WeeklyBuild adultId={adult.id} />} /> : null}
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      </Shell>
    </LocaleContext.Provider>
  )
}
