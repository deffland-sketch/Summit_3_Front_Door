import type { Outcome } from '@/model'

/** The 16 Habits of Success in 5 building blocks. */
export interface HabitBlockDef {
  id: string
  name: string
  habits: { id: string; name: string; description: string }[]
}

export const HABIT_BLOCKS: HabitBlockDef[] = [
  {
    id: 'HB.HEALTHY',
    name: 'Healthy development',
    habits: [
      { id: 'HOS.ATTACHMENT', name: 'Attachment', description: 'Has at least one adult at school who knows me well.' },
      { id: 'HOS.STRESS', name: 'Stress management', description: 'Notices stress and has ways to steady myself.' },
      { id: 'HOS.SELF_REGULATION', name: 'Self-regulation', description: 'Manages attention, feelings, and actions toward a goal.' },
    ],
  },
  {
    id: 'HB.READY',
    name: 'School readiness',
    habits: [
      { id: 'HOS.SELF_AWARENESS', name: 'Self-awareness', description: 'Knows my strengths, values, and what I need to learn well.' },
      { id: 'HOS.SOCIAL', name: 'Social awareness and relationship skills', description: 'Reads others well and builds relationships that work.' },
      { id: 'HOS.EXEC_FUNCTION', name: 'Executive function', description: 'Plans, organizes, and follows through on multi-step work.' },
    ],
  },
  {
    id: 'HB.MINDSETS',
    name: 'Mindsets for self and school',
    habits: [
      { id: 'HOS.GROWTH_MINDSET', name: 'Growth mindset', description: 'Believes ability grows with effort and good strategies.' },
      { id: 'HOS.SELF_EFFICACY', name: 'Self-efficacy', description: 'Believes I can do hard things and shows it.' },
      { id: 'HOS.BELONGING', name: 'Sense of belonging', description: 'Feels part of this school and this community.' },
      { id: 'HOS.RELEVANCE', name: 'Relevance of school', description: 'Connects the work at school to the life I am building.' },
    ],
  },
  {
    id: 'HB.PERSEVERANCE',
    name: 'Perseverance',
    habits: [
      { id: 'HOS.RESILIENCE', name: 'Resilience', description: 'Comes back from setbacks and keeps going.' },
      { id: 'HOS.AGENCY', name: 'Agency', description: 'Acts on my own choices and takes ownership of the outcome.' },
      { id: 'HOS.TENACITY', name: 'Academic tenacity', description: 'Sticks with challenging work until it is done well.' },
    ],
  },
  {
    id: 'HB.INDEPENDENCE',
    name: 'Independence and sustainability',
    habits: [
      { id: 'HOS.SELF_DIRECTION', name: 'Self-direction', description: 'Sets goals, chooses strategies, and checks my own progress.' },
      { id: 'HOS.CURIOSITY', name: 'Curiosity', description: 'Asks questions and follows them where they lead.' },
      { id: 'HOS.CIVIC_IDENTITY', name: 'Civic identity', description: 'Sees myself as someone who contributes to a community.' },
    ],
  },
]

export function habitOutcomes(): Outcome[] {
  const out: Outcome[] = []
  for (const b of HABIT_BLOCKS) {
    for (const h of b.habits) {
      out.push({
        id: h.id,
        family: 'durable',
        domain: b.name,
        name: h.name,
        description: h.description,
        level_expectations: null,
        validation: 'reflection',
        prerequisites: [],
      })
    }
  }
  return out
}

/** Building Blocks for Learning: the lower blocks build toward the upper ones. */
export function habitProgressionEdges(): { from: string; to: string }[] {
  return [
    { from: 'HOS.ATTACHMENT', to: 'HOS.BELONGING' },
    { from: 'HOS.STRESS', to: 'HOS.SELF_REGULATION' },
    { from: 'HOS.SELF_REGULATION', to: 'HOS.EXEC_FUNCTION' },
    { from: 'HOS.SELF_AWARENESS', to: 'HOS.SELF_EFFICACY' },
    { from: 'HOS.SOCIAL', to: 'HOS.BELONGING' },
    { from: 'HOS.EXEC_FUNCTION', to: 'HOS.SELF_DIRECTION' },
    { from: 'HOS.GROWTH_MINDSET', to: 'HOS.RESILIENCE' },
    { from: 'HOS.SELF_EFFICACY', to: 'HOS.AGENCY' },
    { from: 'HOS.RELEVANCE', to: 'HOS.TENACITY' },
    { from: 'HOS.RESILIENCE', to: 'HOS.TENACITY' },
    { from: 'HOS.AGENCY', to: 'HOS.SELF_DIRECTION' },
    { from: 'HOS.TENACITY', to: 'HOS.SELF_DIRECTION' },
    { from: 'HOS.CURIOSITY', to: 'HOS.CIVIC_IDENTITY' },
    { from: 'HOS.BELONGING', to: 'HOS.CIVIC_IDENTITY' },
  ]
}
