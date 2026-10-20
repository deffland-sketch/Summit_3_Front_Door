import type { Level, Outcome } from '@/model'

/** The 36 Summit Cognitive Skills in 7 domains, scored 1 to 8. */
export interface CognitiveDomainDef {
  id: string
  name: string
  skills: { id: string; name: string; description: string; shift?: number }[]
}

export const COGNITIVE_DOMAINS: CognitiveDomainDef[] = [
  {
    id: 'CSD.TXT',
    name: 'Textual analysis',
    skills: [
      { id: 'CS.TXT.THEME', name: 'Theme and central idea', description: 'Finds what a text is really about and traces how it develops.' },
      { id: 'CS.TXT.POV', name: 'Point of view and purpose', description: 'Explains how an author’s perspective and purpose shape a text.' },
      { id: 'CS.TXT.DEV', name: 'Development', description: 'Tracks how ideas, characters, or events build across a text.' },
      { id: 'CS.TXT.STRUCT', name: 'Structure', description: 'Explains how the parts of a text fit together and why.' },
      { id: 'CS.TXT.WORD', name: 'Word choice', description: 'Explains how specific words and phrases shape meaning and tone.' },
    ],
  },
  {
    id: 'CSD.SRC',
    name: 'Using sources',
    skills: [
      { id: 'CS.SRC.SELECT', name: 'Selecting relevant sources', description: 'Chooses sources that fit the question and says why.' },
      { id: 'CS.SRC.CONTEXT', name: 'Contextualizing sources', description: 'Places a source in its time, place, and purpose.' },
      { id: 'CS.SRC.SYNTH', name: 'Synthesizing multiple sources', description: 'Brings several sources together into one line of thinking.' },
    ],
  },
  {
    id: 'CSD.INQ',
    name: 'Inquiry',
    skills: [
      { id: 'CS.INQ.QUESTION', name: 'Asking questions', description: 'Writes questions that can be investigated and matter.' },
      { id: 'CS.INQ.HYPOTH', name: 'Hypothesizing', description: 'Proposes a testable explanation grounded in what is known.' },
      { id: 'CS.INQ.DESIGN', name: 'Designing processes and procedures', description: 'Plans a fair method with the right variables and controls.', shift: -1 },
      { id: 'CS.INQ.COLLECT', name: 'Collecting data', description: 'Gathers accurate, organized data the method calls for.' },
    ],
  },
  {
    id: 'CSD.ANA',
    name: 'Analysis and synthesis',
    skills: [
      { id: 'CS.ANA.CONNECT', name: 'Making connections and inferences', description: 'Reads between the lines and links ideas across contexts.' },
      { id: 'CS.ANA.CRITIQUE', name: 'Critiquing the reasoning of others', description: 'Finds the strengths and gaps in someone else’s argument.' },
      { id: 'CS.ANA.JUSTIFY', name: 'Justifying and constructing an explanation', description: 'Builds an explanation that follows from the evidence.' },
      { id: 'CS.ANA.INTERPRET', name: 'Interpreting data and information', description: 'Says what the data shows and what it does not.' },
      { id: 'CS.ANA.MODEL', name: 'Modeling', description: 'Represents a system or situation so it can be reasoned about.', shift: -1 },
      { id: 'CS.ANA.COMPARE', name: 'Comparing and contrasting', description: 'Weighs similarities and differences to reach a point.' },
    ],
  },
  {
    id: 'CSD.WRI',
    name: 'Composing and writing',
    skills: [
      { id: 'CS.WRI.CLAIM', name: 'Argumentative claim', description: 'States a clear, defensible position.' },
      { id: 'CS.WRI.THESIS', name: 'Informational and explanatory thesis', description: 'Frames a focused, informative thesis.' },
      { id: 'CS.WRI.NARRATIVE', name: 'Narrative', description: 'Tells a story with purpose, pacing, and detail.' },
      { id: 'CS.WRI.COUNTER', name: 'Counterclaims', description: 'Takes opposing views seriously and answers them.', shift: -1 },
      { id: 'CS.WRI.EVSELECT', name: 'Selection of evidence', description: 'Picks the evidence that best supports the point.' },
      { id: 'CS.WRI.EVEXPLAIN', name: 'Explanation of evidence', description: 'Says how the evidence proves the point.' },
      { id: 'CS.WRI.EVINTEGRATE', name: 'Integration of evidence', description: 'Weaves evidence into the writing so it reads as one piece.' },
      { id: 'CS.WRI.ORG', name: 'Organization', description: 'Orders ideas so the reader can follow, with transitions that carry the logic.' },
      { id: 'CS.WRI.INTROCONC', name: 'Introduction and conclusion', description: 'Opens with purpose and closes with meaning.' },
    ],
  },
  {
    id: 'CSD.SPK',
    name: 'Speaking and listening',
    skills: [
      { id: 'CS.SPK.DISCUSS', name: 'Discussion and contribution', description: 'Moves a conversation forward with ideas that build on others.' },
      { id: 'CS.SPK.PREP', name: 'Preparation', description: 'Comes ready with the reading done and a stance to test.' },
      { id: 'CS.SPK.NORMS', name: 'Norms and active listening', description: 'Listens to understand and keeps the group’s agreements.' },
    ],
  },
  {
    id: 'CSD.PRD',
    name: 'Products and presentations',
    skills: [
      { id: 'CS.PRD.STYLE', name: 'Style and language', description: 'Matches tone and word choice to audience and purpose.' },
      { id: 'CS.PRD.ORAL', name: 'Oral presentation', description: 'Presents clearly with voice, pacing, and presence.' },
      { id: 'CS.PRD.MMWRITTEN', name: 'Multimedia in written production', description: 'Uses visuals and media to strengthen written work.' },
      { id: 'CS.PRD.MMORAL', name: 'Multimedia in oral presentation', description: 'Uses media to support, never replace, the spoken message.' },
      { id: 'CS.PRD.CONVENTIONS', name: 'Conventions', description: 'Uses grammar, usage, and mechanics that help the reader.' },
      { id: 'CS.PRD.PRECISION', name: 'Precision', description: 'Says exactly what is meant with the right level of detail.' },
    ],
  },
]

