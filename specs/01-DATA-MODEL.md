# Spec 1: Data Model and Sandbox Seed

Summit 3.0 Front Door · Working draft v3 · October 20, 2026 · Owner: Dan Effland

This is the first of six specs. It defines the objects everything else is built on and the sandbox that proves them. Later specs (student front door, mentor view, supply publishing, admin view, engine) are screens and logic over these objects and must not add objects without updating this file.

## What This Platform Is

The front door to Summit 3.0. One place where a student sees progress toward outcomes, the plan for the week, access to the learning resources, the line from this week to the long-term plan in Futre, and where the mentor guides, gives feedback, and sees progress, and where an administrator sees the system. Content lives in strong curriculum (Illustrative Mathematics, OpenSciEd, AP English and history) and reaches students through Kira, Teach to One, or a teacher-led workshop. Pathway, vision, portfolio, and career exploration live in Futre. The front door holds the week, the progress, and the people.

Design principles carried into every object:

- Technology recommends. People decide. Every recommendation has a human confirmer.
- Flexibility with predictability. The week is published in advance; the day adjusts in small ways.
- No lockstep. Lessons and modules are assigned per student, from where the student is, and grouped only when several students need the same thing in the same window.
- The student owns the record. Evidence and outcomes are portable in principle (Open Badges 3.0 and CLR 2.0 later, not in v1).
- Protected time stays protected, and the system never stores why.

## Outcome Frame

Four families. Everything a student does is tagged to at least one outcome.

| Family | Source | Unit | Measured By |
|---|---|---|---|
| Cognitive Skills | Summit Cognitive Skills rubric, 36 skills in 7 domains | One skill, scored 1 to 8 with an expectation per level (Expose, Explore, Pursue, Launch) | Best score per skill on final products and performance tasks, read against the expectation for the student's level |
| Content | Common Core math standards (measured) and Common Core ELA standards (reference only: they sit underneath the cognitive skills in the knowledge graph and are never scored on their own). Science and humanities content is carried by Cognitive Skills; their lessons are tagged to cognitive skills, never to content codes | One standard | Math: unit assessments, Teach to One roadmap, Kira practice mastery, teacher check. ELA: not scored; the cognitive skill is |
| Durable Skills | Habits of Success, 16 habits in 5 building blocks | One habit | Student reflection, mentor observation, focus-habit goals |
| Pathway | Futre | Vision, Concrete Next Step, experiences, portfolio | Read from Futre; never duplicated here |

## The Eight Experience Types

The eight types are the labels on every time slot and every offering. They are content-neutral.

| Code | Experience Type | Typical Form at Sierra |
|---|---|---|
| DI | Direct instruction | Teacher-led workshop for the students who need that lesson |
| PF | Practice and feedback | Kira, Teach to One, practice with a content expert checking work |
| DD | Discussion and dialogue | Socratic seminar, lab, book talk, peer critique |
| IW | Independent work and creation | Project studio, final products, Expedition projects |
| PP | Presentation and performance | Exhibition, portfolio review, defense |
| RG | Reflection and goal-setting | Goal-setting, reflection, mentor conversation |
| RW | Real-world experience | Expedition, internship, college course, paid work, partner site |
| WC | Wellbeing and community | Community circle, physical activity, lunch together |

## Objects

Twelve objects. The first six are the core; the next six make the week and the curriculum real.

