Feature: FEAT-042 · Measure builder context

Lane anatomy-label-check (Part 2 of the builder-context labeller). Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main 06287a95. The plan of record is `plan.md` in this folder, revision 2 after `plan-attack.md`; build to its eight must-meets T1 to T8 (R-3399 to R-3406) and its three seals, and follow its Precedent section, Assumptions and Open choices (take the plan's defaults).

Threat model: honest variation in our tools' output is in scope (labels stores from capped and resumed runs, torn tails, oversize and duplicate units, sheets that differ only by cwd or branch); deliberate forgery, such as a planted store or hand-made labels, is out.

## Precedent

- `apps/bench/lib/anatomy.mjs`
- `apps/bench/lib/anatomy-labels.mjs`
- `apps/bench/lib/anatomy-measures.mjs`
- `apps/bench/lib/anatomy-config.mjs`
- `apps/bench/test/anatomy-labels.test.mjs`
- `docs/reviews/anatomy-labeller-2026-11-01/plan.md` (Part 1, its Seat measurement section)

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code), then code. Moving `distinctUnits` into `anatomy-measures.mjs` and adding a shared read-only labels reader are authorized helper moves; the second caller imports, never copies. Add Part 1's carried known bugs to `docs/known-bugs/FEAT-042.md` as the plan lists them. Update the bench README's anatomy section so it no longer says model-label readers come later.

Run every reader on synthetic stores only. Never read `~/nana-memory-runs` or any private store, and print no unit text or keys in any output or test.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node apps/bench/test/anatomy-labels.test.mjs` and every other touched test file, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
