# Summit 3.0 Homebase

A prototype of the learner homebase for Summit Public Schools' next model, built on a sandbox of 100 invented students. One web app, four roles (student, mentor, content expert or facilitator, school lead), one data model. The student's page is the product. The sandbox is the product for now: every screen responds to the seed data, and changing a score changes the week.

Everything here is invented. Nothing is written to a real system.

## Run It

```
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm test             # Vitest unit tests, then the Playwright scenario suite (needs a build first)
npm run test:unit    # Vitest only: model, graph, engine, seed, copy
npm run audit        # write audit/engine-audit-<date>.md for a real teacher and coordinator to mark up
npm run test:e2e     # Playwright: one happy path per role plus the sandbox loop
npm run seed         # regenerate public/sandbox/*.json (deterministic)
```

The app loads `public/sandbox/sandbox.json` (about 19 MB, served compressed) into an in-memory store behind a repository interface. The specs live in `specs/`, read them in order. `DECISIONS.md` records every technical call in one line each; `QUESTIONS.md` records every product question with the assumption taken and where it lives in the code.

## The Map to the Model

`/overview` (the orange button on the landing page, and "How This Maps" in every role's nav) lists each feature of the Summit 3.0 model with where it lives in the prototype. The small orange `?` next to every screen title, and next to the sections that matter most, opens the same note for that screen: the model feature it carries and how.

## Demo Script (10 Minutes)

1. **Land on the role switcher.** Tick "With a real-world slot today" and pick a student at Explore level. The page is the student's Today.
2. **Today.** Walk the day: community circle, the pinned "where to be now" slot, the partner placement in the afternoon, reflection at 3:00. Open a Required slot (indigo edge, "Required." in bold) and read its why; expand it and open "The evidence behind this slot" to see the Kira row that placed it.
3. **Progress.** "In reach" leads with the three outcomes closest to the next level and the one thing that gets there. Open one to its evidence and the artifact link. Cognitive skills show as a band against the level expectation; math standards show by unit; the focus habit shows a reflection timeline.
4. **Sandbox controls** (top right). Lower the Kira mastery score on the active math lesson (the default is 41), then "Run adjustOvernight". Go to My Week: a Required practice slot carries the "New since yesterday" tag with the why that names the score. Today shows it in the day.
5. **Mentor.** Open a mentor from the landing page. The caseload sorts by attention: orange dot "Needs a nudge", teal "Ready for validation", up-arrow "Grew this week", red "Family call", indigo "Level review". Open the student, add a Habits touchpoint (the platform suggests the component from the week), then follow "Open the student's Today" to see the touchpoint marker.
6. **Content expert.** Open Renee Castillo (math). Proposed Workshops shows the engine's proposals with the students who need each lesson and the suggested time with zero collisions. Accept one; My Offerings shows the roster on that day.
7. **Lead.** Dashboard (alerts linked to where they are fixed), Equity Snapshot (recurring Required names, no real-world slot in four weeks, fewer than two touchpoints), Time and Talent (the eight-type split against targets, within ten points), Model Dashboard (the funder view: real-world share, workshops traced to need, touchpoints per student, level movement, outcomes moved, the three Sierra metrics as "survey, not yet connected").
8. **Settings.** Change the grouping threshold from 4 to 6; the hint under the field shows the proposal count change at once. "Rerun the build" rebuilds every plan as a draft without touching the published week. The Knowledge Graph screen shows any node with its edges, including the Learning Commons progression edges for math.

Also worth a look: the display board at `/board` (large type, rooms only, never a program name), and Me on a student, where language, text size, dark mode, and reduced motion switch the whole app.

## Status by Phase

**Phase 0, Scaffold.** Done. Vite 8, React 19, TypeScript 5.9, Tailwind v4, React Router 8, Zustand, Zod 4, date-fns, Recharts, Vitest, Playwright against the preinstalled Chromium, a GitHub Actions job that runs build and unit tests, and `vercel.json` with the SPA rewrite.

**Phase 1, Model.** Done. Zod schemas for the twelve objects in `src/model`, one file each, plus the two read-only shapes Spec 1 now names (the Futre record and the gathering log line). The repository interface wraps a vanilla Zustand store; a fixture round-trips through it and through JSON.

**Phase 2, Outcomes, catalog, and knowledge graph.** Done. The Learning Commons v1.15.0 exports were reachable and were streamed and filtered at build time: 132 Multi-State math standards IM Math 1 to 3 cite, 609 learning components beneath them, and 134 progression edges, committed as `src/graph/data/lc-math.json`. The 36 cognitive skills, 16 habits, 62 ELA reference standards, 10 courses (582 lessons), 26 experience templates, 13 credentials, 16 careers, and 9 pathways are authored. The graph queries (whatServes, whatUnlocks, gapsTo, pathwaysNear, underneath) pass the Spec 10 acceptance tests.

**Phase 3, Seed.** Done. `seed/generate.ts` is deterministic and builds every week through the engine. Counts: 100 students (35, 35, 20, 10 by level; 20 with supports and protected slots; 5 with life constraints), 13 adults and 6 partners, 17 places, 245 outcomes, 3,200 assignments, about 11,700 evidence rows over eight weeks, 900 plans, about 2,550 touchpoints, 100 Futre stubs. The named situations hold: three ready for validation, six needing a nudge, one family call, Required on about 38 students and Recommended on 25 more, a third of students with a real-world slot each day.

**Phase 4, Engine.** Done. `needs`, `proposeWorkshops`, `buildWeek` and `buildAllWeeks`, `adjustOvernight`, `suggestLevelReview`, the option ranker, caseload flags, and dashboard alerts, all pure functions over a snapshot. Spec 6 acceptance passes, including 500 random evidence perturbations rebuilt without a constraint violation and the one-lowered-score overnight test.

**Phase 5, Student screens.** Done. Today, My Week, Build My Week (goals, ranked options per open slot, the full menu for shared and owned, swaps with a reason, 1:1 and study-group requests), Progress, My Courses (lesson map with Kira links and proposed workshops), My Pathway (Futre vision, next step, pathway gaps, experiences with reflections written back), Reflection (the 3:00 close), and Me. Playwright walks the student path.

**Phase 6, Mentor screens.** Done. Caseload with flags, sorting, and filters plus the night's moves and student requests; Student with the week, goals, in-reach outcomes, evidence, the conversation bank, level and autonomy changes (one line of reason becomes a goal touchpoint), and focus habits; Touchpoints (two taps); Confirm Monday (approve one or all, change a slot with a reason); Readiness (book an assessment, portfolio review, or defense, which creates the offering and the slot); Family.

**Phase 7, Supply screens.** Done. My Offerings with rosters and "I'm out today", Proposed Workshops (accept, change time, decline with a reason), Needs You (stale evidence, opt-outs, flags), Roster and Notes (exit signals and one-line observations that become evidence), Menu with fill counts and publish toggles, Standing Sessions, and the Weekly Build runner (gather, read, propose, build, publish) for the system architect.

**Phase 8, Lead screens.** Done. Dashboard, Live Board with the printable door roster, Outcomes, Knowledge Graph browser, Equity Snapshot, Time and Talent, Partners, Events, Settings (every rule, with a change log and a rerun), Evidence Log (with one line per engine run), Engine Trace (the evidence, settings, edges, and candidates behind any need, slot, move, proposal, or level review, reached from the "Why this" link on every slot and proposal), and the Model Dashboard. The display board at `/board` is large type, rooms only.

**Phase 9, Adapters and sandbox controls.** Done. Every source has a stub with the Spec 7 interface reading `/sandbox/{name}.json`; the Futre adapter writes back experience reflections. SandboxControls lowers or masters a Kira score, adds a Futre reflection, cancels a partner slot, runs the overnight adjuster, rebuilds a student's week, and moves "today".

**Phase 10, Polish.** Done with one caveat. Dark mode (student toggle and system preference), text size, reduced motion, and the Spanish draft (`src/copy/es.ts`, every key, marked `needs_review`) are in. Lighthouse accessibility on Today scores 100 after the contrast fix (96 before it). The caveat: the Spanish is a machine draft and no Spanish speaker has read it, and stored why lines on slots stay in English (see QUESTIONS.md).

## How to Improve This

One rule: spec before code. A problem becomes a line in the relevant spec under `specs/`, then a line in `ISSUES.md` that cites it, then a build run. Nothing gets fixed from a request that does not cite a spec line.

- `LOOP.md` describes the three cycles (use, critique, build), the four measures per draft, and the two-session rule (a builder works `ISSUES.md`; a separate reviewer writes `REVIEW.md`; merge only when nothing is marked High).
- `ISSUES.md` is the ranked work for the next build run, one line per issue in the format at the top of the file.
- `tests/scenarios/` is the scenario suite, the memory of everything that ever broke. `scenarios.md` indexes the twenty situations; `npm test` runs them after the unit tests, so a red scenario fails the build. Add one for every real issue found.
- `prompts/builder.md`, `prompts/reviewer.md`, and `prompts/critique.md` are the three session prompts to paste into Claude Code.
- `QUESTIONS.md` is the product backlog. Until a question is answered and becomes a spec line, the screen elements that depend on it carry a small "assumed" chip with the question number (on by default; switch it off in Sandbox controls).

## Layout

```
specs/               the ten specs
seed/generate.ts     deterministic sandbox generator; seed/lc-import.ts filters the Learning Commons exports
src/model            Zod schemas, one file per object
src/store            repository interface, in-memory store, actions the screens call
src/engine           needs, proposeWorkshops, buildWeek, adjustOvernight, suggestLevelReview, rank, flags, alerts
src/graph            knowledge graph, catalog, authored frameworks, Learning Commons data
src/adapters         futre, kira, teach_to_one, calendar, partner, gradebook stubs
src/screens          student, mentor, expert, lead
src/components       SlotCard, WeekGrid, OutcomeBand, EvidenceList, FlagDot, TouchpointChip, SandboxControls, ...
src/copy             en.ts, es.ts
e2e/                 Playwright happy paths
tests/scenarios/     the scenario suite (see scenarios.md)
prompts/             builder, reviewer, and critique session prompts
```

## Licenses and Sources

Math standards, learning components, and progression edges come from the Learning Commons Knowledge Graph (CC BY 4.0; progressions CC0 from Student Achievement Partners; learning components CC BY 4.0 from Achievement Network). Cognitive skills and Habits of Success follow Summit's own frameworks. Course and lesson titles follow the public IM, OpenSciEd, and AP course outlines. Student and adult names are invented.
