# The Engineering Loop

Every change goes through the spec before the code. A problem becomes a line in the relevant spec under `specs/` (or a new acceptance item there), then a line in `ISSUES.md` pointing at that spec change, then a build run. Claude Code never takes a fix request that does not cite a spec line. The specs are the asset; the code is regenerable.

## Three Cycles

**Use.** Weekly, a person per role runs one task from the README demo script on their own screen. Output is a ranked list of what broke, confused, or was wanted.

**Critique.** Between use sessions, persona rounds (student, mentor, content expert, school lead, funder, Info team engineer) read the live app against the specs and produce spec edits written as acceptance items. The prompt is `prompts/critique.md`.

**Build.** Overnight, unattended, one PR per run, working `ISSUES.md` top to bottom. The prompt is `prompts/builder.md`.

## Four Measures per Draft

1. Scenario suite pass rate (`tests/scenarios`, run by `npm test`).
2. Demo script time to complete (the README script, timed).
3. User tasks completed without help (from the Use cycle).
4. Share of "why" lines a mentor says they would read aloud to a student.

## Two Sessions, Never One

A builder session works `ISSUES.md`. A separate reviewer session reads the PR cold against the specs and writes `REVIEW.md` (`prompts/reviewer.md`). Merge only when `REVIEW.md` has nothing marked High.

## The Backlog

`QUESTIONS.md` is the product backlog. Dan answers in weekly batches; each answer becomes a spec line; the next run clears it. Unanswered questions stay assumptions, and the UI shows an "assumed" chip, with the question number, on any screen element that depends on one (the chip is on by default in the sandbox and switches off in Sandbox controls).

## Where Things Live

```
specs/              the asset: ten specs, edited before any code
ISSUES.md           ranked work for the next build run
QUESTIONS.md        the product backlog, each line an assumption until answered
DECISIONS.md        one line per technical decision
REVIEW.md           the reviewer session's findings on the open PR
tests/scenarios/    the scenario suite, one spec per situation; scenarios.md is the index
e2e/                the four happy paths plus the sandbox loop
prompts/            builder.md, reviewer.md, critique.md
src/components/Assumed.tsx   the "assumed" chip
```
