# watchdog-exit: the watchdog ends an attempt the moment pi ends (2026-10-19)

**The feature.** When pi exits, with any exit code or by a signal the watchdog did not send, pi-review and
pi-worker end that attempt at once, not at the next `--poll` tick. Stall detection, the wall-clock ceiling,
signal handling, retries and the stderr lines stay as they are today.

**Measured today** (macOS, fake pi, temp HOME, probes in a `mktemp -d` folder; repo untouched; "fix" = the prototype below):
- pi exits before the first poll: pi-review closes 4,854 ms after pi exits at `--poll 5` (fix: 155 ms); 15.6 s total at the default poll.
- Three instant failures, pi-worker `--poll 2`: 6,048 ms (fix: 130 ms).
- pi exits between polls, `--poll 4`: the attempt ends 3,968 ms after pi exits (fix: 6 ms); two cpu lines in both.
- pi killed by SIGKILL or SIGABRT (Node's abort when it runs out of memory), which the watchdog did not send: pi-review exits 13
  ("unsettled top-level await") without retrying; the checkout and reservation stay until the next launch reclaims them.
  pi-worker `--lane`: exit 13; `nana-lane.lock` stays with the dead pid; the next `--lane` run is refused within 150 ms, and
  the lock is never reclaimed automatically. Fix: exit 1, the retry runs, the checkout, reservation and lock are removed.
  Cause: the after-loop wait checks only `exitCode`, which is null after a signal, and then waits for a `close` event that has already fired.
- review-ledger.test.mjs: 114.3 s on main, 87.5 s with the fix (155/155 both); worker-lane 52/52 with the fix.

**Lane class: gate.** Ladder: final reviewer, land reviewer (or `seat-land.md` when the roster prints `land: seat`),
the seat's wrong-code pairs, one independent check (the Windows CI leg on the exact tip).
**Threat model:** honest variation in scope: platform (a POSIX signal exit; exit code 1 from a self-kill on win32; `ps` or
PowerShell CPU reads), poll and stall settings, when pi exits relative to a poll or CPU read. Deliberate forgery is out.
**Order:** branch after win-review-paths lands. Until then pi-review fails on the Windows leg (short-path bug, HANDOFF), so WE1 and WE4 cannot be read there.

**Design** (prototyped; only `runOnce` in `bin/pi-watchdog.mjs` changes):
1. One `ended` promise per attempt, resolved by the child's `exit` and `error` events (`spawnErr` still set).
2. Each poll races a timer, `signalWait` and `ended`, then calls `clearTimeout`. pi-review exits on its own, so an uncleared timer would keep it alive for the rest of the poll.
3. The after-loop wait becomes `await ended`.
After a wake the checks keep today's order: spawn error, interrupted, exited (break), ceiling, cpu, stall. The 1 s after a stall kill keeps `sleep`.

## Must-meet (rows R-1390 to R-1395; file `packages/nana-pack/tests/watchdog-exit.test.mjs`)

| WE | Row | Requirement (EARS, one shall) | Test title | Today |
|---|---|---|---|---|
| 1 | R-1390 | WHEN pi exits 0 with review-shaped output before the watchdog's first poll, pi-review shall write the review to `--out` and exit 0 less than half a `--poll` interval after pi exits. | `R-1390: pi-review ends under half the poll after pi exits before the first poll` | red: ~60 s after exit at `--poll 60` (4,854 ms probed at 5) |
| 2 | R-1391 | WHEN pi exits non-zero at once on every attempt, pi-worker shall run all 1 + `--retries` attempts, printing each attempt line, each retry line and the FAILED line but no cpu line, and exit 1 less than half a `--poll` interval after it starts. | `R-1391: pi-worker runs every retry in under half the poll when pi fails at once` | red: 3 x poll (6,048 ms probed at 2) |
| 3 | R-1392 | WHEN pi exits between two polls after the watchdog has printed per-poll cpu lines, the watchdog shall end the attempt less than half a `--poll` interval after pi exits, printing no further cpu line. | `R-1392: an attempt ends under half the poll after pi exits between polls, with no extra cpu line` | red: 3,968 ms after exit at `--poll 4` (limit 2 s) |
| 4 | R-1393 | IF pi is killed by a signal the watchdog did not send, THEN pi-review shall count that attempt as failed, run the next attempt, and after the last failed attempt exit 1 with its review checkout removed and its reservation released. | `R-1393: pi-review retries a pi killed by a signal, then removes its checkout and releases its reservation` | red on POSIX: exit 13, one attempt, checkout and reservation left (probed) |
| 5 | R-1394 | WHILE pi's CPU time stays flat, the watchdog shall kill it as stalled only after `--stall-secs` seconds have passed. | `R-1394: a flat-CPU pi is stalled only after --stall-secs` | guard, green today (STALL at 5,130 ms, poll 1, stall 3); W3 turns it red (1,090 ms, probed) |
| 6 | R-1395 | IF pi is killed by a signal the watchdog did not send during a `pi-worker --lane` run, THEN pi-worker shall exit 1 with its lane lock removed, so the next `--lane` run in that worktree starts pi. | `R-1395: a pi-worker lane whose pi is killed by a signal exits 1 and frees its lane lock for the next run` | red on POSIX: exit 13, lock left, next run refused (probed) |

Every test runs on every platform with no skip. On win32, WE4 and WE6 are green today. This is inferred: a self-kill there
goes through libuv's TerminateProcess with exit code 1, so `exitCode` is set. They still run there as regression guards.
Bounds: `--poll 60` with a 30 s limit (WE1, WE2) and `--poll 4` with a 2 s limit (WE3). Each limit is half the poll,
so a full-poll wait fails and a slow runner has room. WE1 and WE3 time from the fake pi's own exit stamp, not from launch.

**Wrong-code pairs** (seat mutation table):
- W1: no `clearTimeout`, so WE1 goes red (pi-review stays alive until the poll fires). pi-worker hides it because it calls `process.exit`.
- W2: race on `exit` but keep the old `exitCode`/`close` wait, so WE4 and WE6 go red (exit 13).
- W3: `ended` resolves on `spawn` (back-to-back polls), so WE5 goes red (probed: 1,090 ms), and WE2 and WE3 go red too.
- W4: exit listener on attempt 1 only, so WE2 goes red.
- W5: cpu read before the exit check, so WE2 and WE3 go red (an extra cpu line).
- W6: first poll at 200 ms, later polls unchanged, plus a `signalCode` check in the after-loop wait. Only WE3 goes red
  (probed: WE1 340 ms, WE2 656 ms, WE4 exit 1 with two attempts, all pass).

## Known limits
- If pi exits during a CPU read (`ps`, or PowerShell at ~1 s on win32), the end is noticed when that read returns. The extra wait is at most one read, plus at most one extra cpu line.
- Grandchildren that outlive pi are not waited for, as today: stdio goes to a file, so `close` fires together with `exit`.
- Not pinned: the wake on a spawn `error` (POSIX pi missing), and pi-review no longer waiting out its poll timer after SIGINT.
- A pi killed by a signal is now retried. A non-lane pi-worker with `--retries > 0` repeats its mutations, as the README already says for failures.
- The tests are timing-based, with half the poll as the margin.
**Claim most likely wrong:** that pi-review passes on the Windows leg once win-review-paths lands, so WE1 and WE4 can be read there.
HANDOFF puts today's Windows review failures on the short-path bug; I have not measured that on Windows.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1390** — WHEN pi exits 0 with review-shaped output before the watchdog's first poll, pi-review shall write the review to `--out` and exit 0 less than half a `--poll` interval after pi exits.
- **R-1391** — WHEN pi exits non-zero at once on every attempt, pi-worker shall run all 1 + `--retries` attempts, printing each attempt line, each retry line and the FAILED line but no cpu line, and exit 1 less than half a `--poll` interval after it starts.
- **R-1392** — WHEN pi exits between two polls after the watchdog has printed per-poll cpu lines, the watchdog shall end the attempt less than half a `--poll` interval after pi exits, printing no further cpu line.
- **R-1393** — IF pi is killed by a signal the watchdog did not send, THEN pi-review shall count that attempt as failed, run the next attempt, and after the last failed attempt exit 1 with its review checkout removed and its reservation released.
- **R-1394** — WHILE pi's CPU time stays flat, the watchdog shall kill it as stalled only after `--stall-secs` seconds have passed.
- **R-1395** — IF pi is killed by a signal the watchdog did not send during a `pi-worker --lane` run, THEN pi-worker shall exit 1 with its lane lock removed, so the next `--lane` run in that worktree starts pi.
