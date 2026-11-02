Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Builder: pi-worker (small lane). Three signal-timing checks fail now and then on hosted macOS and Ubuntu runners, in code no recent lane changed. They cost re-runs and delayed lands on 2026-11-01:
- `packages/nana-pack/tests/worker-claude.test.mjs` R-2693 (macOS, three times: main 81b78dfa attempt 2, making-session-end run 41345664447, main 151c7099 run 41362285370). In the failing small-lane SIGTERM case the worker ended 0 with SUCCESS, so the signal arrived after the fake build had already finished, not "before the builder starts".
- `packages/nana-pack/tests/worker-claude.test.mjs` R-2720 (Ubuntu, once, the SIGKILL `tree` case).
- `packages/nana-pack/tests/test-locked.test.mjs` "handled signals wait for suite termination before releasing the lock" (macOS, once): `firstResult.signal` was SIGTERM with a null code, and `term-ignored` never logged, so the signal reached the child before its handler was installed.

Threat model: honest variation in scheduling on hosted runners is in scope; deliberate forgery is out.

## Precedent

- `packages/nana-pack/tests/worker-claude.test.mjs` (R-2693 at line 616, R-2720 at line 795)
- `packages/nana-pack/tests/test-locked.test.mjs` (line 219)
- `packages/nana-setup/tests/memory-end-hook.test.mjs` (marker-file waits before acting)

Report each departure.

## Build

Make each check signal only at the moment its row names, proven by a marker the fixture writes, never by elapsed time:
1. R-2693: the fake builder must not be able to finish before the signal. Hold it (for example, the fixture waits on a release file the test never writes, bounded by the case timeout) so "before the builder starts" and "temp files exist" are both observable states the test waits for, then signals.
2. R-2720: signal only after the fixture records that the builder process group and watcher exist.
3. test-locked: the fake suite writes a marker after installing its SIGTERM handler; the test sends SIGTERM only after that marker.
Every assertion keeps its meaning and strength; no check is skipped, retried or loosened, and no timeout is raised as the fix. Use named constants for any wait bound, with provenance. No product code changes; no new requirement rows (these pin existing rows).

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Both files pass locally ten times in a row each (report the loop and its result). `npm run map:check`, `npm run readme:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` exit 0. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
