import { createContext, useContext } from 'react'
import { en, type Copy } from './en'
import { es } from './es'

export type Locale = 'en' | 'es'
export const COPY: Record<Locale, Copy> = { en, es }
export const LocaleContext = createContext<Locale>('en')
export function useCopy(): Copy {
  return COPY[useContext(LocaleContext)]
}
export { en, es }
