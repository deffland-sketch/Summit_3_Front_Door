import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { SandboxLoader } from './app/SandboxLoader'
import { Landing } from './app/Landing'
import { Overview } from './app/Overview'
import { StudentApp } from './screens/student/StudentApp'
import { MentorApp } from './screens/mentor/MentorApp'
import { ExpertApp } from './screens/expert/ExpertApp'
import { LeadApp } from './screens/lead/LeadApp'
import { DisplayBoard } from './screens/lead/DisplayBoard'

export default function App() {
  return (
    <BrowserRouter>
      <SandboxLoader>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/s/:studentId/*" element={<StudentApp />} />
          <Route path="/m/:mentorId/*" element={<MentorApp />} />
          <Route path="/x/:adultId/*" element={<ExpertApp />} />
          <Route path="/l/*" element={<LeadApp />} />
          <Route path="/board" element={<DisplayBoard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SandboxLoader>
    </BrowserRouter>
  )
}
