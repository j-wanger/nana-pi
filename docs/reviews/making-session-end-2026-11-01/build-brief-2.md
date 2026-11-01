Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Builder: pi-worker (small lane). Build session 2, on branch tip 72d2f5d2. Main has moved to 6c4b5363: lanes builder-anatomy (FEAT-042, R-3270 to R-3278, A-092) and watcher-clock (a lane-watcher change) landed.

The lane's independent check (`independent-check-72d2f5d2.md`) passed with notes only; the seat records those as known bugs. This build only merges main.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `packages/nana-pack/lib/lane-watcher.mjs`

Report each departure.

## Build

Merge `origin/main` into `feat/making-session-end`. Keep both sides: every landed ID on main as it is, this lane's R-3350 to R-3369 and its SUB-024 rows; all session entries whole, byte for byte as on their branches, newest first; you may edit `docs/sessions/2026-10.md` only as the merge requires. Change no behaviour. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it. Re-run the lane's mutation runner after the merge and report it. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit (a `pi post-edit` `write-error` is the known builder-environment failure).

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch and stop; the seat waits for CI.
