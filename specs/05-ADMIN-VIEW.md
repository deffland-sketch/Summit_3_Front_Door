# Spec 5: Admin View (School Lead)

Summit 3.0 Front Door · Working draft v1 · October 20, 2026

The school lead sees the system: whether the model is running as designed, whether every student is getting what they need, and where adults' time is going. This is the view a funder or a visiting leader is shown.

## Screens

| Screen | Purpose | Reads |
|---|---|---|
| Dashboard | Today at a glance: students by experience type right now, adults by capacity, alerts by severity each linked to where to fix it, study group proposals to approve | Plan, Slot, Offering, Adult |
| Live Board | Each hour of the chosen day, session by session, with counts; filter by level, mentor group, outcome family; print the door roster | Slot, Offering, Place |
| Outcomes | Movement across the school: cognitive skills by domain, math standards by unit, habits; students at each level; what moved this week and this term | Evidence, Outcome, Student |
| Equity Snapshot | Who is Required week after week, who has had no RW slot in four weeks, who has fewer than two touchpoints a week, by support status and by level; the recurring names | Plan, Slot, Touchpoint, Student |
| Time and Talent | How the week's hours split across the eight experience types for students and for adults, against the illustrative targets in How Summit 3.0 Works; workshops traced to a student need; adult hours by capacity | Slot, Offering, Adult |
| Partners | Every partner, its weekly slots, fill rate, and the students placed; which placements the engine could not fill | Offering (partner), Slot |
| Events | Whole-group sessions: day, start, length, who attends, which staff, where; the engine leaves protected time alone | Offering (event) |
| Settings | Every rule in Spec 1 School Settings, editable, with the last change and who made it | School Settings |
| Evidence Log | What arrived from each source this week, what is stale, what the engine refused to act on, and one line per engine run (what it read, wrote, and how long it took) | Evidence, gathering log |
| Engine Trace | The trace behind any engine output for a student or a proposal: evidence read, settings applied, edges walked, candidates and why each lost (Spec 6 Traceability) | Engine traces |
| Engine Audit | Writes audit/engine-audit-<date>.md: twenty proposals and twenty placed Required slots with rationale, trace summary, and a blank acceptance column for a real teacher and coordinator | Engine traces |

## Dashboard Alerts

| Alert | Severity | Rule |
|---|---|---|
| Student with an unfilled Required slot | High | Required need with no published slot by Monday 9:00 |
| Protected minutes short | High | Planned protected slots below the student's required minutes this week |
| Hub over capacity | High | Any hour where PF placements exceed Place.capacity or adults_required |
| Partner slot unfilled | Medium | A published RW offering below capacity_min two days out |
| No touchpoint in five days | Medium | Per student |
| Adult over or under | Medium | An adult with more than six or fewer than two offerings a day |
| Stale evidence | Low | A source with nothing new in seven days |

## The Model Dashboard (The Funder View)

One screen that answers "is Summit 3.0 running here": the eight-type time split against targets, the share of students with an RW slot this week, the share of workshops traced to need, mean touchpoints per student per week, students by level and movement between levels this term, and outcomes moved this term. All from the sandbox in v1, with the three Sierra metrics from the deck (academic growth, belonging, ownership) shown as placeholders labeled "survey, not yet connected."

## Acceptance (Sandbox)

- The Dashboard shows the alert counts the seed produces, each alert linking to the screen that resolves it.
- The Live Board for Tuesday shows every published session with a count, and the door roster prints without program names.
- The Equity Snapshot lists the recurring Required students and shows at least one student with no RW slot in four weeks.
- Time and Talent shows the student hour split within ten points of the Year 1 targets in How Summit 3.0 Works.
- Changing grouping_threshold in Settings from 4 to 6 and rerunning the build changes the number of proposed workshops.
