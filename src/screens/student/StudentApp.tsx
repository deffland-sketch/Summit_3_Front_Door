import { Navigate, Route, Routes, useParams } from 'react-router'
import { LocaleContext, COPY } from '@/copy'
import { Shell } from '@/app/Shell'
import { useStudentData } from '@/app/hooks'
import { Today } from './Today'
import { Week } from './Week'
import { Build } from './Build'
import { Progress } from './Progress'
import { Courses } from './Courses'
import { Pathway } from './Pathway'
import { Reflection } from './Reflection'
import { Me } from './Me'
import { SandboxControls } from '@/components/SandboxControls'

export function StudentApp() {
  const { studentId = '' } = useParams()
  const { student } = useStudentData(studentId)
  if (!student) return <Navigate to="/" replace />
  const c = COPY[student.locale]
  const base = `/s/${student.id}`
  const nav = [
    { to: base, label: c.nav.student.today, end: true },
    { to: `${base}/week`, label: c.nav.student.week },
    { to: `${base}/build`, label: c.nav.student.build },
    { to: `${base}/progress`, label: c.nav.student.progress },
    { to: `${base}/courses`, label: c.nav.student.courses },
    { to: `${base}/pathway`, label: c.nav.student.pathway },
    { to: `${base}/reflection`, label: c.nav.student.reflection },
    { to: `${base}/me`, label: c.nav.student.me },
  ]
  return (
    <LocaleContext.Provider value={student.locale}>
      <Shell title={student.display_name} subtitle={`${c.app.student} · ${c.app.levels[student.level]}`} nav={nav} theme={{ dark: student.dark_mode, textSize: student.text_size, reducedMotion: student.reduced_motion }} tools={<SandboxControls studentId={student.id} />}>
        <Routes>
          <Route index element={<Today studentId={student.id} />} />
          <Route path="week" element={<Week studentId={student.id} />} />
          <Route path="build" element={<Build studentId={student.id} />} />
          <Route path="progress" element={<Progress studentId={student.id} />} />
          <Route path="courses" element={<Courses studentId={student.id} />} />
          <Route path="pathway" element={<Pathway studentId={student.id} />} />
          <Route path="reflection" element={<Reflection studentId={student.id} />} />
          <Route path="me" element={<Me studentId={student.id} />} />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      </Shell>
    </LocaleContext.Provider>
  )
}