const BASE_EXPECTATION: Record<Level, number> = { expose: 3, explore: 4, pursue: 5, launch: 6 }

export function cognitiveOutcomes(): Outcome[] {
  const out: Outcome[] = []
  for (const d of COGNITIVE_DOMAINS) {
    d.skills.forEach((s, i) => {
      const shift = s.shift ?? 0
      const prev = i > 0 ? d.skills[i - 1].id : null
      out.push({
        id: s.id,
        family: 'cognitive',
        domain: d.name,
        name: s.name,
        description: s.description,
        level_expectations: {
          expose: Math.max(1, BASE_EXPECTATION.expose + shift),
          explore: Math.max(1, BASE_EXPECTATION.explore + shift),
          pursue: Math.max(1, BASE_EXPECTATION.pursue + shift),
          launch: Math.max(1, BASE_EXPECTATION.launch + shift),
        },
        validation: 'rubric_score',
        prerequisites: prev ? [prev] : [],
      })
    })
  }
  return out
}

/** Authored progression within each domain: each skill builds toward the next in its domain. */
export function cognitiveProgressionEdges(): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = []
  for (const d of COGNITIVE_DOMAINS) {
    for (let i = 1; i < d.skills.length; i++) edges.push({ from: d.skills[i - 1].id, to: d.skills[i].id })
  }
  // Cross-domain edges from the rubric's own logic.
  edges.push({ from: 'CS.SRC.SYNTH', to: 'CS.WRI.EVINTEGRATE' })
  edges.push({ from: 'CS.ANA.JUSTIFY', to: 'CS.WRI.EVEXPLAIN' })
  edges.push({ from: 'CS.WRI.CLAIM', to: 'CS.WRI.COUNTER' })
  edges.push({ from: 'CS.ANA.CRITIQUE', to: 'CS.WRI.COUNTER' })
  edges.push({ from: 'CS.INQ.COLLECT', to: 'CS.ANA.INTERPRET' })
  edges.push({ from: 'CS.ANA.INTERPRET', to: 'CS.ANA.MODEL' })
  edges.push({ from: 'CS.WRI.ORG', to: 'CS.PRD.ORAL' })
  edges.push({ from: 'CS.SPK.PREP', to: 'CS.SPK.DISCUSS' })
  return edges
}
