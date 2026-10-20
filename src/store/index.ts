import { useStore as useZustand } from 'zustand'
import { createMemoryStore, repositoriesFor, type MemoryState } from './memory'

/** The app singleton. Sandbox mode loads fixtures into it; a real API would load the same shape. */
export const appStore = createMemoryStore()
export const repos = repositoriesFor(appStore)

export function useSandbox<T>(selector: (s: MemoryState) => T): T {
  return useZustand(appStore, selector)
}

export { createMemoryStore, repositoriesFor }
export type { MemoryState }
