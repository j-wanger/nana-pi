Feature: FEAT-029 · Navigate code and investigate impact

Lane code-search. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/code-search at c4471353. The plan of record is `plan.md` beside this brief. Build 2 is done; the seat's check found one point.

1. **Restore `packages/nana-setup/lib/doctor.mjs` to main's bytes.** Build 2's header edit there makes `node scripts/lane-class.mjs --root .` print `install`, which would put a comment change through the install ladder. Leave doctor's header for a later lane. Re-run the quality floor after the revert and report the new mean share; if it falls under the sealed floor, report that rather than retuning.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

`node scripts/lane-class.mjs --root .` prints `ordinary`. Rows R-3000 to R-3008 stay `implemented`. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: the lane-class line; the mean share after the revert; every existing test you changed.

## Precedent

- `packages/nana-setup/lib/doctor.mjs` on main: the bytes to restore.
- `packages/nana-pack/tests/code-search.test.mjs`: the R-3002 floor check.
