import type { ExperienceType } from '@/model'

/** The eight fixed experience-type colors (Spec 8). */
export const TYPE_STYLE: Record<ExperienceType, { edge: string; fill: string; ink: string; hex: string; chip: string }> = {
  DI: { edge: 'border-l-indigo', fill: 'bg-indigo', ink: 'text-indigo dark:text-indigo-1', hex: '#4b4b96', chip: 'bg-indigo-2 text-indigo dark:text-indigo-1' },
  PF: { edge: 'border-l-teal', fill: 'bg-teal', ink: 'text-teal-ink', hex: '#508278', chip: 'bg-teal-2 text-teal-ink' },
  DD: { edge: 'border-l-orange', fill: 'bg-orange', ink: 'text-orange-ink', hex: '#f6aa40', chip: 'bg-orange-2 text-orange-ink' },
  IW: { edge: 'border-l-light-blue', fill: 'bg-light-blue', ink: 'text-light-blue-ink', hex: '#96d2dc', chip: 'bg-light-blue-2 text-light-blue-ink' },
  PP: { edge: 'border-l-red', fill: 'bg-red', ink: 'text-red-ink', hex: '#e6553c', chip: 'bg-red-2 text-red-ink' },
  RG: { edge: 'border-l-peach', fill: 'bg-peach', ink: 'text-peach-ink', hex: '#ffd2b4', chip: 'bg-peach-1 text-peach-ink' },
  RW: { edge: 'border-l-brown', fill: 'bg-brown', ink: 'text-brown dark:text-brown-1', hex: '#503c2d', chip: 'bg-brown-2 text-brown dark:text-brown-1' },
  WC: { edge: 'border-l-tan-grey', fill: 'bg-tan-grey', ink: 'text-tan-grey-ink', hex: '#96a0ab', chip: 'bg-tan-grey-2 text-tan-grey-ink' },
}
export const TYPE_ORDER: ExperienceType[] = ['DI', 'PF', 'DD', 'IW', 'PP', 'RG', 'RW', 'WC']
