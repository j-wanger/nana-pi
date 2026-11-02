Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on the branch tip. Round 2 said LAND (kept in this folder), but main moved to 57585563 (several lanes landed, including windows-local-suite, which split `profile-store.test.mjs` into `profile-store.test.mjs` and `profile-store-guards.test.mjs`). This build only merges main.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `packages/nana-pack/tests/profile-store.test.mjs`

Report each departure.

## Build

Merge `origin/main` into `feat/seat-memory-push-a`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's additions: R-3410 and R-3411, its `nana-profile.mjs` changes, its README lines, its FEAT-040 known-bug edits, its session entry, its review folder, and its two must-meet tests (A1 role refusal, A2 prefix lookup) plus the uppercase-prefix case. Main split profile-store's tests: put this lane's tests in whichever file main's split places related cases, keeping every main check and every lane check, each passing within that file's time budget. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map and requirements tree only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: `node packages/nana-pack/tests/profile-store.test.mjs`, `node packages/nana-pack/tests/profile-store-guards.test.mjs`, `node packages/nana-pack/tests/requirements-tree.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
