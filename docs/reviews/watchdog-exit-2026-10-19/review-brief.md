# Review — watchdog-exit (pi-review and pi-worker end an attempt as soon as pi exits), 2026-10-19 (Opus, the final reviewer)

Feature: the review and builder launchers' liveness watchdog (FEAT-007 · SUB-008, run and stop an isolated reviewer)

Review `git diff b3f6ec2..HEAD` on `feat/watchdog-exit` (the lane branched from main at `b3f6ec2`; main is `73f39d5`
as this brief is written, and `git merge-base HEAD main` is `b3f6ec2`). The plan of record is
`docs/reviews/watchdog-exit-2026-10-19/must-meet.md`: WE1 to WE6, rows R-1390 to R-1395; `plan-attack.md` holds the
adversary's AMEND and `build-brief-1.md` the one build. The seat's record is `seat-verify-6ee931f.md`: CI on all three
legs (the Windows log `ci-windows-run-1.log` beside it), the wrong-code pairs (`seat-mutate.mjs`,
`seat-mutate-output-c99e329.txt`: 8 of 8 red, 0 survived) and the independent check (`independent-check-6ee931f.md`:
HOLDS, no MUST, one known bug recorded as a residual).

Tree movement: six rows added, R-1390 to R-1395, all `implemented`, under SUB-008 (18 to 24 rows; FEAT-007 80 to 86;
CAP-02 123 to 129; leaf total 1,215 to 1,221). No existing row changed.

The code under review: `runOnce` in `packages/nana-pack/bin/pi-watchdog.mjs` (one `ended` promise per attempt, settled
by pi's `exit` or `error` event; each poll races its timer, the signal wait and `ended`, then clears the timer; the
after-loop wait is `await ended`), one sentence in `packages/nana-pack/README.md`, and the new
`packages/nana-pack/tests/watchdog-exit.test.mjs`. Judge whether an attempt now ends as soon as pi exits on every exit
path (exit 0, a non-zero exit, a signal the watchdog did not send, a spawn error), and whether stall detection, the
wall-clock ceiling, SIGINT, SIGTERM and SIGHUP handling, retries, the lane lock, the review checkout and reservation
cleanup, and the stderr lines stay as main has them.

Threat model: honest variation in our tools' output and the OS is in scope (a POSIX signal exit, Windows' exit code 1
for a self-kill, `ps` or PowerShell CPU reads, when pi exits relative to a poll or a CPU read, poll and stall settings);
deliberate forgery is out. Lane class: gate (pi-watchdog runs behind pi-review and pi-worker, the review and builder
launchers).

Check: (1) each WE check fails on main's watchdog and is not vacuous, on POSIX and on Windows; (2) an attempt still
counts as produced only on exit 0 with non-empty, accepted output, read after pi has exited; (3) stall, ceiling, signal
handling, retries and cleanup are unchanged; (4) the six rows are honest and sit in the right feature (R-1391 and R-1395
name pi-worker but sit under the review feature, beside R-919, as the plan placed them); (5) HANDOFF and the session
entry are true; (6) any MUST.
