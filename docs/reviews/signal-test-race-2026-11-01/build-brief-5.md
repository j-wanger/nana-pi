Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Builder: pi-worker (small lane). Build session 5, on branch tip a4909b08. Round 3 (kept in this folder as `r3-*.md`) sent back one MUST and one SHOULD.

## Precedent

- `packages/nana-pack/tests/worker-claude.test.mjs` (`startupSignalCase`, `stopFixtureBuilder` near line 257, the R-2692 SIGTERM case near line 567)
- `packages/nana-pack/bin/pi-worker.mjs` (startup signal listeners near line 173), read only

Report each departure.

## Build

1. MUST: keep build 4's SIGTERM on a missed attempt, and put `WC_HOLD_FILE: holdFile` back into `startupSignalCase`'s env (the hold-file path as build 3 had it). Without the hold, the small fake pi exits before pi-worker handles the signal, and pi-worker exits 0; main's run 41362285370 recorded exactly that.
2. SHOULD, which the reviewer traced as the likely real cause of CI run 41367446804's `exit SIGKILL`: `stopFixtureBuilder` reads a pid file that can be empty (the fake Claude creates it before writing the pid), and `Number("")` is 0, so `process.kill(-0, "SIGKILL")` kills the test's own process group. The log shows the kill came during R-2692's cleanup cases, before R-2693. Guard it: do nothing unless the pid is a safe positive integer. Apply the same guard to any other helper in this file that turns a pid file into a kill.
3. Rewrite `build-4-load.txt`'s cause line and this lane's session entry so they state the cause above (pid 0 from an empty pid file, during R-2692) and that the hold file holds the small builder until signalled. Keep it to the facts; do not claim the load runs proved anything.

Keep R-2692's and R-2693's assertions unchanged. Change no product code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Show the guard's effect directly: a short probe, recorded in `build-5-probe.txt` in this folder, that calls the old and new `stopFixtureBuilder` logic on an empty pid file inside a child process in its own process group, and shows the old one kills its caller and the new one does not. `node packages/nana-pack/tests/worker-claude.test.mjs` and `node packages/nana-pack/tests/test-locked.test.mjs` pass, plus `npm run map:check`, `npm run readme:check` and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
