import type { Sandbox } from '@/model'

/** The collections that hold a list of objects with an `id`. */
export type CollectionName = Exclude<keyof Sandbox, 'meta' | 'settings'>
export type CollectionItem<K extends CollectionName> = Sandbox[K][number] & { id: string }

/** One repository per object. A real API implements the same shape later. */
export interface Repository<T extends { id: string }> {
  all(): T[]
  get(id: string): T | undefined
  upsert(item: T): void
  upsertMany(items: T[]): void
  remove(id: string): void
  replaceAll(items: T[]): void
}

export interface SandboxRepositories {
  snapshot(): Sandbox
  collection<K extends CollectionName>(name: K): Repository<CollectionItem<K>>
  settings(): Sandbox['settings']
  setSettings(next: Sandbox['settings']): void
  load(sandbox: Sandbox): void
}
