/**
 * Experience templates, credentials, careers, and pathways for the sandbox (Spec 10).
 * Every edge authored here carries confidence 0.7. Career ids are authored; Futre ids replace them later.
 */
export interface ExperienceTemplateDef {
  id: string
  title: string
  provider_kind: 'parks' | 'newsroom' | 'hospital' | 'college' | 'workplace' | 'school'
  level: 'expose' | 'explore' | 'pursue'
  teaches: string[]
  requires: string[]
  leads_to: string[]
}
export interface CredentialDef {
  id: string
  title: string
  kind: 'certificate' | 'college_credit' | 'badge'
  requires: string[]
  leads_to: string[]
}
export interface CareerDef {
  id: string
  title: string
  cluster: string
  wage_band: 'entry' | 'middle' | 'high'
}
export interface PathwayDef {
  id: string
  title: string
  career_ids: string[]
  requires: string[]
  experiences: string[]
  credentials: string[]
}

export const EXPERIENCE_TEMPLATES: ExperienceTemplateDef[] = [
  { id: 'XT.PARKS.WATER', title: 'Water-quality study with the parks department', provider_kind: 'parks', level: 'expose', teaches: ['CS.INQ.COLLECT', 'CS.ANA.INTERPRET', 'HOS.CURIOSITY'], requires: [], leads_to: ['CR.FIELD_SAFETY'] },
  { id: 'XT.PARKS.TRAIL', title: 'Trail crew and habitat restoration', provider_kind: 'parks', level: 'expose', teaches: ['HOS.TENACITY', 'HOS.SOCIAL', 'CS.INQ.QUESTION'], requires: [], leads_to: [] },
  { id: 'XT.PARKS.NATURALIST', title: 'Junior naturalist program', provider_kind: 'parks', level: 'explore', teaches: ['CS.ANA.MODEL', 'CS.PRD.ORAL', 'HOS.CIVIC_IDENTITY'], requires: ['CS.INQ.COLLECT'], leads_to: ['CR.NATURALIST'] },
  { id: 'XT.PARKS.SEASONAL', title: 'Seasonal parks aide placement', provider_kind: 'parks', level: 'pursue', teaches: ['HOS.AGENCY', 'HOS.SELF_DIRECTION', 'CS.ANA.JUSTIFY'], requires: ['CR.FIELD_SAFETY'], leads_to: ['PW.PARKS'] },
  { id: 'XT.NEWS.SHADOW', title: 'Newsroom shadow day', provider_kind: 'newsroom', level: 'expose', teaches: ['CS.INQ.QUESTION', 'HOS.CURIOSITY'], requires: [], leads_to: [] },
  { id: 'XT.NEWS.LOCAL', title: 'Local reporting apprenticeship', provider_kind: 'newsroom', level: 'explore', teaches: ['CS.SRC.SELECT', 'CS.SRC.CONTEXT', 'CS.WRI.CLAIM', 'CS.PRD.PRECISION'], requires: ['CS.WRI.EVSELECT'], leads_to: ['CR.PUBLISHED_PIECE'] },
  { id: 'XT.NEWS.DESK', title: 'Community desk placement', provider_kind: 'newsroom', level: 'pursue', teaches: ['CS.WRI.COUNTER', 'CS.SRC.SYNTH', 'CS.ANA.CRITIQUE', 'HOS.AGENCY'], requires: ['CR.PUBLISHED_PIECE'], leads_to: ['PW.JOURNALISM'] },
  { id: 'XT.NEWS.PODCAST', title: 'Student podcast production', provider_kind: 'newsroom', level: 'explore', teaches: ['CS.PRD.MMORAL', 'CS.PRD.ORAL', 'CS.WRI.NARRATIVE'], requires: [], leads_to: [] },
  { id: 'XT.HOSP.TOUR', title: 'Hospital careers tour', provider_kind: 'hospital', level: 'expose', teaches: ['HOS.RELEVANCE', 'CS.INQ.QUESTION'], requires: [], leads_to: [] },
  { id: 'XT.HOSP.VOLUNTEER', title: 'Patient services volunteering', provider_kind: 'hospital', level: 'explore', teaches: ['HOS.SOCIAL', 'HOS.SELF_REGULATION', 'CS.SPK.NORMS'], requires: [], leads_to: ['CR.BLS'] },
  { id: 'XT.HOSP.ROTATION', title: 'Clinical rotation shadowing', provider_kind: 'hospital', level: 'pursue', teaches: ['CS.ANA.INTERPRET', 'CS.PRD.PRECISION', 'HOS.EXEC_FUNCTION'], requires: ['CR.BLS', 'CS.ANA.INTERPRET'], leads_to: ['CR.CNA', 'PW.NURSING'] },
  { id: 'XT.HOSP.LAB', title: 'Hospital lab observation', provider_kind: 'hospital', level: 'explore', teaches: ['CS.INQ.DESIGN', 'CS.INQ.COLLECT'], requires: [], leads_to: [] },
  { id: 'XT.COLLEGE.INTRO_CS', title: 'Dual enrollment: introduction to computer science', provider_kind: 'college', level: 'pursue', teaches: ['CS.ANA.MODEL', 'CS.PRD.PRECISION', 'HOS.TENACITY'], requires: ['CCSS.HSF-IF.A.1', 'CCSS.HSF-BF.A.1'], leads_to: ['CR.CS_CREDIT', 'PW.SOFTWARE'] },
  { id: 'XT.COLLEGE.STATS', title: 'Dual enrollment: introductory statistics', provider_kind: 'college', level: 'pursue', teaches: ['CS.ANA.INTERPRET', 'CS.INQ.DESIGN'], requires: ['CCSS.HSS-ID.C.7', 'CCSS.HSS-IC.A.1'], leads_to: ['CR.STATS_CREDIT'] },
  { id: 'XT.COLLEGE.COMP', title: 'Dual enrollment: college composition', provider_kind: 'college', level: 'pursue', teaches: ['CS.WRI.THESIS', 'CS.WRI.ORG', 'CS.WRI.EVINTEGRATE'], requires: ['CS.WRI.CLAIM', 'CS.WRI.EVEXPLAIN'], leads_to: ['CR.COMP_CREDIT'] },
  { id: 'XT.COLLEGE.EDU', title: 'Dual enrollment: introduction to education', provider_kind: 'college', level: 'pursue', teaches: ['CS.ANA.CONNECT', 'CS.SPK.DISCUSS', 'HOS.CIVIC_IDENTITY'], requires: ['CS.SPK.DISCUSS'], leads_to: ['CR.EDU_CREDIT', 'PW.TEACHING'] },
  { id: 'XT.COLLEGE.VISIT', title: 'Community college visit day', provider_kind: 'college', level: 'expose', teaches: ['HOS.RELEVANCE', 'HOS.SELF_AWARENESS'], requires: [], leads_to: [] },
  { id: 'XT.WORK.MAKER', title: 'Maker space build week', provider_kind: 'workplace', level: 'expose', teaches: ['CS.INQ.DESIGN', 'HOS.GROWTH_MINDSET'], requires: [], leads_to: [] },
  { id: 'XT.WORK.DESIGN', title: 'Design studio apprenticeship', provider_kind: 'workplace', level: 'explore', teaches: ['CS.PRD.MMWRITTEN', 'CS.PRD.STYLE', 'CS.ANA.CRITIQUE'], requires: [], leads_to: ['CR.DESIGN_PORTFOLIO', 'PW.DESIGN'] },
  { id: 'XT.WORK.TRADES', title: 'Electrical trades pre-apprenticeship', provider_kind: 'workplace', level: 'explore', teaches: ['CS.PRD.PRECISION', 'HOS.EXEC_FUNCTION', 'CCSS.HSA-CED.A.1'], requires: ['CCSS.HSA-REI.B.3'], leads_to: ['CR.OSHA10', 'PW.TRADES'] },
  { id: 'XT.WORK.CODE', title: 'Software team internship', provider_kind: 'workplace', level: 'pursue', teaches: ['CS.ANA.MODEL', 'CS.SPK.NORMS', 'HOS.SELF_DIRECTION'], requires: ['CR.CS_CREDIT'], leads_to: ['PW.SOFTWARE'] },
  { id: 'XT.WORK.BUSINESS', title: 'Small business operations placement', provider_kind: 'workplace', level: 'pursue', teaches: ['CS.ANA.INTERPRET', 'HOS.AGENCY', 'CCSS.HSS-ID.B.6'], requires: ['CCSS.HSS-ID.A.2'], leads_to: ['CR.BUSINESS_BADGE', 'PW.BUSINESS'] },
  { id: 'XT.WORK.PAID', title: 'Paid work placement with reflection', provider_kind: 'workplace', level: 'pursue', teaches: ['HOS.SELF_DIRECTION', 'HOS.RESILIENCE', 'HOS.RELEVANCE'], requires: [], leads_to: [] },
  { id: 'XT.SCHOOL.TUTOR', title: 'Peer tutoring in math', provider_kind: 'school', level: 'explore', teaches: ['CS.ANA.JUSTIFY', 'CS.SPK.NORMS', 'HOS.SOCIAL'], requires: ['CCSS.HSA-REI.C.6'], leads_to: ['PW.TEACHING'] },
  { id: 'XT.SCHOOL.EXHIBITION', title: 'Exhibition night host', provider_kind: 'school', level: 'explore', teaches: ['CS.PRD.ORAL', 'HOS.BELONGING'], requires: [], leads_to: [] },
  { id: 'XT.SCHOOL.DEFENSE', title: 'Launch plan defense', provider_kind: 'school', level: 'pursue', teaches: ['CS.PRD.ORAL', 'CS.WRI.CLAIM', 'HOS.SELF_AWARENESS'], requires: ['CS.PRD.ORAL', 'CS.WRI.CLAIM'], leads_to: ['CR.LAUNCH_DEFENSE'] },
]

