import { createStore, type StoreApi } from 'zustand/vanilla'
import { DEFAULT_LEVEL_TARGETS, SandboxSchema, type Sandbox } from '@/model'
import type { CollectionItem, CollectionName, Repository, SandboxRepositories } from './repository'

export interface MemoryState extends Sandbox {
  loaded: boolean
  load: (sandbox: Sandbox) => void
  replace: <K extends CollectionName>(name: K, items: Sandbox[K]) => void
  upsert: <K extends CollectionName>(name: K, item: CollectionItem<K>) => void
  upsertMany: <K extends CollectionName>(name: K, items: CollectionItem<K>[]) => void
  remove: <K extends CollectionName>(name: K, id: string) => void
  setSettings: (next: Sandbox['settings']) => void
  patchSettings: (patch: Partial<Sandbox['settings']>, by: string) => void
  setMeta: (patch: Partial<Sandbox['meta']>) => void
}

export const EMPTY_SANDBOX: Sandbox = {
  meta: { seed: 0, generated_at: '', week_start: '2026-10-19', today: '2026-10-20', graph_source: 'none' },
  students: [],
  adults: [],
  outcomes: [],
  offerings: [],
  plans: [],
  evidence: [],
  touchpoints: [],
  courses: [],
  units: [],
  lessons: [],
  assignments: [],
  places: [],
  groups: [],
  settings: {
    id: 'school',
    school_name: '',
    day_start: '08:30',
    day_end: '15:30',
    community_time: { all: { start: '08:30', end: '08:45' }, small_groups: { start: '08:45', end: '09:15' } },
    workshop_size: { min: 4, max: 8 },
    grouping_threshold: 4,
    required_rule: { mastery_below_pct: 70 },
    recommended_rule: { within_points: 5 },
    weekly_build_day: 'fri',
    overnight_adjustments: true,
    max_overnight_moves: 2,
    stale_days: 14,
    mentor_min_touchpoints_per_week: 2,
    protected_time_visible_as: 'Protected time',
    level_targets: DEFAULT_LEVEL_TARGETS,
    changed_at: '2026-10-16T17:00:00.000Z',
    changed_by: 'seed',
  },
  futre: [],
  gathering_log: [],
}

function upsertInto<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [...list, item]
  const next = list.slice()
  next[i] = item
  return next
}

export function createMemoryStore(initial: Sandbox = EMPTY_SANDBOX): StoreApi<MemoryState> {
  return createStore<MemoryState>((set) => ({
    ...initial,
    loaded: initial !== EMPTY_SANDBOX,
    load: (sandbox) => set({ ...SandboxSchema.parse(sandbox), loaded: true }),
    replace: (name, items) => set({ [name]: items } as Partial<MemoryState>),
    upsert: (name, item) =>
      set((s) => ({ [name]: upsertInto(s[name] as { id: string }[], item as { id: string }) }) as Partial<MemoryState>),
    upsertMany: (name, items) =>
      set((s) => {
        let list = s[name] as { id: string }[]
        for (const item of items) list = upsertInto(list, item as { id: string })
        return { [name]: list } as Partial<MemoryState>
      }),
    remove: (name, id) =>
      set((s) => ({ [name]: (s[name] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<MemoryState>),
    setSettings: (next) => set({ settings: next }),
    patchSettings: (patch, by) =>
      set((s) => ({ settings: { ...s.settings, ...patch, changed_at: new Date().toISOString(), changed_by: by } })),
    setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),
  }))
}

/** Wraps a vanilla store in the repository interface. */
export function repositoriesFor(store: StoreApi<MemoryState>): SandboxRepositories {
  const snapshot = (): Sandbox => {
    const s = store.getState()
    return {
      meta: s.meta,
      students: s.students,
      adults: s.adults,
      outcomes: s.outcomes,
      offerings: s.offerings,
      plans: s.plans,
      evidence: s.evidence,
      touchpoints: s.touchpoints,
      courses: s.courses,
      units: s.units,
      lessons: s.lessons,
      assignments: s.assignments,
      places: s.places,
      groups: s.groups,
      settings: s.settings,
      futre: s.futre,
      gathering_log: s.gathering_log,
    }
  }
  return {
    snapshot,
    collection<K extends CollectionName>(name: K): Repository<CollectionItem<K>> {
      type T = CollectionItem<K>
      return {
        all: () => store.getState()[name] as T[],
        get: (id) => (store.getState()[name] as T[]).find((x) => x.id === id),
        upsert: (item) => store.getState().upsert(name, item),
        upsertMany: (items) => store.getState().upsertMany(name, items),
        remove: (id) => store.getState().remove(name, id),
        replaceAll: (items) => store.getState().replace(name, items as Sandbox[K]),
      }
    },
    settings: () => store.getState().settings,
    setSettings: (next) => store.getState().setSettings(next),
    load: (sandbox) => store.getState().load(sandbox),
  }
}
