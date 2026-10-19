# post-edit-win-pin: a timed-out post-edit check ends its processes on Windows too

Feature: FEAT-030 · Get trustworthy feedback after edits

**Feature sentence.** On every platform, when a post-edit check outlives its timeoutMs, the process its command started and that process's still-running child are both ended. On Windows this goes through `taskkill /T /F`, and when taskkill cannot start, the shell is killed instead. A timeoutMs of 0 arms no deadline. A run whose checks all pass appends nothing to the tool result.

**Class: ordinary.** The lane touches tests, rows, the tree and one README sentence. `extensions/nana-post-edit.ts` does not change. If a new check fails on Windows because of extension code, the builder stops and reports, and the fix becomes a separate hook-class lane (precedent: win-pi-gate, tests only, ordinary). Ladder: one final reviewer. CI's Windows leg is the evidence.

**Threat model.** In scope: honest variation in platform, process start-up time, PATH contents and checker output. On POSIX, sh execs a simple command and the kill goes to the process group; on Windows, cmd.exe never execs and the kill goes through taskkill. Out of scope: deliberate forgery, and a checker that escapes on purpose (a detached descendant stays R-094's residual).

## Today (main 713d6aa, probed on a temp clone, macOS, Node 22)
- R-107, R-097 and R-243 are `untested`. No assertion runs killTree's win32 branch. The hardening file's survivor probe is `pgrep` (POSIX only), so checks (a) and (c) pass on Windows without looking. Five Windows CI logs from 2026-10-19 show 15 pass in 1.6–1.8 s.
- Counts on macOS today: hardening 21 PASS; status 30 PASS and 1 SKIP. On Windows: 15 PASS; 31 PASS and 1 SKIP.
- On macOS, sh execs the checker command. The command's node runs under the shell's pid, and its ppid is the test process (probed). cmd.exe always stays a separate parent.
- R-789's check (a 100 ms checker with timeoutMs 0) stays green when `??` becomes `||` (probed).
- R-243 holds today. Only the path checks look at the returned result.
- After a spawn ENOENT, Node emits `close` with a negative code as well as `error` (probed). So both of killTree's fallbacks fire when taskkill is missing.
- The pack README says the win32 tree-kill branch "has not been exercised on real Windows".

## Design
- Rows R-1700 to R-1703 enter FEAT-030 as `planned`. Retirements:
  - R-107: superseded by R-1700, restated for every platform. R-1701 is new; the fallback was in the code and README but had no row.
  - R-097: superseded by R-1702, and R-243 by R-1703. Both are restated with their subject (precedent R-936 to R-1050).
  - R-1704 to R-1709 stay unused.
- **R-1700** (hardening file, every platform):
  - The checker is `"<process.execPath>" "<tree.cjs>" "<dir>"`. Bare `node` is not used, because a shim would add a level.
  - Level A, the process the command starts, writes its pid and `process.ppid`, then spawns level B (`process.execPath`, `stdio: "inherit"`). B writes its pid.
  - Both levels stay alive on a setInterval and self-exit after FIXTURE_EXIT_MS. timeoutMs is TREE_DEADLINE_MS.
  - Non-vacuity: while the run is pending, the test polls the pid files. It must see both pids alive with `process.kill(pid, 0)` less than TREE_DEADLINE_MS after the fire.
  - After the run settles under `settle`, the test polls until both pids are gone, within POST_KILL_POLL_MS. No pgrep, wmic or PowerShell.
- **R-1701** (hardening file, win32 only; elsewhere one SKIP line with the reason):
  - PATH is set to node's folder alone and restored in `finally`.
  - Precondition: under that PATH, `spawnSync("taskkill", ["/?"]).error?.code === "ENOENT"`. Otherwise the check FAILs and names the cause.
  - The shell pid is level A's ppid. Non-vacuity: it differs from `process.pid` and is alive before the deadline.
  - Pass: the shell is gone after the run settles; the run settles under the watchdog; its result says "did not complete (timed out)"; the file does not crash.
  - Levels A and B survive (a known residual). The test reaps them by pid and waits until they are gone before it removes the folder. On Windows, a busy folder is left to tmpDir's exit cleanup.
- **R-1702** (status file):
  - While one run is pending, `globalThis.setTimeout` is replaced by a recorder that records each delay and calls the real setTimeout. It is restored in `finally`.
  - One check holds both parts. Control: timeoutMs 300 on PASS_CMD records exactly [300]. Case: timeoutMs 0 on the existing 100 ms SLOW_PASS_CMD records no timer and shows `✓ 1 check`.
- **R-1703** (status file): two passing checks, one of which prints to stdout and stderr. The handler returns `undefined`, or content equal to the event's.
- Two new constants carry `chosen:` and the reason:
  - TREE_DEADLINE_MS 2500. The Windows leg runs the file's 8 checker runs in 1.6–1.8 s, so a three-process tree should start well within it (about a 6x margin). On macOS the tree was built in 65–84 ms.
  - POST_KILL_POLL_MS 2000.
- Restate the hardening header's "NOT covered here (darwin)" note and its `@effects` (it sets PATH on Windows). Run `npm run map` if a header changes. Restate the README sentence.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1700 | WHEN a post-edit check outlives its timeoutMs, the pack shall end the process the check's command started and that process's still-running child, on Windows as on macOS and Linux. | `packages/nana-pack/tests/post-edit-hardening.test.mjs::tree: a timed-out check's process and that process's still-running child are both ended` | No: pins main (probed: built in 65–84 ms, settled at 2508–2528 ms, both gone). Wrong code, probed: the POSIX group kill replaced by `direct()` FAILs; after a 4522 ms forced settle, the command's process is gone and its child is alive. The Windows half runs on the seat's mutant CI run. |
| R-1701 | IF the pack cannot start `taskkill` while it ends a post-edit check on Windows, THEN it shall kill the check's shell process instead. | `packages/nana-pack/tests/post-edit-hardening.test.mjs::win32: with taskkill off PATH the timed-out check's shell is killed and the run settles` | No: pins main. Windows only; elsewhere it SKIPs, because macOS and Linux never start taskkill (their failed-kill path is R-094's check f). Wrong code, on the mutant CI run: the error and close fallbacks both made no-ops FAILs (shell alive); the error handler removed crashes the file. The error handler alone made a no-op still PASSes, because close fires too (probed on macOS). |
| R-1702 | WHERE a post-edit command's timeoutMs is 0, the pack shall arm no deadline for that check. | `packages/nana-pack/tests/post-edit-status.test.mjs::timeoutMs 0 arms no deadline and a slow check passes` | No: pins main (probed: control [300], case []). Wrong code, probed with the 100 ms checker: `??` to `\|\|` FAILs ([30000]); `>= 0` FAILs ([0,2000], timeout chip); timedOut guard dropped FAILs (timeout chip). |
| R-1703 | WHEN every post-edit check that ran passes, the pack shall append nothing to the tool result, even when a passing check printed output. | `packages/nana-pack/tests/post-edit-status.test.mjs::an all-pass run whose checks print output appends nothing to the tool result` | No: pins main (probed: undefined). Wrong code, probed: append when a pass printed output FAILs. |

## Verification (seat)
- macOS and Linux: hardening 22 PASS and 1 SKIP; status 32 PASS and 1 SKIP. The trace exits 0 with `ears: 0`.
- Draft pull request, Windows leg: hardening 17 PASS (15 today); status 33 PASS and 1 SKIP (31 today).
- One mutant run from a scratch branch, closed afterwards. In killTree's win32 branch, taskkill runs `/F /PID` without `/T`, and the `error` and `close` handlers are both no-ops. R-1700 and R-1701 must FAIL on Windows.

## Known limits
- The scenario where taskkill starts and exits non-zero (access denied) stays untested. Its close fallback code does run in R-1701, beside the error fallback.
- Abort on Windows shares killTree but has no Windows tree assertion. Checks (a) and (c) keep their POSIX-only probe.
- The fallback leaves the check's own processes running, as R-094's check f does on POSIX.
- Two cases read as alive: a pid reused between the kill and the probe, and a dead process its parent has not reaped. Either gives a false red, never a false green.
- A tree slower than TREE_DEADLINE_MS fails as "tree not built" and never passes. This file is not on parallel-runner's run-alone list.
- The 30 s default timeout is an inline literal in the extension. It is not this lane's change.