export const CREDENTIALS: CredentialDef[] = [
  { id: 'CR.FIELD_SAFETY', title: 'Field safety certificate', kind: 'certificate', requires: ['CS.INQ.COLLECT'], leads_to: ['PW.PARKS'] },
  { id: 'CR.NATURALIST', title: 'Junior naturalist badge', kind: 'badge', requires: ['CS.ANA.MODEL', 'CS.PRD.ORAL'], leads_to: ['PW.PARKS'] },
  { id: 'CR.PUBLISHED_PIECE', title: 'Published reporting piece', kind: 'badge', requires: ['CS.WRI.CLAIM', 'CS.SRC.CONTEXT', 'CS.PRD.PRECISION'], leads_to: ['PW.JOURNALISM'] },
  { id: 'CR.BLS', title: 'Basic life support certificate', kind: 'certificate', requires: ['HOS.SELF_REGULATION'], leads_to: ['PW.NURSING'] },
  { id: 'CR.CNA', title: 'Certified nursing assistant', kind: 'certificate', requires: ['CR.BLS', 'CS.ANA.INTERPRET', 'CS.PRD.PRECISION'], leads_to: ['PW.NURSING'] },
  { id: 'CR.CS_CREDIT', title: 'College credit: introduction to computer science', kind: 'college_credit', requires: ['CCSS.HSF-IF.A.1', 'CCSS.HSF-BF.A.1', 'CS.ANA.MODEL'], leads_to: ['PW.SOFTWARE'] },
  { id: 'CR.STATS_CREDIT', title: 'College credit: introductory statistics', kind: 'college_credit', requires: ['CCSS.HSS-ID.C.7', 'CCSS.HSS-IC.B.4', 'CS.ANA.INTERPRET'], leads_to: ['PW.BUSINESS', 'PW.ENVIRO'] },
  { id: 'CR.COMP_CREDIT', title: 'College credit: college composition', kind: 'college_credit', requires: ['CS.WRI.THESIS', 'CS.WRI.ORG', 'CS.WRI.EVINTEGRATE'], leads_to: ['PW.JOURNALISM', 'PW.TEACHING'] },
  { id: 'CR.EDU_CREDIT', title: 'College credit: introduction to education', kind: 'college_credit', requires: ['CS.SPK.DISCUSS', 'CS.ANA.CONNECT'], leads_to: ['PW.TEACHING'] },
  { id: 'CR.DESIGN_PORTFOLIO', title: 'Design portfolio review passed', kind: 'badge', requires: ['CS.PRD.MMWRITTEN', 'CS.PRD.STYLE'], leads_to: ['PW.DESIGN'] },
  { id: 'CR.OSHA10', title: 'OSHA 10 construction safety', kind: 'certificate', requires: ['CS.PRD.PRECISION', 'HOS.EXEC_FUNCTION'], leads_to: ['PW.TRADES'] },
  { id: 'CR.BUSINESS_BADGE', title: 'Small business operations badge', kind: 'badge', requires: ['CCSS.HSS-ID.B.6', 'CS.ANA.INTERPRET'], leads_to: ['PW.BUSINESS'] },
  { id: 'CR.LAUNCH_DEFENSE', title: 'Launch plan defended', kind: 'badge', requires: ['CS.PRD.ORAL', 'CS.WRI.CLAIM', 'HOS.SELF_AWARENESS'], leads_to: [] },
]

