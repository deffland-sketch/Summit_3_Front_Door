# Spec 9: Build Plan for an Unattended Run

Summit 3.0 Homebase · Working draft v1 · October 20, 2026

This plan is written so Claude Code can run from start to a demo-ready prototype without stopping. It is a prototype on invented data; a wrong call costs a restart, not a student. Decide, record, move on.

## Phases

| Phase | Build | Done When |
|---|---|---|
| 0. Scaffold | Vite, React, TypeScript, Tailwind, Router, Zustand, Zod, Vitest, Playwright; CLAUDE.md at root; DECISIONS.md and QUESTIONS.md created; Vercel config; CI script | `npm run build` and `npm test` pass on an empty app |
| 1. Model | Zod schemas for all twelve objects exactly as Spec 1; repository interface; in-memory store | Schema tests pass; a fixture of one student round-trips |
| 2. Outcomes, curriculum catalog, and knowledge graph | 36 cognitive skills with level expectations for four levels; 16 habits; CCSS math standards for Math 1 to 3 (use the IM course standard lists); CCSS ELA anchor standards as reference nodes; 10 courses with realistic unit and lesson titles from IM, OpenSciEd, and AP course frameworks, each lesson tagged to outcomes; the graph in Spec 10 with its typed edges, loaded from the Learning Commons exports for the math hub if reachable, authored by hand otherwise | Catalog loads; every lesson has at least one outcome; math lessons have CCSS codes; science and humanities lessons have cognitive skills only; the graph passes Spec 10 acceptance |
| 3. Seed generator | `seed/generate.ts`, deterministic, producing every set in Spec 1 with the stated distributions; writes `/public/sandbox/*.json` | Counts and distributions in Spec 1 met within 10%; the named situations exist (three ready for validation, six nudges, one family call, a third of students with an RW slot per day) |
| 4. Engine | needs, proposeWorkshops, buildWeek, adjustOvernight, suggestLevelReview, and the option ranker, per Spec 6 | Spec 6 acceptance tests pass, including the 500-perturbation property test |
| 5. Student screens | All eight screens in Spec 2 with the components in Spec 8 | Spec 2 acceptance met; Playwright happy path for a student passes |
| 6. Mentor screens | Spec 3 | Spec 3 acceptance met; Playwright happy path passes |
| 7. Supply screens | Spec 4, including the weekly build runner | Spec 4 acceptance met |
| 8. Lead screens | Spec 5, including the model dashboard | Spec 5 acceptance met |
| 9. Adapters and sandbox controls | Spec 7 stubs and the SandboxControls panel | Lowering a Kira score, adding a Futre reflection, and cancelling a partner slot each change the week visibly |
| 10. Polish | Dark mode, Spanish draft, text size, reduced motion, display board, README with a demo script for a 10-minute walkthrough | Lighthouse accessibility 95 or above on Today; README demo script runs |

Commit at the end of every phase with the phase name. If a phase cannot be finished, commit what works, write the gap in QUESTIONS.md, and continue to the next phase. Never leave the build red at a commit.

## Technical Defaults (Decide Without Asking)

- Learning Commons: try to fetch the public exports named in Spec 10 at build time. If the fetch fails or the files are too large to process in reasonable time, author the math progression edges by hand from the IM course sequence and note it in DECISIONS.md. Never block a phase on an external download.
- Routing: `/s/:studentId/...`, `/m/:mentorId/...`, `/x/:adultId/...`, `/l/...`. A role switcher on the landing page for the sandbox; no auth in v1.
- State: one Zustand store per repository; selectors memoized; the engine is pure functions over store snapshots.
- Dates: date-fns; the sandbox week is fixed to a known Monday so demos are stable; a "today" control in SandboxControls.
- IDs: deterministic from the seed (hash of type plus index) so fixtures are diffable.
- Tests: Vitest for model and engine; Playwright for four happy paths; no snapshot tests of markup.
- Copy: all strings in `src/copy/en.ts`; Spanish machine-drafted in `es.ts` and flagged.
- Deploy: Vercel static; `vercel.json` with SPA rewrites.

## Product Questions (Record, Assume, Continue)

Write each in QUESTIONS.md as: the question, the assumption you took, where in the code it lives. Examples that will come up: the exact wording of the three level names on screen; whether Expose students see Pursue offerings; how many open slots a guided student gets per day; what the display board shows for RW students off campus.

## Demo Script (For the README)

1. Land on the role switcher. Pick a student at Explore level with an RW slot today.
2. Today: walk the day, open a Required slot's why, open the evidence behind it.
3. Progress: show in-reach outcomes; open one to its evidence.
4. SandboxControls: lower that student's math mastery on the active lesson; run adjustOvernight; return to Today and show the new slot with its why.
5. Mentor: open the caseload; find the student; add a Habits touchpoint; show it on the student's Today.
6. Content expert: show Proposed Workshops; accept one; show the roster.
7. Lead: Dashboard, Equity Snapshot, Time and Talent against targets, the model dashboard.
8. Change grouping_threshold in Settings; rerun the build; show the proposal count change.
