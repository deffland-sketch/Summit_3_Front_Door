# Decisions

One line per technical decision, newest at the bottom. Product questions live in QUESTIONS.md.

- TypeScript pinned to 5.9 instead of the Vite template's 7.0 preview, so Vitest, tsx, and editor tooling behave predictably.
- Vite 8 + Tailwind v4 via `@tailwindcss/vite`; brand tokens live in `src/index.css` `@theme` and dark mode flips semantic tokens under `[data-theme="dark"]`.
- React Router 8 (`react-router` package) with routes `/s/:studentId/*`, `/m/:mentorId/*`, `/x/:adultId/*`, `/l/*` per Spec 9.
- Vitest runs unit tests from `src/**` and `seed/**`; Playwright runs `e2e/**` against `vite preview` on port 4173 (preinstalled Chromium at `/opt/pw-browsers`).
- `npm test` is unit tests only; `npm run test:e2e` runs Playwright separately so the pre-commit check stays fast.
- Lint is oxlint (Vite 8 template default); `npm run build` runs `tsc -b` with `strict` on before `vite build`.
- Path alias `@/` maps to `src/`.
- CI is one GitHub Actions job: `npm ci`, `npm run build`, `npm test`.
- Vercel deploy is static with an SPA rewrite in `vercel.json`.
- Zod 4 schemas, one file per object in `src/model`, with shared enums in `enums.ts`; the whole sandbox is one `SandboxSchema` snapshot and the engine is pure functions over it.
- Days are ISO dates (`YYYY-MM-DD`) on Slot and Offering; weekday names (`mon` to `fri`) on the standing lists (protected slots, life constraints, adult availability) because those repeat weekly.
- Times are `HH:mm` strings; helpers convert to minutes for overlap math.
- IDs are prefixed deterministic strings (`stu_001`, `les_im1_u2_l03`) rather than uuids, per Spec 9, so fixtures diff cleanly.
- Slots are embedded in their Plan (the Plan is the aggregate root) and keep `plan_id`; a flattening selector serves day-wide queries.
- Added fields, each noted in Spec 1: Slot.evidence_id and Slot.added_at, Touchpoint.private, Group.name, Settings.level_targets, Settings.changed_at and changed_by. Added two read-only shapes to Spec 1: FutreRecord (the adapter return, Spec 7) and GatheringLogEntry (the Evidence Log line).
- Courses, units, and lessons are three collections; Course.units holds unit ids.
- Draft plans have `published_at: null`; the Friday build sets `published_at`, the mentor's Monday confirmation sets `confirmed_by`.
- Workshop proposals are engine output held in UI state with an accept, change, or decline decision; they are not a stored object.
- The store is a vanilla Zustand store wrapped by a `SandboxRepositories` interface (`collection(name).upsert` and friends) so a real API drops in behind the same calls.
- Learning Commons Knowledge Graph v1.15.0 exports were fetched at build time (352 MB nodes, 603 MB relationships, streamed and filtered in under two minutes). Kept the 132 Multi-State mathematics standards IM Math 1 to 3 cite, the 609 learning components beneath them, and the 134 `buildsTowards` edges among them, written to `src/graph/data/lc-math.json` by `seed/lc-import.ts` and committed so the app build needs no network.
- Math progression edges carry `source: learning_commons, confidence: 1`; cognitive skill, habit, ELA, lesson, experience, credential, and pathway edges are authored at `confidence: 0.7`.
- IM Math 1 to 3 is the integrated sequence (7 to 8 units each) with lesson titles from the IM course outlines; each math lesson is tagged to two of its unit's standards in rotation and lists the previous lesson as a prerequisite.
- OpenSciEd and AP courses are authored in `src/graph/authored/courses.ts`, 6 units each, 8 lessons per unit, tagged to two cognitive skills from a per-unit pool; science lessons add a lab mode every fourth lesson and humanities lessons a seminar mode.
- CCSS ELA is 32 anchor standards plus the grades 9 to 10 band for reading literature, informational text, and writing (62 reference nodes), each with authored `supports` edges into cognitive skills.
- The 36 cognitive skills use level expectations 3, 4, 5, 6 at Expose, Explore, Pursue, Launch, with three harder skills (Designing processes, Modeling, Counterclaims) one point lower; Summit's rubric gives per-grade expectations, so these are the level translation.
- Habits of Success use the Building Blocks for Learning structure (5 blocks, 16 habits) with authored builds_toward edges from lower blocks to higher ones.
- Graph queries (whatServes, whatUnlocks, gapsTo, pathwaysNear, underneath) live in `src/graph/index.ts` as pure functions over an in-memory adjacency map; walks are bounded to three hops and return the edges traversed.
- `seed/` compiles under its own `tsconfig.seed.json` with Node types; the app tsconfig covers `src/` only.
