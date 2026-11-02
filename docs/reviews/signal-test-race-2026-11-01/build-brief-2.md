Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Builder: pi-worker (small lane). Build session 2, on branch tip 279c6c0a. Round 1 (kept in this folder as `r1-*.md`) sent back one MUST and one SHOULD.

## Precedent

- `packages/nana-pack/tests/worker-claude.test.mjs` as on `origin/main` (R-2720 and R-2721 around lines 776-803; `groupAlive` at line 255; `killWorkerTree`)
- `packages/nana-pack/lib/lane-watcher.mjs` (the lock release, lines 196-209)

Report each departure.

## Build

1. MUST: the new `processGroupReady` wait uses `groupAlive`, which is always false on Windows, so R-2721's `windows-tree` case never kills the worker and fails on every Windows run; the plain branch also changed from `killWorkerTree(child)` (taskkill /T /F) to `cleanProcess(child.pid)`. Restore R-2720 and R-2721's kill logic exactly as on main: revert this lane's change to that region.
2. SHOULD: the Ubuntu R-2720 failure (job 124957754103 of run 41343316046: started, ready, watcherGone and empty all true, `lock: true`) is not a signal-before-ready race, so a wait before the kill cannot fix it. Do not change R-2720 in this lane. The seat records it as a known bug.
3. Keep this lane's R-2693 and test-locked changes, which round 1 did not fault.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD -- packages/nana-pack/tests/worker-claude.test.mjs` touches only R-2693's case. Both test files pass locally ten times in a row each; report the loop. `npm run map:check`, `npm run readme:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` exit 0. Push and stop; the Windows CI leg is the real check for R-2721.
