export * from './types'
export { futreAdapter } from './futre'
export { kiraAdapter, teachToOneAdapter, calendarAdapter, partnerAdapter, gradebookAdapter, stubAdapter } from './stub'
import { futreAdapter } from './futre'
import { calendarAdapter, gradebookAdapter, kiraAdapter, partnerAdapter, teachToOneAdapter } from './stub'
import type { SourceAdapter } from './types'

/** Every source, in gathering order. Sandbox mode is the only mode in v1. */
export const adapters: SourceAdapter[] = [kiraAdapter, teachToOneAdapter, futreAdapter, calendarAdapter, partnerAdapter, gradebookAdapter]
