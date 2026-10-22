# Spec 6: The Engine

Summit 3.0 Homebase · Working draft v1 · October 20, 2026

The engine is rules in v1, learned later. It does four things: works out what each student needs, proposes workshops where need is shared, builds each student's week against what is available, and makes small overnight adjustments. Every output carries a "why" a student can read, and every placement has a human confirmer.

## Functions

| Function | Input | Output | Confirmer |
|---|---|---|---|
| needs(student) | Evidence, Assignment, Outcome, Settings | A ranked list of needs: {outcome or lesson, kind (required, recommended, in_reach, readiness), why} | Content expert via Needs You for anything with stale or missing evidence |
| proposeWorkshops(school) | needs() for all students, Lesson, Adult availability, Place | DI workshop proposals: {lesson, students, suggested day and time, adult, place, why} | Content expert accepts, changes, or declines |
| buildWeek(student) | needs(), published Offerings, Plan goals, Futre goals, plan_autonomy, protected and life constraints | A draft Plan with Slots, each with entry and why | Mentor confirms Monday |
| adjustOvernight(school) | New Evidence since publish, cancellations, "I'm out today" | A list of small moves, each with why; only displaced or newly needing students move | Automatic within limits; mentor sees the list |
| suggestLevelReview(student) | Evidence trends, RW history, Futre CNS | A flag with reasoning | Mentor decides |

## Rules for needs()

| Need Kind | Rule | Why Text Pattern |
|---|---|---|
| Required | Math standard mastery below required_rule on an active lesson; a cognitive skill score below the level expectation on the latest final product; a missing required piece | "Your {standard or skill} score is {value}; this workshop is where it moves" |
| Recommended | Within recommended_rule of Required; a lesson practiced but not mastered after two attempts | "You are close on {standard}; one more session should do it" |
| In reach | An outcome where the latest evidence is one step below the next level and a lesson or offering serves it | "{Skill} is one step from {level}; {offering} builds it" |
| Readiness | Evidence at or above the validation threshold with no assessment booked | "You have shown {outcome} three times; book the assessment" |

Needs are ranked: Required by how far below, then Recommended, then in-reach by distance, then readiness. Stale evidence (older than Settings.stale_days, default 14) produces no need; it produces a Needs You item for the content expert.

## Rules for proposeWorkshops()

1. Group students by lesson where Assignment.status is needs_workshop or active with a Required need.
2. If a group reaches grouping_threshold (default 4) and fits workshop_size, propose one DI workshop; if it exceeds capacity_max, propose two.
3. Choose an adult with the subject capacity and availability, and a place with capacity.
4. Prefer a time that collides with no student's protected slot, RW slot, or life constraint; if none exists, propose the time with the fewest collisions and list them.
5. Groups below threshold get a 1:1 conference proposal instead, or stay self-directed with a PF slot.

### Expert Agreement Rules (Draft Three)

A content expert should be able to accept a proposal from the card alone.

6. Group only students whose prerequisite lessons are mastered (or skipped on mastery), or whose gap is the same prerequisite. A group whose evidence points at different prerequisites splits into two proposals: one on the lesson, one on the prerequisite the others still need.
7. Never propose a time that overlaps any grouped student's RW slot; protected time and life constraints are hard constraints too. Collisions are listed per student, and a proposal with a collision says so on its face.
8. A group below grouping_threshold becomes a 1:1 conference proposal (PF), never a workshop.
9. Every proposal carries a one-line rationale a teacher would accept (the shared evidence in plain words) and a "what if I decline" line that names where each student goes instead (the practice block or conference the engine would fall back to).

## Why Text (Draft Three)

Every why line names the specific evidence behind it: the source and the day ("Your linear functions score was 62 on Thursday's Kira check; this workshop is where it moves"). Where the graph was walked, the why names the edge in plain words ("Argument writing builds toward Analyzing arguments, which the newsroom placement asks for"). A why never uses a deficit word: not behind, failing, at risk, deficient, or low performer. Acceptance: a scenario samples 50 why lines across needs, placed slots, and overnight moves, and every one names an evidence source or a graph edge and contains no banned word.

## Rules for buildWeek()

Placement order, never varied:

1. Community (WC) every morning for everyone.
2. Protected slots and whole-group events.
3. RW slots already confirmed with partners (placements are made by the program coordinator, not the engine, in v1).
4. Required slots, into accepted DI workshops or PF practice when no workshop exists.
5. Recommended slots.
6. Readiness: an assessment, portfolio review, or defense slot if a readiness need exists.
7. Reflection (RG) at the end of every day; one plan touchpoint Friday.
8. Open slots, per plan_autonomy: guided gets ranked options in each open slot; shared and owned get the full menu with the ranked options first.

Constraints: no student above a place's capacity; no slot overlapping a protected slot or life constraint; at most one DI slot per lesson per day; the eight-type mix for the week within the student's level targets where the menu allows (Expose leans PF, DD, IW, WC; Explore adds RW; Pursue leans RW and PP; Launch is mostly RW with RG weekly). Targets per level come from the experience-mix table in How Summit 3.0 Works, held in School Settings as level_targets and editable there. buildWeek() reads them when choosing the fallback for a Recommended need (a serving seminar or studio over a practice block when PF is already over target) and records them in every slot's trace; the ranker reads them for the under-target bonus; Time and Talent compares actuals to them.

