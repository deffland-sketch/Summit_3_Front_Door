# Spec 3: Mentor View

Summit 3.0 Homebase · Working draft v1 · October 20, 2026

The mentor sees a caseload of about 25 on one screen and gets into one student in one tap. The platform tees up the right conversation and captures the notes; it never runs the conversation.

## Screens

| Screen | Purpose | Reads | Writes |
|---|---|---|---|
| Caseload | Every mentee as a row: on track, needs a nudge, ready for validation; sort by what needs attention; filters by level and by outcome family | Student, Plan, Evidence, Touchpoint | Nothing |
| Student | One student: this week's plan, goals, in-reach outcomes, recent evidence, touchpoint history, Futre pathway summary | Everything for one student | Touchpoint, Plan.confirmed_by, Student.level, Student.plan_autonomy, focus_habits |
| Touchpoints | Today's touchpoints by time; add one in two taps; a suggested prompt for each, drawn from the student's week | Touchpoint, Plan | Touchpoint |
| Confirm Monday | The Friday-built weeks awaiting confirmation; approve one or all; change a slot with a reason | Plan (draft) | Plan.confirmed_by, Slot changes |
| Readiness | Students the evidence says are ready for validation on an outcome; book an assessment, a portfolio review, or a defense | Evidence, Outcome | Offering (assessment), Slot |
| Family | Per student: the last family touchpoint, the next step-back date, notes for the family conversation (student-visible by default) | Touchpoint (kind family) | Touchpoint |

## Caseload Flags

| Flag | Rule (all settings in Spec 1) | Shown As |
|---|---|---|
| Needs a nudge | Two or more missed slots this week, or a goal unchecked three days running, or no touchpoint in the last five school days | Orange dot |
| Ready for validation | An outcome with evidence at or above its validation threshold and no assessment booked | Teal dot |
| Grew this week | A cognitive skill or standard moved up since Monday | Small up arrow |
| Family call | A lead or case manager flagged it | Red dot, only visible to the mentor |
| Level review | Evidence pattern suggests a level change (see Spec 6) | Indigo dot |

## The Conversation Bank

The mentor assembles a touchpoint from components; the platform suggests a pairing from the student's week.

| Component | Suggested When | Prompt the Platform Offers |
|---|---|---|
| Plan | Friday, or any open slot unfilled | What are two things you want to have built by Friday? |
| Academics | A Required slot this week, or a standard in reach | Which lesson is in reach this week, and what would get you there? |
| Habits | Always available as an add-on | Where did your focus habit show up this week? Where was it hard? |
| Pathway | After an RW slot, or a Futre reflection arrives | What did that experience change about where you are headed? |
| Reflection | 3:00, or the next morning | What moved today? What do you need next? |
| Validation prep | Ready-for-validation flag | What evidence will you bring, and who should be in the room? |

Notes are the mentor's words. The student sees them unless the mentor marks a note private. Follow-ups carry a date and appear on both the mentor's and the student's Today.

## Level and Autonomy Changes

The mentor owns both. Changing a student's level (Expose, Explore, Pursue, Launch) or plan_autonomy asks for one line of reason, writes a Touchpoint of kind goal with that line, and takes effect at the next weekly build. The engine can suggest a level review; it never changes a level.

## Acceptance (Sandbox)

- The caseload for any of the four mentors shows about 25 students with the flag counts the seed specifies (three ready for validation, six needing a nudge, one family call across the school).
- Opening a student shows the plan, goals, two to four touchpoints this week, and in-reach outcomes that match the student's Progress screen.
- Adding a touchpoint with the Habits component writes a Touchpoint and shows on the student's Today.
- Confirm Monday publishes a draft plan and the student's My Week updates.
- Readiness books an assessment: an Offering of kind assessment and a Slot appear for that student.
