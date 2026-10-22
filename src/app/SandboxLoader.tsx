import { useEffect, useState, type ReactNode } from 'react'
import { appStore } from '@/store'
import { SandboxSchema } from '@/model'
import { useSandbox } from '@/store'
import { en } from '@/copy/en'
import { adultOutToday, runOvernight, runWeeklyBuild, snapshot } from '@/store/actions'

/** Loads /sandbox/sandbox.json into the in-memory store once. Sandbox mode is the only mode in v1. */
export function SandboxLoader({ children }: { children: ReactNode }) {
  const loaded = useSandbox((s) => s.loaded)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (loaded) return
    const base = import.meta.env.BASE_URL ?? '/'
    fetch(`${base}sandbox/sandbox.json`)
      .then((r) => r.json())
      .then((json) => {
        appStore.getState().load(SandboxSchema.parse(json))
        // The sandbox exposes the engine runs so a scenario can time them in the real browser (Spec 6 Performance).
        ;(window as unknown as { __homebase: unknown }).__homebase = { runWeeklyBuild, runOvernight, adultOutToday, snapshot }
      })
      .catch((e: unknown) => setError(String(e)))
  }, [loaded])
  if (error) return <p className="p-6 text-red-ink">{error}</p>
  if (!loaded)
    return (
      <p className="p-6 text-ink-2" role="status">
        {en.app.loading}
      </p>
    )
  return <>{children}</>
}
