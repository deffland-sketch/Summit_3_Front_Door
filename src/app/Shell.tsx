import { useEffect, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useCopy } from '@/copy'
import { Toasts } from '@/components/Toasts'

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

/** Two-pane on desktop (nav, content), stacked on phone. */
export function Shell({ title, subtitle, nav, children, theme, tools }: { title: string; subtitle?: string; nav: NavItem[]; children: ReactNode; theme?: { dark?: boolean; textSize?: string; reducedMotion?: boolean }; tools?: ReactNode }) {
  const c = useCopy()
  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', theme?.dark ?? prefersDark ? 'dark' : 'light')
    root.setAttribute('data-text-size', theme?.textSize ?? 'default')
    root.setAttribute('data-reduced-motion', theme?.reducedMotion ? 'true' : 'false')
  }, [theme?.dark, theme?.textSize, theme?.reducedMotion])
  return (
    <div className="min-h-screen bg-surface text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-orange focus:px-3 focus:py-2 focus:text-black">
        {c.app.skipToContent}
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <Link to="/" className="text-xs font-bold text-teal-ink">
              {c.app.name} · {c.app.sandbox}
            </Link>
            <p className="text-lg font-bold text-heading-2">{title}</p>
            {subtitle ? <p className="text-sm text-ink-2">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">{tools}</div>
        </div>
        <nav aria-label="Screens" className="mx-auto max-w-[1100px] overflow-x-auto px-4">
          <ul className="flex gap-1 pb-2">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={({ isActive }) => `block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold ${isActive ? 'bg-indigo text-white' : 'text-indigo hover:bg-indigo-2 dark:text-indigo-1'}`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-[1100px] px-4 py-6">
        {children}
      </main>
      <Toasts />
    </div>
  )
}
