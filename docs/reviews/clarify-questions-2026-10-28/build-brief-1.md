Feature: FEAT-006 · Launch builders with execution limits

Lane clarify-questions. Class: ordinary (`node scripts/lane-class.mjs --root . --files` on the planned files prints `ordinary`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/clarify-questions. The plan of record is `docs/reviews/clarify-questions-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it. The plan has no list of allowed edits.

What the lane does, in one sentence: every plan ranks its open questions for the owner by the cost of a wrong guess, and the seat posts the top ones as one issue whose label says whether the build waits.

Build must-meets 1 to 4. New requirement rows take IDs from R-3010. The quoted sentences in the plan are exact; do not reword them. Update R-2951's row text and check to name the new section.

The lane touches `packages/nana-setup/`, so run `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` once; a failure at pi post-edit inside pi-worker is a known FEAT-015 bug, so report it and go on.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each check as written; proof each check fails when its sentence is removed (on a scratch copy); every existing test you changed.

## Precedent

- `packages/nana-pack/prompts/planner.md`: the plan's sections.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: the R-2950 to R-2956 sentence pins.
- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide.
- `packages/nana-pack/tests/templates-render.test.mjs`: the checks that already read the seat guide.