Every slot gets a why from the need that placed it, or "You chose this," or "Everyone is here," or "Protected time."

## Rules for adjustOvernight()

- Runs after the 3:00 reflections and any new evidence.
- May: add a DI or PF slot for a new Required need into an open slot; move a student out of a cancelled offering; book a readiness assessment; swap two open-slot picks if a workshop filled.
- May not: move a Required slot already confirmed, touch protected slots, change more than Settings.max_overnight_moves per student (default 2), or change the week's RW placements.
- Every move carries a why and a "New since yesterday" tag. The mentor's Caseload lists the night's moves.

## Ranking Open-Slot Options

Score each published offering with capacity for this student: +3 if it serves a weekly goal's outcome, +2 if it serves an in-reach outcome, +2 if it serves the student's CNS direction from Futre, +1 if the experience type is under the student's level target this week, −2 if the same type already fills more than half the day, −5 if it collides with anything. Show the top two to five.

## Level Review

Suggest a level change when, over the last six weeks: (Expose to Explore) two or more RW experiences with reflections and a Futre CNS set; (Explore to Pursue) a Futre CNS stable for the period, cognitive skills at or above Explore expectation in four domains, and at least one credential, college course, or placement started. (Pursue to Launch) every required competency validated or booked for validation, a launch plan drafted with a defense scheduled, and a first step already taken (a job offer, an enrollment, a credential). Downward review is never suggested; the mentor can change a level either way.

## Graph in the Engine (Draft Three)

The engine walks the knowledge graph (Spec 10) in four places, and stores every edge it walks in the trace:

- needs() uses whatServes() for in-reach items and prefers the serving lesson whose prerequisites the student has mastered; a lesson whose prerequisite is still open loses, and the trace says so.
- The open-slot ranker uses pathwaysNear() and gapsTo() for RW offerings: an offering whose experience template teaches a gap on the student's Futre target pathway, or leads to a pathway near the student's validated set, scores the CNS bonus and names the gap in its why.
- suggestLevelReview() for Pursue to Launch uses gapsTo() on the Futre target pathway; the review flag lists the remaining gaps.
- whatUnlocks() feeds "What this opens" on Progress.

Learned weights on those edges are later.

## Traceability (Draft Three)

Every engine output stores a trace so a content expert and a system architect can see why, and would agree. A trace holds: the evidence rows read (ids), the settings applied (the thresholds and limits that mattered), the graph edges walked, the candidates considered and why each lost, and the decision in one line. Outputs that carry a trace: a need, a workshop or conference proposal, a placed slot, an overnight move, and a level review flag. Traces for needs, proposals, and level reviews are recomputed on demand because those functions are pure; traces for placed slots and overnight moves are stored with the run (the EngineTrace object in Spec 1).

- The Engine Trace screen (lead role) shows the trace for any student (needs, placed slots, moves, level review) or any proposal.
- Every slot card and every proposal carries a "Why this" link that opens the trace for that item.
- Every engine run (weekly build, overnight, out today, accepted proposal) appends a gathering log line: what it read, what it wrote, how long it took.

## What-if (Draft Three)

SandboxControls offers a what-if: change one setting, one score, or one adult's availability and see a side-by-side diff of the week before and after, for one student (slots added, removed, moved) and for the school (counts by experience type, proposal count, alert count). Nothing is written until "Apply."

## Audit Export (Draft Three)

A lead action writes `audit/engine-audit-<date>.md`: twenty proposals and twenty placed Required slots, each with its rationale, a one-line trace summary, and a blank column headed "Would you accept this? Why or why not?", so the file can go to a real math teacher and a real coordinator. The app offers the same file as a download; `npm run audit` writes it into the repo.

## Performance (Draft Three)

The full weekly build for 100 students completes in under five seconds in the browser; adjustOvernight() completes in under one second. A scenario measures both against the built app.

## Later (Not V1)

The knowledge graph and learned weights, alumni trajectories, labor market outcomes, adult-side optimization, and placements made by the engine rather than the coordinator. The functions above keep their signatures so a learned engine replaces the rules without touching the screens.

## Acceptance (Sandbox)

- needs() for every student returns at least one item, and every Required item traces to a specific evidence row.
- proposeWorkshops() returns three or more proposals with four or more students each on the seed.
- buildWeek() produces 100 valid plans: no capacity breaches, no protected overlaps, community and reflection every day.
- 500 random evidence perturbations rebuild without a constraint violation (a Vitest property test).
- adjustOvernight() after one lowered score adds exactly one slot for that student with the right why.
- 200 random "I'm out today" events each move only the students the cancelled offerings displaced.
- 100 random grouping thresholds between 3 and 8 produce proposal counts that never rise as the threshold rises.
- Every placed Required slot traces to an evidence row, and every slot, proposal, move, need, and level flag has a trace.
- No student exceeds max_overnight_moves in any run.
- 50 sampled why lines each name an evidence source or a graph edge and contain no deficit word.
- Proposals never overlap a grouped student's RW slot, and every group's students share mastered prerequisites or the same prerequisite gap.
