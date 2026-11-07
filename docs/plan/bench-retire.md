# Plan: bench-retire (reduction batch 2)

Feature: FEAT-034 · Define reproducible comparisons

## Purpose

The owner, 2026-11-07, batch-2 pick "Benchmark study runners": cut them; the builder-anatomy tools stay because they serve the context work. Evidence (seat inventory, 2026-11-07): the tool-profile study finished 2026-09-08 and the catch-ledger study 2026-09-28; no run since; about 6,000 lines. Three live helpers must move first: `globMatch` (read by scripts/deliverables.mjs and scripts/product-report.mjs), `parseStream` in usage.mjs and `callJudge` in catch-judge.mjs (read by scripts/memory-shape-runners.mjs), plus `cohensKappa`/`seededSample` and `readJsonl` that anatomy uses.

## Assumptions

- A1. Cut: `apps/bench/run.mjs`, `aggregate.mjs`, `catch-ledger.mjs`, `ext/bench-nested-usage.ts`, `lib/nested.mjs`, `lib/pi-exports.mjs`, `lib/profiles.mjs`, `lib/catch-extract.mjs`, `lib/eval-module.mjs`, `lib/fixture.mjs`, `lib/agentdir.mjs`, `lib/plan.mjs`, the catch-only parts of `lib/catch-stats.mjs` and `lib/checkers.mjs`, and the study-only parts of `lib/usage.mjs`, with their tests. Verify each against its readers before deleting; the seat inventory's verdicts (with three challenger refutations about plan.mjs, eval-module.mjs and fixture.mjs) are evidence, not orders.
- A2. Keep: `anatomy.mjs` and every `lib/anatomy*.mjs` (the seat-study adapters `anatomy-seat.mjs` and `anatomy-slots.mjs` stay too), and the moved helpers.
- A3. The studies' recorded results (`apps/bench/studies/**/VERDICT.md`, `RESULTS*`) stay as records; their frozen fixture trees stay untouched.
- A4. FEAT-034 to FEAT-038 rows that describe the cut runners are retired, and their artifact Made-by/Read-by lines are edited so the deliverables check stays green.
- A5. A history script under docs/reviews that imports catch-extract becomes dead; it is history and is not edited.
- A6. One reviewer plus CI.

## Open choices

- O1. Builder picks where each moved helper lives (a small shared module beside its live reader is preferred).

## Questions for the owner

None.

## Threat model

Honest variation in tool output and Windows paths. Forgery out.

## Precedent

- `apps/bench/lib/checkers.mjs` (`globMatch`), `apps/bench/lib/usage.mjs` (`parseStream`), `apps/bench/lib/catch-judge.mjs` (`callJudge`), `apps/bench/lib/catch-stats.mjs` (`cohensKappa`, `seededSample`), `apps/bench/lib/plan.mjs` (`readJsonl`): call each moved helper rather than re-implementing it; update every caller and import the public name.
- `docs/plan/one-reviewer.md`: the retirement shape this lane follows.

## Outside precedent

none: removal of in-house study runners.

## Must-meet

- M1 (gone). The study runner and catch-ledger files listed in A1 do not exist, and no tracked file outside history folders imports them.
- M2 (helpers moved, outputs unchanged). `scripts/deliverables.mjs` and `scripts/product-report.mjs` produce byte-identical output on this repo before and after the move.
- M3 (memory shaping and anatomy unchanged). `scripts/memory-shape-runners.mjs` and the anatomy labeller still work: their existing tests pass unchanged except import paths.
- M4 (anatomy CLI). `node apps/bench/anatomy.mjs` runs each existing subcommand on its test fixtures with the same output as before.
- M5 (records and checks). The studies' VERDICT and RESULTS files still exist; the cut rows are `retired`; map, readme, tree, deliverables and component-audit checks are green; README and AGENTS no longer describe the study runner.
- M6 (adversary 1: fixture copies). `requirements-tree.test.mjs` and `requirements-regroup.test.mjs`, whose fixture builders copy modules by path, pass after the deletions with their assertions kept and the copies naming the moved helper.
- M7 (adversary 2: first-look paths). A change to only the moved report helper's path makes first-look take its capture path, not print "no page-shaping changes" (first-look-config's page-shaping list names the new path).
- M8 (adversary 3: records untouched). Every tracked path under `apps/bench/studies/` is byte-identical to the base: zero additions, deletions or content changes. This replaces M5's existence check for the records.
