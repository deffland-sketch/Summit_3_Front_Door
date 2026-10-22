# Spec 10: The Knowledge Graph (Basic, V1)

Summit 3.0 Homebase · Working draft v1 · October 20, 2026

The knowledge graph is the structured map the engine walks: what builds toward what, what supports what, and where a pathway leads. In the full Summit 3.0 design its edges carry weights learned from alumni trajectories and labor market outcomes. In v1 it is a basic graph with typed, unweighted edges, authored from Summit's own frameworks and the open Learning Commons data, so the engine's "in reach" and "what this unlocks" answers come from a real structure rather than a lookup table.

## Modeled On the Learning Commons Knowledge Graph

The Learning Commons Knowledge Graph (learningcommons.org, CC BY 4.0, published as `nodes.jsonl` and `relationships.jsonl` on a public CDN at `https://cdn.learningcommons.org/knowledge-graph/<version>/exports/`) holds academic standards for every state, learning components beneath them, learning progressions, and curriculum alignments. Three facts about its shape matter for us and are carried into this design:

- Standards sit on a Multi-State (Common Core) hub; state versions align to the hub, never to each other.
- Progression edges exist only on the Multi-State math hub. ELA, science, and social studies standards have none, which is why cognitive skills, not ELA standards, carry progression for us.
- Learning components are the fine-grained skills under a standard and are what curriculum aligns to. That is the layer a lesson should point at.

Its relationship vocabulary, which we adopt where it fits: `hasStandardAlignment` (crosswalk between jurisdictions), `buildsTowards` (progression), `supports` (learning component to standard), `hasEducationalAlignment` (curriculum to standard). We add the edges Summit needs that it does not have.

## Node Types

| Node | What It Is | Source in V1 |
|---|---|---|
| CognitiveSkill | One of the 36 Summit cognitive skills, with level expectations for Expose, Explore, Pursue, Launch | Summit rubric, authored |
| CognitiveDomain | One of the 7 domains grouping the skills | Summit rubric, authored |
| Habit | One of the 16 Habits of Success | Summit framework, authored |
| HabitBlock | One of the 5 building blocks | Summit framework, authored |
| MathStandard | A CCSS math standard on the Multi-State hub | Learning Commons export if reachable, else IM course standard lists |
| MathComponent | A learning component beneath a math standard | Learning Commons export if reachable, else omitted in v1 |
| ELAStandard | A CCSS ELA anchor or grade-band standard, reference only | Authored from the anchor standards list |
| Lesson | A lesson from the curriculum catalog (Spec 1) | Catalog |
| ExperienceTemplate | A reusable real-world experience type: a clinical rotation, a newsroom placement, a water-quality study, a college course | Authored, 20 to 30 for the sandbox |
| Credential | A certificate, college course credit, or badge | Authored, 10 to 15 for the sandbox |
| Career | A career node with cluster and wage band | Futre career ids where known; a short authored list otherwise |
| Pathway | A named route from school to a career, with the credentials and experiences along it | Authored, 8 to 12 for the sandbox (nursing, software, trades, journalism, parks and environmental science, teaching, business, design) |

## Edge Types

| Edge | From | To | Meaning |
|---|---|---|---|
| builds_toward | CognitiveSkill, MathStandard, Habit, Lesson | CognitiveSkill, MathStandard, Habit | Mastering the source moves the target; the progression edge. Math from Learning Commons `buildsTowards`; cognitive skills and habits authored from the rubric's own sequence |
| supports | MathComponent, ELAStandard | MathStandard, CognitiveSkill | The fine-grained thing beneath the outcome. ELA standards support cognitive skills: this is how Common Core ELA runs underneath the rubric |
| teaches | Lesson, ExperienceTemplate | CognitiveSkill, MathStandard, Habit | What a lesson or experience builds (Learning Commons `hasEducationalAlignment`, widened to experiences) |
| requires | Credential, Pathway, ExperienceTemplate | CognitiveSkill, MathStandard, Habit, Credential | What you need before this |
| leads_to | ExperienceTemplate, Credential, Pathway | Credential, Career, Pathway | Where it goes |
| member_of | CognitiveSkill, Habit | CognitiveDomain, HabitBlock | Grouping |
| aligned_with | MathStandard (state) | MathStandard (Multi-State) | Learning Commons crosswalk, kept only if state standards are loaded |

Every edge carries `source` (learning_commons, summit_rubric, authored, futre) and `confidence` (1.0 for published data, 0.7 for authored v1 edges) so a later learned weight can replace the confidence without a schema change.

## Queries the Engine Runs in V1

| Query | Walk | Used By |
|---|---|---|
| whatServes(outcome) | Lessons and ExperienceTemplates with a `teaches` edge to the outcome, plus anything that `builds_toward` it one hop back | needs() in-reach, open-slot ranking, Proposed Workshops |
| whatUnlocks(outcome) | Outcomes one hop forward on `builds_toward`; Credentials and Pathways with `requires` satisfied by it | Progress screen "what this opens," readiness |
| gapsTo(target) | For a Credential or Pathway: `requires` edges not yet satisfied by the student's validated outcomes | My Pathway, mentor Pathway component, level review (Pursue to Launch) |
| pathwaysNear(student) | Pathways whose required outcomes overlap the student's validated set and whose Career matches a Futre target career | My Pathway suggestions, open-slot ranking for RW |
| underneath(skill) | ELAStandards and MathComponents with `supports` to the skill | Content expert lesson planning, Progress evidence detail |
| shortestPath(a, b) | The shortest chain of `builds_toward` edges from outcome a to outcome b, or none | The graph browser's path finder; the why for a multi-hop in-reach walk (Draft Three) |

All walks are bounded to three hops in v1. Results carry the edges traversed so the student's "why" can name them in plain words ("Argument writing builds toward Analyzing arguments, which the newsroom placement asks for").

## Build Sources and Fallbacks

1. Try the Learning Commons CDN exports for the current version. Filter to Multi-State Mathematics standards for the standards IM Math 1 to 3 cover, their learning components, and their `buildsTowards` edges. Keep nothing else; the full export is hundreds of megabytes.
2. If the download fails or exceeds a size or time budget, author `builds_toward` for math from the IM course sequence (unit order and the standards each unit cites) and note it in DECISIONS.md.
3. Cognitive skills, habits, ELA anchors, experience templates, credentials, careers, and pathways are authored in `src/graph/authored/*.ts` from Summit's frameworks and public lists. Mark every authored edge `confidence: 0.7`.
4. Futre career ids are used where the sandbox Futre stubs reference them; otherwise careers carry an authored id.

## Sandbox Acceptance

- The graph loads with the node and edge counts logged, and the Learning Commons version used (or "authored fallback") in the Evidence Log.
- For every student, whatServes() on their top in-reach outcome returns at least one lesson or experience in the published menu.
- For every Pursue and Launch student, gapsTo() on their Futre target pathway returns a non-empty, sensible list, and at least one gap is served by an offering this week.
- underneath() for Argument writing returns at least three ELA anchor standards.
- A graph browser screen (lead role, under Outcomes) shows any node with its edges, so a visitor can see the structure, and a path finder shows the shortest builds_toward path between any two outcomes (Draft Three).
- Every walk the engine performs is stored in the output's trace with the edges in order, so the Engine Trace screen can show the path in plain words (Draft Three).

## Later

Learned edge weights from alumni and labor market data; the full Learning Commons state crosswalks; Eedi's misconception graph for math; the knowledge graph as the source of the engine's recommendations rather than a lookup the rules consult.
