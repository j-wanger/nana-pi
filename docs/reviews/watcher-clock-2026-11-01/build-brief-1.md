Feature: FEAT-006 · Launch builders with execution limits

Lane watcher-clock. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary`; it notes that `lane-watcher.mjs` also reaches `claude-review.mjs`). Builder: pi-worker (small lane). Build session 1, on main ad9612dd.

The problem: on 2026-11-01 between 06:00 and 07:00 UTC, the repeated hour after the US fall-back clock change, R-2726 (`packages/nana-pack/tests/worker-claude.test.mjs`) failed on main and in a lane, and passed again after 07:00 UTC. `defaultProcessStartedAt` in `packages/nana-pack/lib/lane-watcher.mjs` reads `ps -o lstart=`, a local wall-clock time with no zone, and parses it with `Date.parse`. In the repeated hour the parse lands an hour early, so a process started after the builder record looks older than it and the watcher signals it: for one hour a year the watcher can stop an unrelated process. This is a fix that restores R-2726's agreed behaviour, so it has no plan round and no new row.

Threat model: honest variation in clocks, time zones, locales and `ps` output across macOS and Linux is in scope; deliberate forgery is out.

## Precedent

- `packages/nana-pack/lib/lane-watcher.mjs`
- `packages/nana-pack/tests/lane-watcher.test.mjs`
- `packages/nana-pack/tests/worker-claude.test.mjs`

Report each departure.

## Build

1. Read a process's start time without wall-clock parsing: for example `ps -o etime= -p <pid>` (elapsed time, `[[dd-]hh:]mm:ss`, on both macOS and Linux) subtracted from the current time, through the existing injected `run` seam. Keep the existing fail-safe: an unreadable start time is treated as R-2726 says.
2. Add a test in `lane-watcher.test.mjs`, under R-2726's marker, that pins the clock-change case through injection: with an injected clock and `ps` output for a process that started after the record, the watcher does not signal it, including when the local zone is in a repeated hour. Show it red on the current code, then green. Also pin the `etime` forms with and without days and hours.
3. If you keep any wall-clock parse, say why in your report.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The red-then-green run and the locked full suite in the foreground (`npm run test:locked`).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request, and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
