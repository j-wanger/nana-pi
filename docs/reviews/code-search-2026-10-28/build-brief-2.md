Feature: FEAT-029 · Navigate code and investigate impact

Lane code-search. Class: ordinary (`node scripts/lane-class.mjs --root . --files` on the planned files prints `ordinary`). Builder: pi-worker (larger lane). Build session 2.

Work in the lane worktree on feat/code-search, based on main at b547596f. The plan of record is `docs/reviews/code-search-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it. The trial behind the plan is under `trial/` beside it: `structure.mjs` (the search to follow), `landed-reuse.json` (the answer key) and `needs.json` (the ten needs and their base commits). The plan has no list of allowed edits.

What the lane does, in one sentence: planners get a code search command over an improved code map that suggests the existing code a lane should follow.

Build 1 stopped BLOCKED on the trial helpers. `trial/structure.mjs` is a record of the seat's trial, not a module of this repo and not a private helper: nothing imports it and nothing will. Write the ranker as new tracked code that follows it; that is not a copy of a private helper, and no move is needed. Leave the `trial/` folder unchanged.

Build must-meets 1 to 5 and the sealed tunables. New requirement rows take IDs from R-3000.

- Commit the ten needs and the answer key as a test fixture; the review folder copy is the seat's record, not a fixture.
- Keep the template generator and the Python template unchanged (plan O3).
- No network and no model call anywhere.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the search's output for two of the ten needs; the measured share on the ten needs and the check's time; which headers you changed and why; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/code-map.mjs`: the generator wrapper and its `--impact` mode.
- `docs/reviews/code-search-2026-10-28/trial/structure.mjs`: the ranking to follow, without its facets.
- `packages/nana-knowledge/lib/tokenize.ts`: the stopword list, if reused.
- `packages/nana-pack/prompts/planner.md`: the Precedent instructions.
- `packages/nana-pack/tests/lane-class.test.mjs`: a recent test that reads history at fixed commits.
