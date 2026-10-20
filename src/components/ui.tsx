import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function Card({ children, accent, className = '', as: Tag = 'div' }: { children: ReactNode; accent?: string; className?: string; as?: 'div' | 'li' | 'section' | 'article' }) {
  return <Tag className={`rounded-xl border border-line bg-surface p-4 ${accent ? `border-t-4 ${accent}` : ''} ${className}`}>{children}</Tag>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-2">{children}</p>
}

export function H1({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-2xl md:text-3xl ${className}`}>{children}</h1>
}
export function H2({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2 id={id} className={`text-xl ${className}`}>
      {children}
    </h2>
  )
}
export function H3({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-base ${className}`}>{children}</h3>
}

export function Button({ children, onClick, kind = 'primary', type = 'button', disabled, className = '', ariaLabel, ariaExpanded, ariaPressed }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'quiet' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean; className?: string; ariaLabel?: string; ariaExpanded?: boolean; ariaPressed?: boolean }) {
  const styles = {
    primary: 'bg-indigo text-white hover:bg-indigo-1',
    secondary: 'border border-indigo text-indigo dark:text-indigo-1 dark:border-indigo-1 hover:bg-indigo-2',
    quiet: 'text-indigo dark:text-indigo-1 hover:bg-indigo-2',
    danger: 'border border-red-ink text-red-ink hover:bg-red-2',
  }[kind]
  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} aria-expanded={ariaExpanded} aria-pressed={ariaPressed} className={`rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50 ${styles} ${className}`}>
      {children}
    </button>
  )
}

export function LinkButton({ to, children, kind = 'secondary', className = '' }: { to: string; children: ReactNode; kind?: 'primary' | 'secondary' | 'quiet'; className?: string }) {
  const styles = { primary: 'bg-indigo text-white hover:bg-indigo-1', secondary: 'border border-indigo text-indigo dark:text-indigo-1 dark:border-indigo-1 hover:bg-indigo-2', quiet: 'text-indigo dark:text-indigo-1 hover:bg-indigo-2' }[kind]
  return (
    <Link to={to} className={`inline-block rounded-lg px-3 py-2 text-sm font-bold ${styles} ${className}`}>
      {children}
    </Link>
  )
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{children}</span>
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-bold">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-ink-2">{hint}</span> : null}
    </label>
  )
}

export const inputClass = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink'

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-2">{children}</p>
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="text-2xl font-bold text-heading-2">{value}</p>
      {sub ? <p className="text-xs text-ink-2">{sub}</p> : null}
    </div>
  )
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm">
      <span className="font-bold">{label}</span>
      <span aria-hidden="true" className={`inline-block h-6 w-11 rounded-full p-0.5 transition-colors ${on ? 'bg-teal' : 'bg-tan-grey-1'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value)
            if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].id)
            if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].id)
          }}
          className={`-mb-px rounded-t-lg px-3 py-2 text-sm font-bold ${value === t.id ? 'border-b-2 border-indigo text-indigo dark:text-indigo-1' : 'text-ink-2 hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
