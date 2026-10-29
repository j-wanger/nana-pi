Feature: FEAT-006 · Launch builders with execution limits

Lane outside-precedent. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/outside-precedent. The plan of record is `docs/reviews/outside-precedent-2026-10-29/plan.md`; read `plan-attack.md` beside it. Build must-meets 1 and 2. New rows take IDs from R-3030. The quoted sentences are exact; do not reword them. Do not touch `pi-worker` or the brief check.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

Each row is `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each check as written; proof each fails when its sentence is removed (scratch copy); every existing test you changed.

## Precedent

- `packages/nana-pack/prompts/planner.md`: the section-order and public-references sentences.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: the R-2950 to R-2954 and R-3010 pins.
