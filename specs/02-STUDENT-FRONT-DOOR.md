# Spec 2: Student Front Door

Summit 3.0 Front Door · Working draft v1 · October 20, 2026

The student's page is the product. Everything else serves it. A student opens it on a phone or Chromebook and sees six things, in this order of prominence: the plan for today and the week, progress toward outcomes, the resources to open, the line to the long-term plan, the mentor's guidance, and the reflection that closes the day.

## Screens

| Screen | Purpose | Reads | Writes |
|---|---|---|---|
| Today | Where to be now and next, why each slot is mine, what to bring, my goal for the slot | Plan, Slot, Offering, Place, Adult | Slot.goal, Slot.status (checked in), Slot.rating |
| My Week | Five days at a glance, slots colored by experience type, open slots dashed | Plan, Slot | Slot choices in open slots (within plan_autonomy) |
| Build My Week | The student's own week builder, used Friday with the mentor and any time an open slot exists | Offerings available, Evidence, Assignments, Futre goals | Plan (draft), Slot.entry = chosen, Plan.goals |
| Progress | Outcomes by family: cognitive skills by domain, math standards by unit, habits with focus habits first; each with the evidence behind it and what is in reach | Evidence, Outcome, Assignment | Nothing |
| My Courses | Each course as a map of lessons: mastered, active, queued, and the lesson a workshop is proposed for; one tap opens the lesson in Kira or shows the workshop slot | Course, Unit, Lesson, Assignment | Assignment.status when the student marks practice done (Kira confirms) |
| My Pathway | Read from Futre: vision line, Concrete Next Step, experiences and reflections, portfolio link; underneath, how this week's slots connect to it | Futre adapter, Plan | A reflection that goes back to Futre as an experience note |
| Reflection | The 3:00 close: one line on what moved today, what I need next, each slot rated, tomorrow's goals checked off the next morning | Plan, Slot | Evidence (student_reflection), Slot.rating, Touchpoint.student_note |
| Me | Supports and preferences the student controls: notification channel, warning minutes, language, text size, dark mode, reduced motion | Student | Student prefs |

## The Week As the Student Sees It

- A slot is a card with the experience type color on its edge, a title, time, place, who leads, and one line of "why." Required slots say what evidence put them there. Chosen slots say "You chose this."
- Open slots are dashed. Tapping one shows two to five offerings the engine ranks for this student, each with the outcome it builds and the people in it. The student picks; the mentor sees the pick.
- Expeditions and partner slots (RW) appear in the week like any other slot. There are no rounds in the student view.
- Community (WC) is fixed every morning. Protected slots are solid grey with the label "Protected time" and nothing else.
- Mentor touchpoints are not slots. They appear as a small marker on the day with the time and kind, and the mentor can add one at any moment.
- The week is the published version. If something moves overnight, the moved slot carries a "New since yesterday" tag and the old slot is struck through for one day.

## Plan Autonomy

A per-student setting, set with the mentor, replacing the pilot's phase of the year.

| Setting | Student Builds | Engine Builds | Mentor Confirms |
|---|---|---|---|
| guided | Open slots only, from ranked options | Required, Recommended, protected, whole group | Monday |
| shared | Half the week from the full menu; may swap a Recommended slot with a reason | Required, protected, whole group | Monday |
| owned | The whole week from the full menu; Required slots still placed by the engine and visible as such | Protected, whole group, Required | Monday, light touch |

Launch students default to owned. Their week is mostly RW slots at work, in a college course, or in a credential program, with a weekly mentor meeting and a text check-in; Today for a Launch student shows the on-site schedule and the one or two on-campus commitments.

## Progress Screen Rules

- Lead with what is in reach: the three outcomes closest to the next level, each with the one thing that would get there (a lesson, a workshop, a piece of evidence).
- Cognitive skills show the student's best score against the expectation for their level, as a band, never a grade.
- Math standards show by unit with mastered, practicing, not yet.
- Habits show the one or two focus habits with the reflection history as a short timeline.
- Every number opens to the evidence behind it, with the artifact link when there is one.
- Language is always what the student is building. The platform never shows a deficit label.

## Build My Week Flow

1. Friday, with the mentor: the student writes two to four goals for the week. Each goal may link to an outcome.
2. The engine proposes a week: Required and protected first, then Recommended, then open slots ranked by goals and in-reach outcomes. Every proposal has a "why."
3. The student fills open slots (per plan_autonomy), swaps what the setting allows, and can request a 1:1 or propose a study group (lead approves).
4. The mentor confirms Monday. The plan is published.
5. Overnight: small adjustments only, each with a "New since yesterday" tag.

## Notifications

Channel from Student.notification_prefs: in-app banner, the community display board, the mentor at the next touchpoint, or email. A 5-minute warning before each move is a support some students have. The platform never sends a notification that names a program or a reason for protected time.

## Acceptance (Sandbox)

- Pick any of the 100 students: Today shows a full day with at least one Required or Recommended slot traceable to a specific evidence row, one RW slot for about a third of students, community at 8:30, and reflection at 3:00.
- Lower a math mastery score in the sandbox controls and rebuild: a Required DI slot appears for that lesson with the correct "why."
- Mark a lesson mastered: the Required slot drops and the lesson map updates.
- Build My Week respects plan_autonomy for all three settings.
- My Pathway shows Futre stub data and at least two slots this week linked to the student's CNS.
