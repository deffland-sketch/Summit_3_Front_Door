import type { Outcome } from '@/model'

/** CCSS ELA anchor standards plus the grades 9 to 10 band. Reference nodes under the cognitive skills; never scored. */
export interface ElaStandardDef {
  id: string
  name: string
  supports: string[]
}

const R = (n: number, name: string, supports: string[]): ElaStandardDef => ({ id: `CCSS.ELA.CCRA.R.${n}`, name, supports })
const W = (n: number, name: string, supports: string[]): ElaStandardDef => ({ id: `CCSS.ELA.CCRA.W.${n}`, name, supports })
const SL = (n: number, name: string, supports: string[]): ElaStandardDef => ({ id: `CCSS.ELA.CCRA.SL.${n}`, name, supports })
const L = (n: number, name: string, supports: string[]): ElaStandardDef => ({ id: `CCSS.ELA.CCRA.L.${n}`, name, supports })

export const ELA_ANCHORS: ElaStandardDef[] = [
  R(1, 'Read closely and cite textual evidence', ['CS.TXT.DEV', 'CS.WRI.EVSELECT', 'CS.ANA.CONNECT']),
  R(2, 'Determine central ideas or themes and summarize', ['CS.TXT.THEME']),
  R(3, 'Analyze how individuals, events, and ideas develop', ['CS.TXT.DEV']),
  R(4, 'Interpret words and phrases and how they shape meaning', ['CS.TXT.WORD']),
  R(5, 'Analyze the structure of texts', ['CS.TXT.STRUCT']),
  R(6, 'Assess how point of view or purpose shapes a text', ['CS.TXT.POV']),
  R(7, 'Integrate and evaluate content in diverse media', ['CS.SRC.SYNTH', 'CS.PRD.MMWRITTEN']),
  R(8, 'Evaluate the argument and specific claims in a text', ['CS.ANA.CRITIQUE', 'CS.WRI.COUNTER', 'CS.WRI.CLAIM']),
  R(9, 'Analyze how two or more texts address similar themes', ['CS.ANA.COMPARE', 'CS.SRC.SYNTH']),
  R(10, 'Read and comprehend complex texts independently', ['CS.SPK.PREP']),
  W(1, 'Write arguments to support claims with valid reasoning', ['CS.WRI.CLAIM', 'CS.WRI.COUNTER', 'CS.WRI.EVSELECT', 'CS.WRI.EVEXPLAIN']),
  W(2, 'Write informative or explanatory texts', ['CS.WRI.THESIS', 'CS.WRI.EVEXPLAIN']),
  W(3, 'Write narratives to develop real or imagined experiences', ['CS.WRI.NARRATIVE']),
  W(4, 'Produce clear and coherent writing for task, purpose, audience', ['CS.WRI.ORG', 'CS.PRD.STYLE']),
  W(5, 'Develop and strengthen writing by planning, revising, editing', ['CS.WRI.ORG', 'CS.PRD.CONVENTIONS']),
  W(6, 'Use technology to produce and publish writing', ['CS.PRD.MMWRITTEN']),
  W(7, 'Conduct short and sustained research projects', ['CS.INQ.QUESTION', 'CS.SRC.SELECT']),
  W(8, 'Gather relevant information from multiple sources', ['CS.SRC.SELECT', 'CS.SRC.CONTEXT', 'CS.WRI.EVINTEGRATE']),
  W(9, 'Draw evidence from texts to support analysis', ['CS.WRI.EVSELECT', 'CS.WRI.EVEXPLAIN', 'CS.WRI.EVINTEGRATE']),
  W(10, 'Write routinely over extended and shorter time frames', ['CS.WRI.INTROCONC']),
  SL(1, 'Prepare for and participate in a range of conversations', ['CS.SPK.PREP', 'CS.SPK.DISCUSS', 'CS.SPK.NORMS']),
  SL(2, 'Integrate and evaluate information presented in diverse media', ['CS.ANA.INTERPRET', 'CS.PRD.MMORAL']),
  SL(3, 'Evaluate a speaker’s point of view, reasoning, and evidence', ['CS.ANA.CRITIQUE']),
  SL(4, 'Present information so listeners can follow the reasoning', ['CS.PRD.ORAL']),
  SL(5, 'Make strategic use of digital media in presentations', ['CS.PRD.MMORAL']),
  SL(6, 'Adapt speech to a variety of contexts and tasks', ['CS.PRD.STYLE', 'CS.PRD.ORAL']),
  L(1, 'Command the conventions of standard English grammar', ['CS.PRD.CONVENTIONS']),
  L(2, 'Command capitalization, punctuation, and spelling', ['CS.PRD.CONVENTIONS']),
  L(3, 'Apply knowledge of language in different contexts', ['CS.PRD.STYLE']),
  L(4, 'Determine the meaning of unknown words', ['CS.TXT.WORD']),
  L(5, 'Understand figurative language and nuances in word meanings', ['CS.TXT.WORD', 'CS.PRD.PRECISION']),
  L(6, 'Acquire and use academic and domain-specific words', ['CS.PRD.PRECISION']),
]

