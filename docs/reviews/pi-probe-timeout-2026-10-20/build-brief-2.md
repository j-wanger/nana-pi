# Build brief 2 — pi-probe-timeout (the seat, 2026-10-20)

Feature: FEAT-013 · Install and connect harness runtimes. Lane class: install, hook or gate. Build 1 is `4c67ba2c`
(main merged at `4dcc19b5`). The seat's wrong-code pairs gave 23/24 red, and one independent check HOLDS with two
known bugs. This build fixes one known bug and the one survivor. Keep everything else as it is.

## 1. Ctrl-C lets pi clean up before the relay kills it (new row R-2027)

The independent check ran a fake `pi install` that takes a lock folder and removes it in its own SIGINT handler.
It sent SIGINT to the process group. On main the lock was gone afterwards. On the lane the lock stayed,
because pi now runs in its own group, so only the relay gets the terminal's SIGINT, and the relay's `terminate()`
SIGKILLs pi's group at once. pi's real lock goes stale after 10 s, so a re-run inside that window fails.

Change `bounded-spawn-child.mjs`'s signal path (not the deadline path, which stays SIGKILL):
- POSIX: on SIGINT, SIGTERM or SIGHUP, send that same signal to pi's group, wait up to a new sealed
  `RELAY_SIGNAL_GRACE_MS` for the child to close, then kill the tree as today, then exit 128 + the signal number.
  Define the grace in `bounded-spawn.mjs` beside `RELAY_SETTLE_MS`, with `chosen` and the reason as provenance,
  and pin it with one test naming R-2027 (the one-test-per-sealed-tunable rule).
- Windows: the console delivers Ctrl-C to pi itself (it is not detached there), so on the signal wait up to the same
  grace for the child to close, then `taskkill` as today. Do not try to send a console event.
- A second signal during the grace kills at once.

Row R-2027 (EARS, one shall): "WHERE the platform is not win32, IF install's process group receives SIGINT while
install waits on a pi launch, THEN install shall pass SIGINT to that launch's processes before it ends them."
Must-meet test in `pi-launch-limits.test.mjs`, POSIX only (declare the Windows skip with its reason): a fake
`pi install` that takes a lock folder, installs a SIGINT handler that removes it and exits, and otherwise hangs;
SIGINT the install's group; the lock folder is gone and no process the launch started is alive. Red today: the
lane's current relay leaves the lock (the check's probe 8). R-2026 must still pass: a pi that ignores SIGINT is
still ended after the grace.

## 2. The survivor B3: the stop must come from the relay's own limit

With the relay never told the limit, the outer backstop stops it at limit + `RELAY_BACKSTOP_MS` (3 s + 5 s), and the
tests still pass because `BOUND_MS` is 9 s. Write the elapsed bound in R-2020, R-2021 and R-2022's checks from the
imported names so it sits below `LIMIT_MS + RELAY_BACKSTOP_MS` (for example `LIMIT_MS + RELAY_SETTLE_MS + a margin
you name and justify`). Do not change the product's backstop. Check that a relay that ignores the limit now turns
those checks red (try it in a temp copy).

## Not in this build

The combined 1 MiB output line (the check's finding 2) stays a known bug; the seat records it.

## Done

R-2027 implemented and its test passes; R-2020 to R-2026 still pass; single test files only
(`pi-launch-limits`, `doctor-runtime`, `pi-registration`); `map:check`, `readme:check` and
`node scripts/requirements-trace.mjs` exit 0. Do not run the full suite. Do not push, open a pull request, or
edit HANDOFF.md or docs/sessions/. Commit on feat/pi-probe-timeout.

## Report (at most 10 lines)

VERDICT, commit, the new sentence the README or row now says (if any), the grace value and its reason, the
wrong-code tries you ran and which checks turned red, and anything not done.