export const CAREERS: CareerDef[] = [
  { id: 'CA.RN', title: 'Registered nurse', cluster: 'Health science', wage_band: 'high' },
  { id: 'CA.MEDASSIST', title: 'Medical assistant', cluster: 'Health science', wage_band: 'middle' },
  { id: 'CA.SOFTWARE_DEV', title: 'Software developer', cluster: 'Information technology', wage_band: 'high' },
  { id: 'CA.DATA_ANALYST', title: 'Data analyst', cluster: 'Information technology', wage_band: 'high' },
  { id: 'CA.ELECTRICIAN', title: 'Electrician', cluster: 'Architecture and construction', wage_band: 'middle' },
  { id: 'CA.HVAC', title: 'HVAC technician', cluster: 'Architecture and construction', wage_band: 'middle' },
  { id: 'CA.REPORTER', title: 'Reporter', cluster: 'Arts and communication', wage_band: 'middle' },
  { id: 'CA.PRODUCER', title: 'Audio producer', cluster: 'Arts and communication', wage_band: 'middle' },
  { id: 'CA.PARK_RANGER', title: 'Park ranger', cluster: 'Agriculture and natural resources', wage_band: 'middle' },
  { id: 'CA.ENV_SCIENTIST', title: 'Environmental scientist', cluster: 'Science and engineering', wage_band: 'high' },
  { id: 'CA.TEACHER', title: 'Teacher', cluster: 'Education and training', wage_band: 'middle' },
  { id: 'CA.COUNSELOR', title: 'School counselor', cluster: 'Education and training', wage_band: 'middle' },
  { id: 'CA.BIZ_OWNER', title: 'Small business owner', cluster: 'Business and finance', wage_band: 'middle' },
  { id: 'CA.ACCOUNTANT', title: 'Accountant', cluster: 'Business and finance', wage_band: 'high' },
  { id: 'CA.UX_DESIGNER', title: 'UX designer', cluster: 'Arts and communication', wage_band: 'high' },
  { id: 'CA.GRAPHIC_DESIGNER', title: 'Graphic designer', cluster: 'Arts and communication', wage_band: 'middle' },
]