### 1. Student

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| display_name | string | Sandbox names are invented |
| level | enum expose, explore, pursue, launch | Where the student is on the pathway. Expose: trying many things, broad base. Explore: narrowing, deeper work in a few directions. Pursue: a chosen direction, credentials, college courses, placements. Launch: diploma validated or in reach, a defended launch plan, most of the week in the world with a weekly mentor meeting. Set with the mentor; moves on evidence, never on age. No grade levels anywhere in the platform |
| mentor_id | ref Adult | One long-term mentor |
| community_group_id | ref Group | The morning community group |
| plan_autonomy | enum guided, shared, owned | How much of the week the student builds; set with the mentor (Spec 2) |
| supports | list of Support | A Support is {kind, note}: kind from a fixed list (five_minute_warning, printed_roster, large_text, quiet_space, check_in_first, extended_time, other); note is the accommodation in plain words. No reason or diagnosis stored |
| protected_slots | list of {day, start, end} | Slots the engine never fills. Reason never stored |
| life_constraints | list of {day, start, end, label} | Work, caregiving, transport; label is the student's own words |
| futre_student_id | string | Key to read vision, CNS, experiences, portfolio |
| notification_prefs | {channel, warning_minutes} | Banner, board, mentor, email; 5-minute warning if a support |
| locale, text_size, reduced_motion, dark_mode | prefs | |

### 2. Adult

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| display_name | string | |
| capacities | list of enum mentor, content_expert, facilitator, system_architect, leader, case_manager, partner | One adult can hold several |
| subjects | list of ref Course | For content experts |
| mentees | list of ref Student | For mentors |
| availability | list of {day, start, end, kind} | Teaching, circulation, prep, out |
| external_org | string, nullable | For partners and college instructors |

### 3. Outcome

| Field | Type | Notes |
|---|---|---|
| id | string | Stable code: CS.ARG.CLAIM, CCSS.HSA.REI.B.3, HOS.SELF_DIRECTION, OSE.B.1.3 |
| family | enum cognitive, content, durable, pathway | |
| domain | string | Cognitive skill domain, math domain, habit building block, course |
| name | string | |
| description | string | |
| level_expectations | map level to score | For cognitive skills: the expected score at Expose, Explore, Pursue, Launch |
| graph | see Spec 10 | Outcome nodes and their edges (builds_toward, supports, underlies) live in the knowledge graph, which this object's prerequisites field mirrors |
| validation | enum rubric_score, standard_mastery, teacher_check, reflection, external | How evidence counts |
| prerequisites | list of ref Outcome | Used by the engine and by lesson sequencing |

### 4. Offering

One item of supply: something a student can be scheduled into.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| experience_type | enum of the eight | |
| kind | enum workshop, practice, conference, seminar, studio, expedition, partner_slot, event, college_course, community, exhibition, assessment | |
| title | string | |
| lesson_id | ref Lesson, nullable | When the offering teaches a specific lesson |
| outcomes_served | list of ref Outcome | What this offering builds |
| adult_ids | list of ref Adult | Who leads; empty for self-directed practice |
| place_id | ref Place | |
| day, start, end | date, time, time | |
| capacity_min, capacity_max | int | Workshops 4 to 8; community 100; practice hub by place capacity |
| entry | enum required, recommended, open, invited, assigned | How a student gets in |
| source | enum front_door, kira, teach_to_one, futre, partner, calendar | Who posted it |
| source_ref | string | The id in the source system |
| standing | bool | Repeats weekly until changed |
| status | enum draft, published, cancelled | |

### 5. Plan

One student, one week.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| student_id | ref Student | |
| week_start | date | Monday |
| slots | list of Slot | See Slot |
| goals | list of {text, outcome_id, nullable} | Two to four weekly goals, set Friday with the mentor |
| focus_habits | list of ref Outcome (durable) | One or two for the term, carried week to week |
| built_by | enum student, mentor, engine, lead | |
| confirmed_by | ref Adult, nullable | The mentor's Monday confirmation |
| published_at | datetime | |
| version | int | Increments on every change after publish; each version is kept |

### 6. Evidence

One signal of progress. Append-only.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| student_id | ref Student | |
| outcome_id | ref Outcome | |
| source | enum kira, teach_to_one, gradebook, assessment, futre, adult_note, student_reflection, exhibition, external | |
| source_ref | string, nullable | |
| value_kind | enum score_1_8, mastery_pct, level, pass_fail, text | |
| value | number or string | |
| artifact_url | string, nullable | Link to the work |
| recorded_by | ref Adult or Student or system | |
| recorded_at | datetime | |
| slot_id | ref Slot, nullable | The slot the evidence came from |

