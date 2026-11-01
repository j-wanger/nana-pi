Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip dda8d9e2. Round 1 said LAND at dda8d9e2 (its text kept before the next round). Main has moved past this branch's base: watcher-clock (lane-watcher), audit-test-speed (component-audit test) and possibly memory-replay landed. This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-039.md`

Report each departure.

## Build

Merge `origin/main` into `feat/anatomy-labeller`. Keep both sides: every landed ID on main as it is, this lane's R-3390 to R-3398 and A-098; all session entries whole, byte for byte as on their branches, newest first; known-bug files as the union of both sides. You may edit `docs/sessions/2026-10.md` and `docs/known-bugs/*.md` only as the merge requires. Change no behaviour. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node apps/bench/test/anatomy-labels.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch and stop; the seat waits for CI. Do not run the locked full suite; CI is the suite.
