# Review — watchdog-exit (pi-review and pi-worker end an attempt as soon as pi exits), 2026-10-19 (Fable, the land reviewer)

Review `git diff b3f6ec2..HEAD` on `feat/watchdog-exit` (the lane branched from main at `b3f6ec2`; main is `73f39d5`
as this brief is written, and `git merge-base HEAD main` is `b3f6ec2`). The plan of record is
`docs/reviews/watchdog-exit-2026-10-19/must-meet.md`: WE1 to WE6, rows R-1390 to R-1395. `plan-attack.md` holds the
adversary's AMEND and `build-brief-1.md` the one build. The seat's record is `seat-verify-6ee931f.md`: CI on macOS,
Ubuntu and Windows (the Windows log `ci-windows-run-1.log` beside it), the wrong-code pairs (`seat-mutate.mjs`,
`seat-mutate-output-c99e329.txt`: 8 of 8 red, 0 survived) and the independent check (`independent-check-6ee931f.md`:
HOLDS, no MUST).

The code under review: `runOnce` in `packages/nana-pack/bin/pi-watchdog.mjs`, which pi-review and pi-worker both run,
one README sentence, and the new `packages/nana-pack/tests/watchdog-exit.test.mjs`. Judge whether the lane fails open
(pi-review writing a review to `--out` or exiting 0 for an attempt that did not produce one; a reservation, review
checkout or lane lock left held, or freed while pi still runs; a stalled or over-time pi no longer killed), whether it
leaves a harm the review standard lists (data lost or corrupted, such as captured output cut short; a test writing
outside its temp folders; a broken install or hook), and whether anything main does today stopped working on macOS,
Linux or Windows.

Threat model: honest variation in our tools' output and the OS is in scope (a POSIX signal exit, Windows' exit code 1
for a self-kill, `ps` or PowerShell CPU reads, when pi exits relative to a poll or a CPU read); deliberate forgery is
out. Lane class: gate (the review and builder launchers).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, and every failing CI file is
in main's set; (4) HANDOFF and the session entry are true; (5) any MUST.
