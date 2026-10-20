import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useCopy } from '@/copy'
import { Card, H1, H2 } from '@/components/ui'
import { Shell } from './Shell'

/** The map from the Summit 3.0 model to the screens and engine pieces that carry each feature. */
export function Overview() {
  const c = useCopy()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])
  const nav = [
    { to: '/', label: c.app.roleSwitcher, end: true },
    { to: '/overview', label: c.overview.nav },
  ]
  return (
    <Shell title={c.overview.title} nav={nav}>
      <div className="space-y-8">
        <div>
          <H1>{c.overview.title}</H1>
          <p className="mt-2 max-w-prose">{c.overview.lede}</p>
          <p className="mt-1 text-sm text-ink-2">{c.overview.hint}</p>
        </div>
        <Card as="section" accent="border-t-orange">
          <H2 id="walk">{c.overview.walkIt}</H2>
          <p className="text-sm text-ink-2">{c.overview.walkLede}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {c.overview.walk.map((w, i) => <li key={i}>{w}</li>)}
          </ol>
          <p className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link className="font-bold text-indigo underline dark:text-indigo-1" to="/s/stu_001">{c.app.student}</Link>
            <Link className="font-bold text-indigo underline dark:text-indigo-1" to="/m/adu_mentor_1">{c.app.mentor}</Link>
            <Link className="font-bold text-indigo underline dark:text-indigo-1" to="/x/adu_math">{c.app.expert}</Link>
            <Link className="font-bold text-indigo underline dark:text-indigo-1" to="/l">{c.app.lead}</Link>
          </p>
        </Card>
        <ol className="space-y-4">
          {c.overview.features.map((f, i) => (
            <li key={f.id} id={f.id} className="scroll-mt-4">
              <Card as="article" accent={['border-t-indigo', 'border-t-teal', 'border-t-orange', 'border-t-brown'][i % 4]}>
                <H2>{f.title}</H2>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold text-ink-2">{c.overview.inTheModel}</p>
                    <p className="text-sm">{f.model}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-2">{c.overview.whereItLives}</p>
                    <p className="text-sm">{f.here}</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  )
}
