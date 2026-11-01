Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate. Builder: pi-worker (small lane). Build session 4, on branch tip 816b0f76. Round 2 said LAND from both reviewers at 816b0f76 (kept in this folder), but main moved to 0b434e94 (memory-replay, making-session-end and anatomy-labeller landed) before the land. This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `packages/nana-pack/bin/nana-land.mjs`

Report each departure.

## Build

Merge `origin/main` into `feat/ci-suite`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted: never restore a line main removed. Keep this lane's additions: R-3430 to R-3437, R-1110's retirement, its `nana-land` and record changes, the runner's filters field, the builder preamble and rulings changes, its session entry, its known-bug lines in FEAT-008, FEAT-029 and FEAT-039, and its review folder. `nana-land.mjs` gained a memory-making start on main earlier; if the merge touches it, keep both sides' behaviour. In `docs/sessions/2026-10.md` keep every entry whole, byte for byte as on its branch, newest first. In `HANDOFF.md` take main's "Lanes in flight" line. Change no behaviour. Renumber nothing. Regenerate maps and the requirements tree only if the merge requires it. Re-run the lane's mutation runner and report it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: the lane's touched test files, the mutation runner, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. This lane changes the test runner, so run `npm run test:locked` once in the foreground on the final tip and report its summary. Push the branch and stop.
