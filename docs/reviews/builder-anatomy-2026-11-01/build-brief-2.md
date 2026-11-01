Feature: FEAT-042 · Measure what a builder's context is for

Lane builder-anatomy. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on branch tip 6b02bbb7 (main 8c665dcd).

The final review (round 1) sent the lane back for one MUST: the sampler ignores its seed after the minimum picks. `drawSample` in `apps/bench/lib/anatomy-measures.mjs` fills each tier with `seededSample(ids, units.length, seed)`, whose last step sorts alphabetically, so about 125 of 150 units are the lowest ids, drawn from a handful of builds. Fix it, and take the one SHOULD below. The review text is in this folder's kept reviews; the seat's notes will be rewritten after a new sample, not by you.

## Precedent

- `apps/bench/lib/anatomy-measures.mjs`
- `apps/bench/lib/catch-stats.mjs`
- `apps/bench/test/anatomy.test.mjs`

Report each departure.

## Build

1. Each tier group must come out in seed order, decided by the seed over every unit id. Helper change authorized: give `seededSample` in `apps/bench/lib/catch-stats.mjs` an optional argument that returns the seed order without the final sort; its default and every existing caller stay unchanged, and the catch-ledger tests stay green unedited. Do not copy or re-derive the ordering in `anatomy-measures.mjs`. Fix the comment above `drawSample` so it says what the code does.
2. Strengthen the R-3276 test so it fails on the old code: two different seeds draw different units beyond the minimum picks, and a tier group spread over many builds yields a sample spanning many builds (assert a floor you derive from the fixture, not a magic number). Show it red on the old code, then green.
3. SHOULD: `assemble` writes each attempt's parts so a replay can tell attempts apart; add an attempt field to `parts.json` and pin it in the existing assembly test.
4. Leave the three assembly NOTEs alone; the seat records them as known bugs.

Privacy: never read real sessions or the private store; tests use synthetic fixtures only. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Do not edit `HANDOFF.md`, `docs/sessions/`, `anatomy-counts.md` or `docs/known-bugs/FEAT-042.md`.

## Show your work

The locked full suite in the foreground (`npm run test:locked`). The red-then-green run of the strengthened test.

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and `node scripts/identity-scan.mjs --root .`. Push the branch and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