### 7. Slot

One time slot in a student's plan. The unit of the day.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| plan_id | ref Plan | |
| day, start, end | date, time, time | Slots are not a fixed grid; lengths vary by experience type |
| experience_type | enum of the eight | The label the student sees |
| offering_id | ref Offering, nullable | Null for an open slot the student fills |
| entry | enum required, recommended, chosen, protected, assigned, whole_group | Why this slot is the student's |
| why | string | One sentence the student sees: "Your draft showed two writing skills in reach" |
| goal | string, nullable | The student's goal for the slot |
| status | enum planned, confirmed, attended, missed, moved, cancelled | |
| rating | enum got_it, need_more, ready_for_more, nullable | End-of-day rating |
| bring | string, nullable | What to bring |
| evidence_id | ref Evidence, nullable | The evidence row that placed this slot, so a Required or Recommended slot traces to its signal (added in build v1) |
| added_at | datetime, nullable | Set when a slot is added after publish; drives the "New since yesterday" tag (added in build v1) |

### 8. Touchpoint

A mentor conversation. Not bound to the slot grid. Several a day are normal.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| student_id, mentor_id | refs | |
| kind | enum plan, check_in, feedback, reflection, goal, family, validation_prep | |
| when | datetime | |
| duration_min | int | Often 3 to 10 |
| prompt | string | What the platform teed up, if anything |
| notes | string | Mentor's words; student can see unless marked private |
| private | bool | When true the student does not see the notes (added in build v1) |
| student_note | string, nullable | The student's own line |
| linked_outcomes | list of ref Outcome | |
| linked_slot_id | ref Slot, nullable | |
| follow_up | {text, due} nullable | |

### 9. Course, Unit, Lesson

The curriculum catalog. Strong open curriculum, held as a graph of lessons tagged to outcomes so lessons can be assigned one student at a time.

| Object | Fields | Notes |
|---|---|---|
| Course | id, title, curriculum (enum im, openscied, ap_english, ap_history, spanish, elective), levels, units | IM Math 1, 2, 3; OpenSciEd Biology, Chemistry, Physics; AP Language, AP Literature; AP World, AP US History |
| Unit | id, course_id, sequence, title, outcomes_served, estimated_slots | |
| Lesson | id, unit_id, sequence, title, outcomes_served, prerequisites (ref Lesson), modes (self_directed, workshop, seminar, lab), estimated_minutes, kira_ref, materials_url | A lesson can be taken self-directed on Kira or taught in a workshop when several students need it |

### 10. Assignment

What a student is working on in a course, lesson by lesson.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| student_id, lesson_id | refs | |
| status | enum queued, active, practiced, mastered, needs_workshop, skipped_on_mastery | |
| mode | enum self_directed, workshop, seminar, lab, nullable | Set when scheduled |
| assigned_by | enum engine, teacher, student | |
| opened_at, mastered_at | datetimes | |

The grouping rule: when four or more students have the same lesson in needs_workshop or active status in the same week, the engine proposes a DI workshop offering for a content expert to confirm. Under four, the lesson stays self-directed with a conference offered.

### 11. Place and Group

| Object | Fields |
|---|---|
| Place | id, name, kind (classroom, hub, seminar_room, nook, gym, off_campus, partner_site), capacity, adults_required |
| Group | id, kind (community, expedition_team, study_group, mentor_group), name, student_ids, adult_ids, approved_by |

### 12. School Settings

One record per school. Everything the engine treats as a rule lives here so a decision changes behavior without a rebuild.

