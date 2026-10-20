import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useCopy } from '@/copy'

/**
 * A small "?" next to a title. Hover or focus shows a note on how this screen or section carries
 * a feature of the Summit 3.0 model; click or Enter pins it open; Escape closes it.
 */
export function Explain({ id, className = '' }: { id: string; className?: string }) {
  const c = useCopy()
  const item = c.explain.items[id]
  const [pinned, setPinned] = useState(false)
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const popId = useId()
  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false)
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [pinned])
  if (!item) return null
  const feature = c.overview.features.find((f) => f.id === item.feature)
  const open = pinned || hover
  return (
    <span ref={ref} className={`relative inline-block align-middle ${className}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        aria-label={`${c.explain.open}: ${feature?.title ?? ''}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setPinned((v) => !v)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-orange bg-orange-2 text-sm font-bold text-orange-ink hover:bg-orange"
      >
        ?
      </button>
      {open ? (
        <span id={popId} role="note" className="absolute left-0 top-8 z-40 block w-[min(88vw,24rem)] rounded-xl border border-line bg-surface p-3 text-left text-sm font-normal text-ink shadow">
          {feature ? <span className="mb-1 block text-xs font-bold text-teal-ink">{feature.title}</span> : null}
          <span className="block">{item.text}</span>
          <Link to={`/overview#${item.feature}`} className="mt-2 inline-block text-xs font-bold text-indigo underline dark:text-indigo-1" onClick={() => setPinned(false)}>
            {c.explain.more}
          </Link>
        </span>
      ) : null}
    </span>
  )
}