export const PATHWAYS: PathwayDef[] = [
  { id: 'PW.NURSING', title: 'Nursing', career_ids: ['CA.RN', 'CA.MEDASSIST'], requires: ['CR.BLS', 'CR.CNA', 'CS.ANA.INTERPRET', 'CS.PRD.PRECISION', 'CCSS.HSS-ID.A.2', 'HOS.SELF_REGULATION'], experiences: ['XT.HOSP.TOUR', 'XT.HOSP.VOLUNTEER', 'XT.HOSP.ROTATION'], credentials: ['CR.BLS', 'CR.CNA'] },
  { id: 'PW.SOFTWARE', title: 'Software', career_ids: ['CA.SOFTWARE_DEV', 'CA.DATA_ANALYST'], requires: ['CR.CS_CREDIT', 'CS.ANA.MODEL', 'CS.PRD.PRECISION', 'CCSS.HSF-IF.A.1', 'CCSS.HSF-BF.A.1', 'CCSS.HSA-REI.C.6', 'HOS.SELF_DIRECTION'], experiences: ['XT.WORK.MAKER', 'XT.COLLEGE.INTRO_CS', 'XT.WORK.CODE'], credentials: ['CR.CS_CREDIT'] },
  { id: 'PW.TRADES', title: 'Electrical trades', career_ids: ['CA.ELECTRICIAN', 'CA.HVAC'], requires: ['CR.OSHA10', 'CCSS.HSA-REI.B.3', 'CCSS.HSA-CED.A.1', 'CS.PRD.PRECISION', 'HOS.EXEC_FUNCTION'], experiences: ['XT.WORK.MAKER', 'XT.WORK.TRADES'], credentials: ['CR.OSHA10'] },
  { id: 'PW.JOURNALISM', title: 'Journalism', career_ids: ['CA.REPORTER', 'CA.PRODUCER'], requires: ['CR.PUBLISHED_PIECE', 'CS.WRI.CLAIM', 'CS.SRC.CONTEXT', 'CS.SRC.SYNTH', 'CS.WRI.COUNTER', 'HOS.CURIOSITY'], experiences: ['XT.NEWS.SHADOW', 'XT.NEWS.LOCAL', 'XT.NEWS.DESK', 'XT.NEWS.PODCAST'], credentials: ['CR.PUBLISHED_PIECE', 'CR.COMP_CREDIT'] },
  { id: 'PW.PARKS', title: 'Parks and environmental science', career_ids: ['CA.PARK_RANGER', 'CA.ENV_SCIENTIST'], requires: ['CR.FIELD_SAFETY', 'CS.INQ.COLLECT', 'CS.ANA.INTERPRET', 'CS.ANA.MODEL', 'HOS.CIVIC_IDENTITY'], experiences: ['XT.PARKS.WATER', 'XT.PARKS.TRAIL', 'XT.PARKS.NATURALIST', 'XT.PARKS.SEASONAL'], credentials: ['CR.FIELD_SAFETY', 'CR.NATURALIST'] },
  { id: 'PW.ENVIRO', title: 'Environmental science (college route)', career_ids: ['CA.ENV_SCIENTIST'], requires: ['CR.STATS_CREDIT', 'CCSS.HSS-ID.C.7', 'CCSS.HSS-IC.B.4', 'CS.INQ.DESIGN', 'CS.ANA.INTERPRET'], experiences: ['XT.PARKS.WATER', 'XT.COLLEGE.STATS'], credentials: ['CR.STATS_CREDIT'] },
  { id: 'PW.TEACHING', title: 'Teaching', career_ids: ['CA.TEACHER', 'CA.COUNSELOR'], requires: ['CR.EDU_CREDIT', 'CS.SPK.DISCUSS', 'CS.ANA.JUSTIFY', 'CS.ANA.CONNECT', 'HOS.SOCIAL', 'HOS.CIVIC_IDENTITY'], experiences: ['XT.SCHOOL.TUTOR', 'XT.COLLEGE.EDU'], credentials: ['CR.EDU_CREDIT', 'CR.COMP_CREDIT'] },
  { id: 'PW.BUSINESS', title: 'Business', career_ids: ['CA.BIZ_OWNER', 'CA.ACCOUNTANT'], requires: ['CR.BUSINESS_BADGE', 'CCSS.HSS-ID.B.6', 'CCSS.HSS-ID.A.2', 'CS.ANA.INTERPRET', 'HOS.AGENCY'], experiences: ['XT.WORK.BUSINESS', 'XT.WORK.PAID', 'XT.COLLEGE.STATS'], credentials: ['CR.BUSINESS_BADGE', 'CR.STATS_CREDIT'] },
  { id: 'PW.DESIGN', title: 'Design', career_ids: ['CA.UX_DESIGNER', 'CA.GRAPHIC_DESIGNER'], requires: ['CR.DESIGN_PORTFOLIO', 'CS.PRD.MMWRITTEN', 'CS.PRD.STYLE', 'CS.ANA.CRITIQUE', 'HOS.GROWTH_MINDSET'], experiences: ['XT.WORK.MAKER', 'XT.WORK.DESIGN'], credentials: ['CR.DESIGN_PORTFOLIO'] },
]
