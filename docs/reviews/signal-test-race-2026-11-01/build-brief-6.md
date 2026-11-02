Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Builder: pi-worker (small lane). Build session 6, on branch tip 6e74b6a8. Main moved to d4285b6c (claude-cmd-launch landed). This build only merges main.

## Precedent

- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-031.md`
- `docs/reviews/signal-test-race-2026-11-01/build-brief-3.md`

Report each departure.

## Build

Merge `origin/main` into `feat/signal-test-race`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes to `worker-claude.test.mjs` (R-2693 only) and `test-locked.test.mjs`, its session entry, its FEAT-031 known-bug line and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only the two test files, `docs/code-map.md` if regenerated, `docs/sessions/2026-10.md`, `docs/known-bugs/FEAT-031.md` and the lane folder. Both test files, `npm run map:check`, `npm run readme:check` and `node scripts/identity-scan.mjs --root .` pass. Push and stop.