| Setting | Default | Notes |
|---|---|---|
| day_start, day_end | 8:30, 15:30 | |
| community_time | 8:30 to 8:45 all, 8:45 to 9:15 small groups | |
| workshop_size | 4 to 8 | |
| grouping_threshold | 4 | Students needing the same lesson before a workshop is proposed |
| hub_capacity | per Place | |
| required_rule | content mastery below 70%, or a missing required piece | |
| recommended_rule | within 5 points of required | |
| weekly_build_day | Friday | |
| overnight_adjustments | on | Small moves only; the week holds |
| max_overnight_moves | 2 | Per student per night |
| stale_days | 14 | Evidence older than this produces a Needs You item, never a need |
| mentor_min_touchpoints_per_week | 2 | Flag below this |
| protected_time_visible_as | "Protected time" | Never the program name |
| level_targets | per level, per experience type share | The experience-mix targets from How Summit 3.0 Works (Year 1 for Expose and Explore, then Pursue, then Launch), editable on the Settings screen; buildWeek() and the ranker read them (Spec 6) |
| changed_at, changed_by | datetime, string | Last change and who made it, shown on the Settings screen (Spec 5) |

### 13. Futre Record and Gathering Log (read-only context, added in build v1)

| Object | Fields | Notes |
|---|---|---|
| FutreRecord | futre_student_id, student_id, consent, vision {vision_text, vision_board_url, updated_at}, cns {cns_type, cns_text, target_careers[], pathway_id, updated_at}, careers_explored[], experiences[], portfolio {portfolio_url, item_count, latest_item}, caregiver_view_enabled | The shape the Futre adapter returns (Spec 7). Read, never written, except pushCompletion. pathway_id links the CNS to a knowledge-graph Pathway (Spec 10) |
| GatheringLogEntry | id, source, pulled_at, received, unmapped, refused, stale, message | One line per source per pull, shown in the Evidence Log (Spec 5) and the weekly build (Spec 4) |

### 14. Engine Trace (added in draft three)

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| kind | enum need, proposal, slot, move, level_review | Which engine output this explains |
| subject_id | ref Student or proposal id | |
| ref_id | string | The slot id, outcome id, proposal id, or move the trace explains |
| evidence_ids | list of ref Evidence | The rows the engine read |
| settings | map | The settings that mattered (required_rule, grouping_threshold, max_overnight_moves, level_targets for the level, ...) |
| edges | list of {from, to, type, source} | Graph edges walked, in order |
| candidates | list of {id, label, score nullable, lost_because nullable} | What else was considered and why it lost |
| decision | string | One line |
| run_id | string | The engine run that produced it (also a gathering log line) |
| at | datetime | |

Traces for placed slots and overnight moves are stored; traces for needs, proposals, and level reviews are recomputed on demand because those functions are pure.

## Relationships in One Picture

Student has one Plan per week, many Slots per Plan, many Touchpoints per week, many Assignments across Courses, many Evidence rows per Outcome. Offering is the supply; Slot is where a student meets an Offering. Lesson is the content unit; Assignment is a student's relationship to a Lesson; an Offering may teach a Lesson. Outcome is the thread through everything: every Lesson, Offering, Slot, Touchpoint, and Evidence row points at outcomes.

## Integration Surface

Resources plug in at exactly two points.

| Direction | What Crosses | Sources in V1 |
|---|---|---|
| In: Offerings | A source posts things students can be scheduled into | Kira (assigned practice, self-paced courses), Teach to One (roadmap sessions), partner calendar (Expedition and partner slots), school calendar (events) |
| In: Evidence | A source returns a signal of progress tagged to an outcome | Kira, Teach to One, gradebook, Futre (experience reflections), adult notes, student reflections |
| Out: Context | The front door reads, never writes | Futre: vision, CNS, experiences, portfolio links |

In the sandbox every source is simulated by the seed generator. The adapters are stubs with the same interface, so a real adapter replaces a stub without touching the model.

## Sandbox Seed

The sandbox is the proof. One hundred invented students with enough history that every screen responds to data, and a deterministic seed so a demo looks the same twice.

