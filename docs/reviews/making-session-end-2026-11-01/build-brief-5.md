Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Builder: pi-worker (small lane). Build session 5. Round 2: the final reviewer said LAND; the land reviewer sent back on the npm `claude.cmd` finding, and the owner decided to land and fix that in its own lane (recorded in the session entry). Main has moved to 81b78dfa (audit-test-speed landed). This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-039.md`

Report each departure.

## Build

Merge `origin/main` into `feat/making-session-end`. Keep both sides: every landed ID on main as it is, this lane's R-3350 to R-3362 and its SUB-024 rows; all session entries whole, byte for byte as on their branches, newest first; known-bug files as the union of both sides. You may edit `docs/sessions/2026-10.md`, `HANDOFF.md` and `docs/known-bugs/*.md` only as the merge requires; for HANDOFF keep this branch's "Lanes in flight" line. Change no behaviour. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it. Re-run the lane's mutation runner and report it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Push the branch and stop.
