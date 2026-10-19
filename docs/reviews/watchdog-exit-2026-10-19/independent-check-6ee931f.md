# Independent check — watchdog-exit at 6ee931f (2026-10-19)

VERDICT: HOLDS

Setup: private clone at c99e329 (and main b3f6ec2 for comparison) under `<tmp>/watchdog-exit-check.xx0tBB`. Every probe ran with `env -i`, a temp HOME, a private TMPDIR and a fake pi (`stub/pi` runs `exec node stub/body.cjs`). macOS, node v22.22.2. Nothing was written to the worktree, `~/nana-pi`, `~/.pi` or `~/.claude`. The worktree is still at c99e329; the seat's untracked `seat-mutate.mjs` is still there.

Must-meet and related test files (one `node <file>` per run, temp HOME):
- `watchdog-exit.test.mjs`: R-1390 to R-1395 all PASS, 15.5 s.
- `review-ledger` 155/155 (89.9 s), `worker-lane` 52/52, `win32-launch` 5/5, `immutable-review` 17/17, `requirements-tree` 89/89. All exit 0.

Probes:
A. pi missing from PATH: `pi-worker --poll 30 --retries 1` with `PATH=/usr/bin:/bin`.
   lane: `exit=1 elapsed_ms=68 leftover_capture=0 out=pi spawn failed: spawn pi ENOENT`
   main: `exit=1 elapsed_ms=60070`. Verdict: works; the unpinned wake on a spawn error behaves correctly.
B. An outside `kill -TERM <pi pid>` on each attempt: `pi-worker --poll 30 --retries 1`, fake pi hangs.
   lane: `exit=1 elapsed_ms=2053 runs=2 leftover_capture=0`, then `FAILED after 2 attempt(s)`
   main: `exit=13 elapsed_ms=30070 runs=1 leftover_capture=1` and `Warning: Detected unsettled top-level await`. Verdict: fixed. Main also leaked a capture folder here; the lane does not.
C. SIGINT to pi-worker during a hung attempt, `--poll 30`.
   lane: `exit=130 sigint_to_exit_ms=31 pi_alive=no leftover_capture=0`. Main gives the same. Verdict: signal handling kept.
D. SIGINT to pi-review during a hung attempt, `--poll 60`.
   lane: `exit=130 sigint_to_exit_ms=74 pi_alive=no worktrees=1 reservations=0 capture=0`, then `aborted by SIGINT; reservation released`
   main: same result but `sigint_to_exit_ms=58466`. Verdict: works. The unpinned "no wait for the poll timer after SIGINT" holds.
E1. An outside `kill -KILL` on pi (an OOM-style kill) on both attempts: `pi-review --poll 30 --retries 1`.
   `E1 exit=1 elapsed_ms=3080 runs=2 worktrees=1 reservations=0 capture=0`, then `FAILED after 2 attempts`. Verdict: works.
E2. pi calls `process.abort()` (SIGABRT): `pi-review --poll 30`, default retries.
   `E2 exit=1 elapsed_ms=669 runs=3 worktrees=1 reservations=0 capture=0`, then `FAILED after 3 attempts`. Verdict: works.
F. pi starts a grandchild that writes "LATE-GRANDCHILD" 1 s after pi exits: `pi-worker --poll 3`.
   lane: `exit=0 elapsed_ms=99 out=[VERDICT: LAND|] grandchild_alive=yes`
   main: `exit=0 elapsed_ms=3071 out=[VERDICT: LAND|LATE-GRANDCHILD|] grandchild_alive=yes`. Verdict: a behaviour change; see known bug 1.
G. pi writes 5,000,014 bytes and then exits 0: `pi-review --poll 30 --retries 0`.
   `exit=0 elapsed_ms=703 out_bytes=5000014 expected=5000014 last=VERDICT: LAND`. Verdict: nothing is cut off when the output is read at once.
W. pi stays busy on CPU for 4 s: `pi-worker --poll 1 --stall-secs 2`.
   `exit=0 elapsed_ms=4099 cpu_lines=4 stall=0`. The last line is `cpu=0s flat=0/2`, read while pi was exiting. Verdict: no false stall; the extra line is the documented limit of one.
H. Lane mode `pi-worker --lane hlane --brief ... --poll 30 --max-secs 3`, fake pi hangs.
   `ceiling: exit=1 elapsed_ms=3187 lock_left=no pi_alive=no capture=0`
   Same lane with an outside SIGTERM on pi: `exit=1 lock_left=no` and `FAILED after 1 attempt(s)`
   The next lane run: `exit=0 out=VERDICT: LAND lock_left=no`. Verdict: the time limit, lock release and next run all work.
J. pi exits 0 with output that is not a review: `pi-review --poll 30`.
   `J exit=1 elapsed_ms=866 attempts=3 reservations=0 out=I looked and everything is fine`. Verdict: the acceptance check is unchanged; retries happen at once.
I. A very short poll (`--poll 0.02 --stall-secs 100`), then an outside SIGKILL after 2 s.
   `I exit=1 elapsed_ms=2044 cpu_lines=70 warnings=0`. Verdict: no warnings, no hang.
win32: no code path here can be forced to win32 except `piLaunch` (`win32-launch` 5/5), and this lane does not change it. GitHub run 39250107447 for this branch was still `queued` when checked, so the Windows leg is not verified (see residual 2).

Findings (no MUST):
1. Known bug, low. Output a grandchild writes after pi exits is no longer captured.
   Failure: pi starts a background child that keeps pi's stdout and writes after pi exits (probe F). Main caught that text by chance, if it came before the next poll. The lane reads the output when pi exits and drops it.
   The must-meet known limit says grandchildren are "not waited for, as today". That is slightly wrong: main waited for them up to one poll by accident. Real pi's tools use pipes, not pi's stdout, so I expect this rarely shows up (inferred).
2. Residual, not verified. On win32, WE4 and WE6 are green only by inference: a self-kill there exits with code 1. CI had not run on c99e329 when I checked.

Not caused by this lane: `immutable-review.test.mjs` leaves one empty `pi-review-*` capture folder in TMPDIR. Main does the same (base leftovers=1, lane leftovers=1). It comes from the test's SIGKILL of the launcher.

The claim I'd most expect to be wrong: that the Windows leg passes on this tip. It has not been read.
