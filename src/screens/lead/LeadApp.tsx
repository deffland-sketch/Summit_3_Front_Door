import { Navigate, Route, Routes } from 'react-router'
import { LocaleContext, COPY } from '@/copy'
import { Shell } from '@/app/Shell'
import { Dashboard } from './Dashboard'
import { LiveBoard } from './LiveBoard'
import { Outcomes } from './Outcomes'
import { GraphBrowser } from './GraphBrowser'
import { Equity } from './Equity'
import { TimeTalent } from './TimeTalent'
import { Partners } from './Partners'
import { Events } from './Events'
import { Settings } from './Settings'
import { EvidenceLog } from './EvidenceLog'
import { ModelDashboard } from './ModelDashboard'
import { SandboxControls } from '@/components/SandboxControls'

export function LeadApp() {
  const c = COPY.en
  const nav = [
    { to: '/l', label: c.nav.lead.dashboard, end: true },
    { to: '/l/live', label: c.nav.lead.live },
    { to: '/l/outcomes', label: c.nav.lead.outcomes },
    { to: '/l/graph', label: c.nav.lead.graph },
    { to: '/l/equity', label: c.nav.lead.equity },
    { to: '/l/time', label: c.nav.lead.time },
    { to: '/l/partners', label: c.nav.lead.partners },
    { to: '/l/events', label: c.nav.lead.events },
    { to: '/l/settings', label: c.nav.lead.settings },
    { to: '/l/evidence', label: c.nav.lead.evidence },
    { to: '/l/model', label: c.nav.lead.model },
  ]
  return (
    <LocaleContext.Provider value="en">
      <Shell title={c.app.lead} subtitle="Summit Sierra" nav={nav} tools={<SandboxControls />}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="live" element={<LiveBoard />} />
          <Route path="outcomes" element={<Outcomes />} />
          <Route path="graph" element={<GraphBrowser />} />
          <Route path="equity" element={<Equity />} />
          <Route path="time" element={<TimeTalent />} />
          <Route path="partners" element={<Partners />} />
          <Route path="events" element={<Events />} />
          <Route path="settings" element={<Settings />} />
          <Route path="evidence" element={<EvidenceLog />} />
          <Route path="model" element={<ModelDashboard />} />
          <Route path="*" element={<Navigate to="/l" replace />} />
        </Routes>
      </Shell>
    </LocaleContext.Provider>
  )
}
