/**
 * Authored catalogs for OpenSciEd and the AP courses. Lessons are tagged to cognitive skills only
 * (Spec 1: science and humanities content is carried by Cognitive Skills). Titles follow the
 * public course frameworks.
 */
export interface AuthoredUnit {
  title: string
  skills: string[]
  lessons: string[]
  modes?: ('self_directed' | 'workshop' | 'seminar' | 'lab')[]
}
export interface AuthoredCourse {
  id: string
  title: string
  curriculum: 'openscied' | 'ap_english' | 'ap_history'
  subject: 'science' | 'english' | 'history'
  units: AuthoredUnit[]
}

const SCI_MODES: AuthoredUnit['modes'] = ['self_directed', 'workshop', 'lab']
const HUM_MODES: AuthoredUnit['modes'] = ['self_directed', 'workshop', 'seminar']

export const AUTHORED_COURSES: AuthoredCourse[] = [
  {
    id: 'crs_bio',
    title: 'OpenSciEd Biology',
    curriculum: 'openscied',
    subject: 'science',
    units: [
      { title: 'Ecosystem interactions and dynamics: the Serengeti', skills: ['CS.INQ.QUESTION', 'CS.ANA.MODEL', 'CS.ANA.INTERPRET', 'CS.INQ.HYPOTH'], modes: SCI_MODES, lessons: ['Why do wildebeest migrate?', 'Modeling the Serengeti food web', 'Carrying capacity and limiting factors', 'Interpreting population data', 'Predation and competition', 'Disturbance and resilience', 'Human impacts on the system', 'Explaining the migration'] },
      { title: 'Matter and energy in ecosystems: forest fires', skills: ['CS.ANA.MODEL', 'CS.ANA.JUSTIFY', 'CS.INQ.COLLECT', 'CS.ANA.INTERPRET'], modes: SCI_MODES, lessons: ['What happens to a forest after a fire?', 'Tracing carbon through photosynthesis', 'Cellular respiration and energy flow', 'Decomposers and the carbon cycle', 'Measuring biomass', 'Energy pyramids', 'Modeling carbon on a changing planet', 'Explaining forest recovery'] },
      { title: 'Inheritance and variation of traits', skills: ['CS.ANA.CONNECT', 'CS.ANA.INTERPRET', 'CS.ANA.JUSTIFY', 'CS.INQ.DESIGN'], modes: SCI_MODES, lessons: ['Why do siblings look different?', 'DNA, chromosomes, and genes', 'Meiosis and variation', 'Punnett squares and probability', 'Polygenic and environmental traits', 'Mutations and protein function', 'Genetic testing and ethics', 'Explaining a family pattern'] },
      { title: 'Natural selection and evolution', skills: ['CS.ANA.INTERPRET', 'CS.ANA.JUSTIFY', 'CS.ANA.CRITIQUE', 'CS.SRC.SYNTH'], modes: SCI_MODES, lessons: ['Why are some bacteria resistant?', 'Variation and selection pressure', 'Modeling selection over generations', 'Evidence from the fossil record', 'Speciation', 'Critiquing claims about adaptation', 'Evolution in human timescales', 'Constructing an evolution explanation'] },
      { title: 'Common ancestry and biodiversity', skills: ['CS.ANA.COMPARE', 'CS.SRC.SELECT', 'CS.ANA.JUSTIFY', 'CS.PRD.ORAL'], modes: SCI_MODES, lessons: ['How are whales related to hippos?', 'Comparing anatomy and embryos', 'Reading phylogenetic trees', 'Molecular evidence', 'Biodiversity and extinction', 'Designing a conservation plan', 'Presenting the evidence', 'Unit synthesis'] },
      { title: 'Body systems and homeostasis', skills: ['CS.ANA.MODEL', 'CS.INQ.DESIGN', 'CS.INQ.COLLECT', 'CS.ANA.INTERPRET'], modes: SCI_MODES, lessons: ['Why does exercise change breathing?', 'Feedback loops', 'Designing a heart-rate investigation', 'Collecting and graphing the data', 'Cells, tissues, organs', 'When systems fail', 'Modeling the immune response', 'Explaining homeostasis'] },
    ],
  },
  {
    id: 'crs_chem',
    title: 'OpenSciEd Chemistry',
    curriculum: 'openscied',
    subject: 'science',
    units: [
      { title: 'Polar ice and climate: thermal energy', skills: ['CS.INQ.QUESTION', 'CS.ANA.MODEL', 'CS.ANA.INTERPRET', 'CS.INQ.COLLECT'], modes: SCI_MODES, lessons: ['Why is Arctic ice melting faster?', 'Energy transfer and temperature', 'Specific heat investigations', 'Modeling particles and heat', 'Albedo and feedback', 'Interpreting climate data', 'Phase changes', 'Explaining ice loss'] },
      { title: 'Structure and properties of matter: electrostatics', skills: ['CS.ANA.MODEL', 'CS.ANA.JUSTIFY', 'CS.INQ.HYPOTH', 'CS.INQ.DESIGN'], modes: SCI_MODES, lessons: ['Why does lightning strike?', 'Charge and attraction', 'Atomic structure', 'The periodic table as a pattern', 'Ionic and covalent bonding', 'Predicting properties from structure', 'Designing a bonding investigation', 'Explaining static discharge'] },
      { title: 'Chemical reactions: fuels and combustion', skills: ['CS.ANA.INTERPRET', 'CS.INQ.COLLECT', 'CS.ANA.JUSTIFY', 'CS.ANA.CRITIQUE'], modes: SCI_MODES, lessons: ['Which fuel is cleanest?', 'Conservation of mass', 'Balancing equations', 'Stoichiometry', 'Energy in bonds', 'Measuring reaction heat', 'Critiquing fuel claims', 'Making a fuel recommendation'] },
      { title: 'Reaction rates and equilibrium: oxygen on a space mission', skills: ['CS.INQ.DESIGN', 'CS.ANA.MODEL', 'CS.ANA.INTERPRET', 'CS.PRD.PRECISION'], modes: SCI_MODES, lessons: ['How do astronauts keep breathing?', 'Collision theory', 'Rates and catalysts', 'Equilibrium systems', 'Shifting equilibrium', 'Designing a rate experiment', 'Reporting with precision', 'Designing a life-support system'] },
      { title: 'Solutions and acids: water quality', skills: ['CS.INQ.COLLECT', 'CS.ANA.INTERPRET', 'CS.ANA.JUSTIFY', 'CS.SRC.CONTEXT'], modes: SCI_MODES, lessons: ['Is our water safe?', 'Solubility and concentration', 'Acids, bases, and pH', 'Titration', 'Field sampling methods', 'Interpreting water data', 'Contextualizing water reports', 'Writing a water-quality brief'] },
      { title: 'Nuclear processes and energy choices', skills: ['CS.ANA.COMPARE', 'CS.ANA.CRITIQUE', 'CS.SRC.SYNTH', 'CS.PRD.ORAL'], modes: SCI_MODES, lessons: ['Should we build more reactors?', 'Radioactive decay', 'Fission and fusion', 'Half-life and dating', 'Comparing energy sources', 'Weighing the risks', 'Synthesizing sources', 'Energy town hall'] },
    ],
  },
  {
    id: 'crs_phys',
    title: 'OpenSciEd Physics',
    curriculum: 'openscied',
    subject: 'science',
    units: [
      { title: 'Energy and vehicle collisions', skills: ['CS.INQ.QUESTION', 'CS.ANA.MODEL', 'CS.ANA.INTERPRET', 'CS.INQ.COLLECT'], modes: SCI_MODES, lessons: ['What makes a crash survivable?', 'Kinetic and potential energy', 'Energy transfer in collisions', 'Measuring impulse', 'Momentum conservation', 'Crumple zones', 'Modeling a safer car', 'Explaining crash safety'] },
      { title: 'Forces and motion: earthquakes', skills: ['CS.ANA.MODEL', 'CS.ANA.JUSTIFY', 'CS.INQ.DESIGN', 'CS.ANA.INTERPRET'], modes: SCI_MODES, lessons: ['Why do buildings fall?', 'Newton’s laws', 'Free-body diagrams', 'Acceleration and seismic waves', 'Designing a shake-table test', 'Interpreting the results', 'Resonance', 'Explaining building failure'] },
      { title: 'Gravity and orbits', skills: ['CS.ANA.MODEL', 'CS.ANA.INTERPRET', 'CS.INQ.HYPOTH', 'CS.ANA.CONNECT'], modes: SCI_MODES, lessons: ['How do satellites stay up?', 'Gravitational force', 'Circular motion', 'Kepler’s laws', 'Modeling an orbit', 'Launch and escape', 'Tides and connections', 'Explaining a satellite path'] },
      { title: 'Electromagnetic radiation: microwaves and cell signals', skills: ['CS.ANA.CRITIQUE', 'CS.SRC.SELECT', 'CS.ANA.INTERPRET', 'CS.PRD.PRECISION'], modes: SCI_MODES, lessons: ['Are cell phones safe?', 'Waves and the spectrum', 'Energy of a photon', 'Absorption and heating', 'Evaluating health studies', 'Selecting credible sources', 'Reporting with precision', 'Writing a safety brief'] },
      { title: 'Electricity and magnetism: the grid', skills: ['CS.INQ.DESIGN', 'CS.INQ.COLLECT', 'CS.ANA.MODEL', 'CS.ANA.JUSTIFY'], modes: SCI_MODES, lessons: ['Why did the grid fail?', 'Circuits and current', 'Magnetic fields', 'Induction and generators', 'Building a generator', 'Measuring output', 'Modeling the grid', 'Explaining an outage'] },
      { title: 'Stars and the universe', skills: ['CS.ANA.INTERPRET', 'CS.SRC.SYNTH', 'CS.ANA.JUSTIFY', 'CS.PRD.MMORAL'], modes: SCI_MODES, lessons: ['How do we know how far a star is?', 'Light and spectra', 'Stellar life cycles', 'Interpreting Hubble data', 'The expanding universe', 'Synthesizing the evidence', 'Presenting with media', 'Explaining the big bang evidence'] },
    ],
  },
  {
    id: 'crs_aplang',
    title: 'AP English Language',
    curriculum: 'ap_english',
    subject: 'english',
    units: [
      { title: 'Rhetorical situation and claims', skills: ['CS.TXT.POV', 'CS.WRI.CLAIM', 'CS.SPK.DISCUSS', 'CS.TXT.WORD'], modes: HUM_MODES, lessons: ['Reading the rhetorical situation', 'Audience and purpose', 'Identifying claims', 'Writing a defensible thesis', 'Diction and tone', 'Seminar: speeches that moved people', 'Drafting a rhetorical analysis', 'Revising for clarity'] },
      { title: 'Evidence and reasoning', skills: ['CS.WRI.EVSELECT', 'CS.WRI.EVEXPLAIN', 'CS.ANA.CRITIQUE', 'CS.WRI.EVINTEGRATE'], modes: HUM_MODES, lessons: ['Kinds of evidence', 'Choosing evidence that fits', 'Explaining how evidence works', 'Logical fallacies', 'Critiquing an op-ed', 'Integrating quotations', 'Argument essay draft', 'Peer critique'] },
      { title: 'Organization and style', skills: ['CS.WRI.ORG', 'CS.WRI.INTROCONC', 'CS.PRD.STYLE', 'CS.PRD.CONVENTIONS'], modes: HUM_MODES, lessons: ['Lines of reasoning', 'Transitions that carry logic', 'Introductions that earn attention', 'Conclusions that matter', 'Sentence variety', 'Style for audience', 'Editing conventions', 'Timed rhetorical analysis'] },
      { title: 'Synthesis and sources', skills: ['CS.SRC.SELECT', 'CS.SRC.CONTEXT', 'CS.SRC.SYNTH', 'CS.WRI.COUNTER'], modes: HUM_MODES, lessons: ['Evaluating sources', 'Context behind a source', 'Building a conversation among sources', 'Addressing counterclaims', 'Synthesis essay planning', 'Synthesis essay draft', 'Seminar: who gets to speak?', 'Revision'] },
      { title: 'Argument in the public square', skills: ['CS.WRI.CLAIM', 'CS.WRI.COUNTER', 'CS.SPK.PREP', 'CS.PRD.ORAL'], modes: HUM_MODES, lessons: ['Local issues as arguments', 'Research a position', 'Anticipating objections', 'Writing the argument', 'Preparing a spoken case', 'Delivering the case', 'Responding to questions', 'Reflection on growth'] },
      { title: 'Exam synthesis and portfolio', skills: ['CS.WRI.ORG', 'CS.WRI.EVINTEGRATE', 'CS.PRD.PRECISION', 'CS.TXT.STRUCT'], modes: HUM_MODES, lessons: ['Reading complex nonfiction', 'Structure in long-form essays', 'Timed writing strategy', 'Precision in word choice', 'Portfolio selection', 'Portfolio reflection', 'Mock exam', 'Exam debrief'] },
    ],
  },
  {
    id: 'crs_aplit',
    title: 'AP English Literature',
    curriculum: 'ap_english',
    subject: 'english',
    units: [
      { title: 'Short fiction: character and setting', skills: ['CS.TXT.DEV', 'CS.TXT.THEME', 'CS.WRI.THESIS', 'CS.SPK.DISCUSS'], modes: HUM_MODES, lessons: ['Reading for character', 'Setting as meaning', 'Theme versus topic', 'Writing a literary thesis', 'Seminar: a story in two readings', 'Evidence from the text', 'Short analysis draft', 'Revision'] },
      { title: 'Poetry: structure and figurative language', skills: ['CS.TXT.WORD', 'CS.TXT.STRUCT', 'CS.ANA.CONNECT', 'CS.WRI.EVEXPLAIN'], modes: HUM_MODES, lessons: ['Reading a poem aloud', 'Figurative language', 'Form and structure', 'Sound and sense', 'Connections across poems', 'Explaining a line of evidence', 'Poetry analysis draft', 'Peer feedback'] },
      { title: 'Longer fiction: narration and perspective', skills: ['CS.TXT.POV', 'CS.TXT.DEV', 'CS.ANA.COMPARE', 'CS.WRI.ORG'], modes: HUM_MODES, lessons: ['Who is telling the story?', 'Reliability and irony', 'Character arcs', 'Comparing two narrators', 'Organizing a long essay', 'Drafting', 'Seminar: perspective and power', 'Revision'] },
      { title: 'Drama: conflict and language', skills: ['CS.TXT.THEME', 'CS.TXT.WORD', 'CS.SPK.PREP', 'CS.PRD.ORAL'], modes: HUM_MODES, lessons: ['Reading a play', 'Staging a scene', 'Language in dialogue', 'Theme through conflict', 'Preparing a performance', 'Performing and reflecting', 'Dramatic analysis draft', 'Revision'] },
      { title: 'Literary argument', skills: ['CS.WRI.CLAIM', 'CS.WRI.COUNTER', 'CS.WRI.EVINTEGRATE', 'CS.PRD.STYLE'], modes: HUM_MODES, lessons: ['From interpretation to argument', 'Defensible claims', 'Complexity and counter-readings', 'Weaving evidence', 'Voice and style', 'Timed essay', 'Seminar: what makes a reading strong?', 'Revision'] },
      { title: 'Independent reading and portfolio', skills: ['CS.SRC.SELECT', 'CS.ANA.CONNECT', 'CS.WRI.INTROCONC', 'CS.PRD.PRECISION'], modes: HUM_MODES, lessons: ['Choosing a book', 'Reading journal', 'Connections across texts', 'Introductions and conclusions', 'Portfolio draft', 'Portfolio reflection', 'Mock exam', 'Exam debrief'] },
    ],
  },
  {
    id: 'crs_apworld',
    title: 'AP World History',
    curriculum: 'ap_history',
    subject: 'history',
    units: [
      { title: 'States and networks of exchange, 1200 to 1450', skills: ['CS.SRC.CONTEXT', 'CS.ANA.COMPARE', 'CS.WRI.THESIS', 'CS.SPK.DISCUSS'], modes: HUM_MODES, lessons: ['States in 1200', 'The Silk Roads', 'The Indian Ocean world', 'Comparing empires', 'Reading a source in context', 'Writing a historical thesis', 'Seminar: who benefited from trade?', 'Short answer practice'] },
      { title: 'Land-based and maritime empires, 1450 to 1750', skills: ['CS.SRC.CONTEXT', 'CS.ANA.JUSTIFY', 'CS.WRI.EVSELECT', 'CS.ANA.CRITIQUE'], modes: HUM_MODES, lessons: ['Gunpowder empires', 'Maritime exploration', 'The Columbian exchange', 'Labor systems', 'Selecting evidence', 'Critiquing a historian', 'DBQ practice', 'Revision'] },
      { title: 'Revolutions, 1750 to 1900', skills: ['CS.ANA.CONNECT', 'CS.WRI.CLAIM', 'CS.WRI.EVEXPLAIN', 'CS.SRC.SYNTH'], modes: HUM_MODES, lessons: ['Enlightenment ideas', 'Atlantic revolutions', 'Industrialization', 'Explaining cause and effect', 'Synthesizing sources', 'LEQ draft', 'Seminar: what is a revolution?', 'Revision'] },
      { title: 'Consequences of industrialization', skills: ['CS.ANA.INTERPRET', 'CS.SRC.SELECT', 'CS.ANA.COMPARE', 'CS.WRI.ORG'], modes: HUM_MODES, lessons: ['Imperialism', 'Economic imperialism', 'Migration', 'Interpreting data on trade', 'Comparing responses to imperialism', 'Organizing an essay', 'DBQ draft', 'Revision'] },
      { title: 'Global conflict, 1900 to the present', skills: ['CS.SRC.CONTEXT', 'CS.ANA.JUSTIFY', 'CS.WRI.COUNTER', 'CS.SPK.PREP'], modes: HUM_MODES, lessons: ['The world wars', 'Mass atrocities', 'The Cold War', 'Decolonization', 'Considering counter-arguments', 'Preparing for seminar', 'Seminar: lessons of the century', 'Revision'] },
      { title: 'Globalization and portfolio', skills: ['CS.ANA.CONNECT', 'CS.SRC.SYNTH', 'CS.PRD.MMWRITTEN', 'CS.PRD.ORAL'], modes: HUM_MODES, lessons: ['Technology and globalization', 'Economic change', 'Movements for rights', 'Synthesizing a century', 'Building a multimedia essay', 'Presenting history', 'Mock exam', 'Exam debrief'] },
    ],
  },
  {
    id: 'crs_apush',
    title: 'AP US History',
    curriculum: 'ap_history',
    subject: 'history',
    units: [
      { title: 'Contact and colonization, 1491 to 1754', skills: ['CS.SRC.CONTEXT', 'CS.ANA.COMPARE', 'CS.WRI.THESIS', 'CS.SPK.DISCUSS'], modes: HUM_MODES, lessons: ['Native societies before contact', 'European colonization', 'Comparing colonial regions', 'Slavery and labor', 'Reading sources in context', 'Writing a thesis', 'Seminar: whose history?', 'Short answer practice'] },
      { title: 'Revolution and the early republic, 1754 to 1800', skills: ['CS.ANA.JUSTIFY', 'CS.WRI.EVSELECT', 'CS.WRI.EVEXPLAIN', 'CS.ANA.CRITIQUE'], modes: HUM_MODES, lessons: ['Imperial crisis', 'Declaring independence', 'The Constitution', 'Explaining causes', 'Selecting and explaining evidence', 'Critiquing an interpretation', 'DBQ practice', 'Revision'] },
      { title: 'Expansion, reform, and division, 1800 to 1877', skills: ['CS.ANA.CONNECT', 'CS.WRI.CLAIM', 'CS.SRC.SYNTH', 'CS.WRI.ORG'], modes: HUM_MODES, lessons: ['Market revolution', 'Reform movements', 'Sectional crisis', 'The Civil War', 'Reconstruction', 'Synthesizing sources', 'LEQ draft', 'Revision'] },
      { title: 'Industry, empire, and progressivism, 1865 to 1945', skills: ['CS.ANA.INTERPRET', 'CS.SRC.SELECT', 'CS.ANA.COMPARE', 'CS.WRI.COUNTER'], modes: HUM_MODES, lessons: ['The Gilded Age', 'Progressivism', 'World War I', 'The Depression and the New Deal', 'Interpreting economic data', 'Answering counter-arguments', 'DBQ draft', 'Revision'] },
      { title: 'Cold War, civil rights, and change, 1945 to 1980', skills: ['CS.SRC.CONTEXT', 'CS.ANA.JUSTIFY', 'CS.SPK.PREP', 'CS.PRD.ORAL'], modes: HUM_MODES, lessons: ['Containment', 'The civil rights movement', 'The Great Society', 'Vietnam', 'Preparing a position', 'Seminar: the long civil rights movement', 'Presenting an argument', 'Revision'] },
      { title: 'Contemporary America and portfolio', skills: ['CS.ANA.CONNECT', 'CS.SRC.SYNTH', 'CS.PRD.MMWRITTEN', 'CS.PRD.PRECISION'], modes: HUM_MODES, lessons: ['Conservatism and change', 'Globalization at home', 'Technology and society', 'Synthesizing an era', 'Multimedia essay', 'Precision in historical writing', 'Mock exam', 'Exam debrief'] },
    ],
  },
]
