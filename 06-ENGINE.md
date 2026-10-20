# Spec 6: The Engine

Summit 3.0 Front Door · Working draft v1 · October 20, 2026

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

Constraints: no student above a place's capacity; no slot overlapping a protected slot or life constraint; at most one DI slot per lesson per day; the eight-type mix for the week within the student's level targets where the menu allows (Expose leans PF, DD, IW, WC; Explore adds RW; Pursue leans RW and PP; Launch is mostly RW with RG weekly). Targets per level come from the experience-mix table in How Summit 3.0 Works, held in School Settings as level_targets.

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

In v1 the engine walks the knowledge graph (Spec 10) for two things: which lesson or offering serves an in-reach outcome (follow builds_toward edges backward from the outcome to lessons and offerings that support it), and which outcomes a validated outcome unlocks (follow builds_toward forward). Learned weights on those edges are later.

## Later (Not V1)

The knowledge graph and learned weights, alumni trajectories, labor market outcomes, adult-side optimization, and placements made by the engine rather than the coordinator. The functions above keep their signatures so a learned engine replaces the rules without touching the screens.

## Acceptance (Sandbox)

- needs() for every student returns at least one item, and every Required item traces to a specific evidence row.
- proposeWorkshops() returns three or more proposals with four or more students each on the seed.
- buildWeek() produces 100 valid plans: no capacity breaches, no protected overlaps, community and reflection every day.
- 500 random evidence perturbations rebuild without a constraint violation (a Vitest property test).
- adjustOvernight() after one lowered score adds exactly one slot for that student with the right why.
