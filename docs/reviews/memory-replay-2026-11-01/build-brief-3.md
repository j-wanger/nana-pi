Feature: FEAT-043 · Measure memory outcomes

Lane memory-replay. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on branch tip c447b9f2. Round 2 said LAND at c447b9f2 (`r2` text kept before the next round). Main has moved past this branch's base: watcher-clock (lane-watcher) and audit-test-speed (component-audit test) landed. This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-039.md`

Report each departure.

## Build

Merge `origin/main` into `feat/memory-replay`. Keep both sides: every landed ID on main as it is, this lane's R-3370 to R-3389, SUB-025 and A-097; all session entries whole, byte for byte as on their branches, newest first; known-bug files as the union of both sides. You may edit `docs/sessions/2026-10.md` and `docs/known-bugs/*.md` only as the merge requires. Change no behaviour. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-pack/tests/memory-replay.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch and stop; the seat waits for CI. Do not run the locked full suite; CI is the suite.
