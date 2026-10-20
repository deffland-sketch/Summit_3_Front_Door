# Spec 4: Supply Publishing (Content Experts, Facilitators, System Architect)

Summit 3.0 Front Door · Working draft v1 · October 20, 2026

Supply is everything a student can be scheduled into. Adults and partners publish it; the engine reads it. This spec covers the content expert and facilitator screens and the system architect's weekly build. It replaces the hand-built rotation grid with a published menu that the engine and the students both read.

## Roles on the Supply Side

| Capacity | Publishes | Confirms |
|---|---|---|
| Content expert | DI workshops (often proposed by the engine from shared lesson need), PF practice blocks they supervise, 1:1 conferences | Engine-proposed workshops; mastery opt-outs; "students I need to look at" |
| Facilitator | DD seminars, IW project studios, PP exhibitions, Expedition groups | Group membership |
| System architect (program coordinator) | Whole-group events, partner slots (with the operations coordinator), standing sessions, the weekly build | The published week |
| Partner (external) | RW slots with capacity and days, through the partner calendar adapter | Attendance of placed students |

## Screens

| Screen | Purpose | Reads | Writes |
|---|---|---|---|
| My Offerings | This week's offerings I lead, each with roster, lesson, outcomes, place, capacity; "I'm out today" moves my students and tells them | Offering, Slot, Student | Offering, Adult.availability |
| Proposed Workshops | Engine proposals: the lesson, the students who need it, the suggested time and place; accept, change, or decline with a reason | Assignment, Lesson, Student | Offering (published), Assignment.mode |
| Needs You | Decisions only this adult can make: students with no fresh evidence (naming the source and the date of its last row), mastery opt-outs to confirm, students to flag for a Required slot | Evidence, Assignment | Assignment.status, Slot.entry |
| Roster and Notes | During a session: who is here, an exit signal per student (got it, need more, ready for more), a one-line observation that becomes Evidence | Slot | Slot.status, Evidence (adult_note) |
| Menu | The published menu for the week, by day and experience type, with fill counts; what students see in Build My Week | Offering | Offering.status |
| Standing Sessions | Sessions that repeat weekly until changed | Offering.standing | Offering |

## Publishing Rules

- An offering is draft until its leader publishes it or the architect publishes the week. Students see only published offerings.
- Every offering carries at least one outcome. The platform refuses to publish an offering with none.
- A DI workshop carries a lesson. A PF, DD, IW, PP, or RW offering may carry outcomes without a lesson.
- Capacity is required. The engine never places above capacity_max and proposes cancelling below capacity_min two days out; the dashboard alert offers the cancel, which runs the overnight adjuster for the displaced students.
- Place is required and checked against Place.capacity and adults_required.
- "I'm out today" cancels the adult's offerings for the day; the engine moves only the students displaced and sends the student's chosen notification.

## The Weekly Build (System Architect)

| Step | What Happens | Who Confirms |
|---|---|---|
| 1. Gather | Evidence and assignment status pulled from every source; the gathering log shows what arrived and what is stale | Architect reviews the log |
| 2. Read | What the data says: students with Required needs by lesson, shared lesson needs that clear the grouping threshold, in-reach outcomes, readiness flags, protected minutes planned against required | Content experts answer Needs You |
| 3. Propose | The engine proposes workshops (Spec 6) and drafts every student's week | Experts accept or change proposals |
| 4. Build | buildWeek() places protected and whole group first, then Required, then Recommended, then opens the rest to students per plan_autonomy | Architect checks capacity, hub load (a block shows red when placements exceed capacity or the adults in the hub fall below adults_required), partner slots |
| 5. Publish | The week is published; students, mentors, and adults see their part | Mentors confirm Monday |

The build runs Friday by default (a setting). It can be rerun before publish without touching a published week.

## Acceptance (Sandbox)

- Each content expert sees two to four offerings a day with rosters that match the students' plans.
- Proposed Workshops shows at least three engine proposals this week with four or more students each; accepting one publishes an Offering and places the students.
- "I'm out today" for one expert moves only that expert's students and tags their slots "New since yesterday."
- The Menu shows every published offering with fill counts that match the plans.
- The weekly build runs end to end from the sandbox and publishes 100 plans.