| Set | Count | Shape |
|---|---|---|
| Students | 100 | One cohort, no grade levels. Level mix: about 35 Expose, 35 Explore, 20 Pursue, 10 Launch; about one in five with supports and protected slots; a handful with life constraints; every student with a Futre stub |
| Adults | 13 | 1 director, 1 program coordinator (system architect), 1 operations and family coordinator, 4 mentors with 25 mentees each who also facilitate, 4 content experts (math, science, English, history), 1 learning strategies coach, 1 case manager |
| Partners | 6 | A parks department, a newsroom, a hospital, a community college, two workplaces, each with weekly partner slots |
| Places | 10 | Home base commons (hub, 40), 4 classrooms (8 to 24), 2 seminar rooms (10), 2 mentor nooks (2), gym, plus partner sites |
| Outcomes | ~230 | 36 cognitive skills, 16 habits, ~120 CCSS math standards across Math 1 to 3, ~60 CCSS ELA anchor and grade-band standards as reference nodes under the cognitive skills (Spec 10) |
| Courses | 10 | IM Math 1, 2, 3; OpenSciEd Bio, Chem, Physics; AP Lang, AP Lit; AP World, APUSH. Each with 6 to 8 units and 8 to 12 lessons per unit, lesson titles and outcome tags realistic to the curriculum |
| Assignments | ~3,000 | Each student mid-course in 4 courses, at a different lesson from peers, with a mastery history that makes sense |
| Evidence | ~12,000 | Eight weeks of history: Kira mastery, unit assessments, cognitive skill scores on two final products, habit reflections, Futre reflections after one Expedition round |
| Plans | 100 current, 800 past | The coming week published, with Required and Recommended slots that trace to evidence; eight prior weeks with attendance and ratings |
| Touchpoints | ~2,400 | Two to four per student per week across eight weeks, mixed kinds, realistic notes |
| Futre stubs | 100 | A vision line, a CNS, one to three experiences with a reflection, a portfolio link |

Distributions that make the demo honest:

- Cognitive skill scores cluster around the expectation for the student's level with a real spread; a quarter of students have one skill well above and one well below.
- Math placement spans all three courses at every level; Expose students in Math 3 and Pursue students in Math 1 both exist.
- Habits of Success: every student has one or two focus habits with four to eight weeks of reflection.
- Required slots this week land on roughly 30 students, Recommended on 25 more; the equity snapshot shows who recurs.
- Three students are ready for validation on something this week; six need a nudge; one has a family-call flag.
- Expedition slots are woven into the week as RW slots, not a separate round: about a third of students have one or more RW slots on any day.

The generator is one script (`seed/generate.ts`) with a fixed seed, writing JSON fixtures the app loads in sandbox mode. Sandbox mode is a flag; with it off, the adapters expect real sources. Nothing from the sandbox is ever written to a real store.

## Non-Goals in V1

- Grades and letter marks. Progress is outcomes; a grade view can be derived later for compliance.
- Attendance as a compliance record. Slot status captures presence for planning only.
- Family accounts. Family visibility comes after the student and mentor views work.
- Credential issuance. The wallet and CLR export are a later spec.
- Scheduling adults' full days. V1 schedules students against adult availability; adult-side optimization is the engine spec.

## Decisions Recorded

- Science and humanities content is carried by Cognitive Skills only. Content codes exist for math alone.
- No grade levels. Level (Expose, Explore, Pursue, Launch) replaces grade band everywhere, including rubric expectations. Launch is the fourth level, matching the Launch stage in How Summit 3.0 Works.
- Common Core ELA is in the graph as reference under the cognitive skills, never scored on its own.
- The knowledge graph (Spec 10) is a v1 object: a basic graph of outcomes, lessons, and experiences with typed edges, modeled on the Learning Commons Knowledge Graph.
- No phase of the year. How much of the week a student builds is a per-student setting (see Spec 2, plan_autonomy), set with the mentor.
- Futre adapter fields are specified in Spec 7.