/** Grade-band 9 to 10 versions of the reading and writing standards, as reference nodes beneath the anchors. */
export function elaBand(): ElaStandardDef[] {
  const band: ElaStandardDef[] = []
  const rl = ['Cite strong textual evidence', 'Determine a theme and analyze its development', 'Analyze complex characters', 'Determine meaning of words and figurative language', 'Analyze author’s choices about structure', 'Analyze a point of view from outside the United States', 'Analyze a subject in two artistic mediums', 'Analyze how an author draws on source material', 'Read and comprehend literature at the 9 to 10 band']
  const ri = ['Cite strong textual evidence in informational text', 'Determine a central idea and its development', 'Analyze how an author unfolds a series of ideas', 'Determine technical and connotative meanings', 'Analyze how an author’s ideas are developed by sentences and paragraphs', 'Determine an author’s point of view and rhetoric', 'Analyze accounts in different mediums', 'Evaluate the argument and claims in a text', 'Analyze seminal U.S. documents', 'Read and comprehend nonfiction at the 9 to 10 band']
  const w = ['Write arguments with precise claims and counterclaims', 'Write informative texts with well-chosen facts', 'Write narratives with effective technique', 'Produce clear writing for task and audience', 'Strengthen writing by revising for purpose', 'Use technology to publish and update writing', 'Conduct research projects answering a question', 'Gather information from authoritative sources', 'Draw evidence from texts for analysis', 'Write routinely for a range of tasks']
  rl.forEach((name, i) => band.push({ id: `CCSS.ELA.RL.9-10.${i + 1}`, name, supports: [i === 1 ? 'CS.TXT.THEME' : i === 2 ? 'CS.TXT.DEV' : i === 3 ? 'CS.TXT.WORD' : i === 4 ? 'CS.TXT.STRUCT' : i === 5 ? 'CS.TXT.POV' : i === 6 ? 'CS.ANA.COMPARE' : i === 7 ? 'CS.SRC.CONTEXT' : 'CS.WRI.EVSELECT'] }))
  ri.forEach((name, i) => band.push({ id: `CCSS.ELA.RI.9-10.${i + 1}`, name, supports: [i === 1 ? 'CS.TXT.THEME' : i === 2 ? 'CS.TXT.DEV' : i === 3 ? 'CS.TXT.WORD' : i === 4 ? 'CS.TXT.STRUCT' : i === 5 ? 'CS.TXT.POV' : i === 6 ? 'CS.SRC.SYNTH' : i === 7 ? 'CS.ANA.CRITIQUE' : i === 8 ? 'CS.SRC.CONTEXT' : 'CS.WRI.EVSELECT'].concat(i === 7 ? ['CS.WRI.CLAIM'] : []) }))
  w.forEach((name, i) => band.push({ id: `CCSS.ELA.W.9-10.${i + 1}`, name, supports: [i === 0 ? 'CS.WRI.CLAIM' : i === 1 ? 'CS.WRI.THESIS' : i === 2 ? 'CS.WRI.NARRATIVE' : i === 3 ? 'CS.WRI.ORG' : i === 4 ? 'CS.WRI.ORG' : i === 5 ? 'CS.PRD.MMWRITTEN' : i === 6 ? 'CS.INQ.QUESTION' : i === 7 ? 'CS.SRC.SELECT' : i === 8 ? 'CS.WRI.EVINTEGRATE' : 'CS.WRI.INTROCONC'] }))
  return band
}

export function elaStandards(): ElaStandardDef[] {
  return [...ELA_ANCHORS, ...elaBand()]
}

export function elaOutcomes(): Outcome[] {
  return elaStandards().map((s) => ({
    id: s.id,
    family: 'content',
    domain: s.id.includes('.W.') ? 'ELA writing' : s.id.includes('.SL.') ? 'ELA speaking and listening' : s.id.includes('.L.') ? 'ELA language' : 'ELA reading',
    name: s.name,
    description: 'Common Core ELA, reference only. Sits beneath the cognitive skills and is never scored on its own.',
    level_expectations: null,
    validation: 'rubric_score',
    prerequisites: [],
  }))
}
