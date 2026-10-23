MATERIAL: none

# shared-helpers independent check · tip 77cba752 against main dbb98cbb

Lane class: gate. Threat model: honest variation in platforms, pids, signals and filesystem holds is in scope; deliberate forgery is out.

Setup. Both revisions were extracted with `git archive | tar -x` into `<scratch>/shh-indep/tip` and `<scratch>/shh-indep/main`. Git-initialised copies for the scan and the test runs are in `<scratch>/shh-indep/scan-tip` and `scan-main`. Every run set HOME, USERPROFILE and TMPDIR to folders under `<scratch>/shh-indep`. No model was called; the one real pi run used an offline faux provider. Drivers are in `<scratch>/shh-indep/drivers/` and `<scratch>/shh-indep/pi-run/`. Platform: macOS, node 22.22.2, pi 1.0.2. Windows was not run (see g).

## a. Hung post-edit checker (SIGTERM-ignoring child and grandchild, 1 s limit)

Commands:
- `node --experimental-strip-types drivers/a-postedit.mjs <tree>`: drives the real registered `tool_result` handler. The checker tree is three levels deep and every level ignores SIGTERM. `timeoutMs: 1000`, user-scope config under the temp HOME.
- `drivers/a-postedit.mjs <tree> abort`: the same tree, `timeoutMs: 10000`, with the turn aborted at 600 ms.
- `pi-run/run.sh <tree>`: a real `pi --offline -e faux-turn.mjs -e <tree>/packages/nana-pack/extensions/nana-post-edit.ts --provider shh-faux --model shh-turn --no-session -p go`. The faux model makes one `write` call on the fixture file, and the hanging checker is configured at user scope under the temp HOME.

Expected: the run settles at about deadline plus the 2000 ms kill grace, a timeout is reported to the model, and no checker process is left.

Measured:

| run | tip | main |
|---|---|---|
| handler, deadline | settled 3011 ms; 3 tree processes alive at 700 ms; 0 left 500 ms after | settled 3009 ms; 3 alive; 0 left |
| handler, abort at 600 ms | settled 2605 ms; 0 left | settled 2606 ms; 0 left |
| real pi turn | pi exit 0 in 3.66 s; 3 alive at 1.5 s; 0 left; tool result says "1 check(s) failed … did not complete (timed out)" | exit 0 in 3.51 s; 3 alive; 0 left; same text |

The real pi run also shows that pi 1.0.2 loads the extension with its new relative `../lib/process-tree.mjs` import.

## b. Test runner under SIGINT and SIGTERM

Fixture: `packages/nana-pack/tests/zzshh-hang{1,2}.test.mjs`, written only into the extracted trees. Each prints one PASS, ignores SIGTERM and starts a SIGTERM-ignoring child and grandchild that carry a marker.

Command: `drivers/b-runner.sh <tree> INT|TERM [--jobs=2] zzshh-hang…`. It starts `node scripts/test.mjs`, waits until the tree is up, signals the runner pid, then counts processes with `pgrep -f`.

Expected: exit 130 on SIGINT and 143 on SIGTERM, with no test-file process or descendant left.

Measured, the same on tip and main:
- One file, SIGINT: exit 130, under 1 s; before the signal, 1 file process and 2 tree processes; after it, 0 and 0.
- One file, SIGTERM: exit 143; 0 left.
- `--jobs=2` with two files, SIGINT: exit 130; before, 2 file processes and 4 tree processes; after, 0 and 0.
- `--jobs=2` with two files, SIGTERM: exit 143; 0 left.
- The runner's scratch folder was gone from TMPDIR after each run.
- Timeout path, `NANA_TEST_TIMEOUT_MS=1500`: exit 1, the file reported FAIL, 0 tree processes left, on both.

## c. Install relay (bounded-spawn + bounded-spawn-child) with a hung fake pi tree

The fake pi is `drivers/fakepi.cjs`, three levels. In "stubborn" mode every level ignores SIGTERM, SIGINT and SIGHUP. In "polite" mode the top exits on a signal but its descendants ignore them and hold stdout.

Commands:
- Deadline: `drivers/c-deadline.mjs <tree> stubborn|polite` calls `boundedSpawnSync(node, [fakepi], { timeout: 1500 })`.
- Termination: `drivers/c-term.mjs <tree> SIGTERM|SIGINT|SIGHUP stubborn|polite` starts the relay directly with a spec on stdin, waits for the 3 processes, then signals the relay.
- Parent death: `drivers/c-parent.mjs <tree> stubborn|polite` has a parent process call `boundedSpawnSync` with a 60 s timeout. The driver then SIGKILLs that parent.

Expected: ETIMEDOUT at the deadline with the tree gone; exit 143, 130 or 129 after the 1 s signal grace with the tree gone; on parent death, the relay ends the tree within about poll plus grace.

Measured:

| case | tip | main |
|---|---|---|
| deadline, both modes | 1538–1539 ms, ETIMEDOUT, signal SIGKILL, stdout captured, 0 left | 1541–1542 ms, same, 0 left |
| SIGTERM / SIGINT / SIGHUP, both modes | exit 143 / 130 / 129 after 1005–1006 ms, 0 left | 143 / 130 / 129 after 1004–1010 ms, 0 left |
| parent SIGKILL, both modes | tree and relay gone 1090–1125 ms after | gone 1207–1209 ms after |

## d. Review-text store rename forced to fail

Command: `drivers/d-review.mjs <tree>` builds a temp git repo and a temp home. It runs `mod.admit([...])`, then `mod.complete(admitted.res, outFile, { home, text, rename })` with an injected rename that throws the given code for the first N calls and then does the real `fs.renameSync`.

Expected: one EPERM, EBUSY or EACCES failure leaves the text kept and the round recorded (R-2660). ENOENT is not retried. A lasting transient error stops after 3 attempts.

Measured on tip:

| forced failure | rename calls | gaps (ms) | complete ok | round recorded | text stored | temp left |
|---|---|---|---|---|---|---|
| EPERM ×1 | 2 | 24 | yes | yes | yes | 0 |
| EBUSY ×1 | 2 | 27 | yes | yes | yes | 0 |
| EACCES ×1 | 2 | 28 | yes | yes | yes | 0 |
| EPERM ×2 | 3 | 24, 24 | yes | yes | yes | 0 |
| EBUSY ×3 (lasting) | 3 | 27, 30 | no ("forced EBUSY (output kept at …)") | no | no | 0 |
| ENOENT ×1 | 1 | none | no | no | no | 0 |
| EXDEV ×1 | 1 | none | no | no | no | 0 |
| EBUSY then ENOENT | 2 | 30 | no (stops at the ENOENT) | no | no | 0 |

On main the injected rename ran 0 times in every case, because `complete` ignores `rename`, so main cannot be tested through that seam. That is R-2660's stated red on main.

End to end, with the real rename and no injection: `node <tree>/packages/nana-pack/bin/review-ledger.mjs run --item … --out … -- node -e "console.log('VERDICT: LAND')"`. Both revisions exited 0, recorded round 1 and stored the text under the same sha256.

## e. pi-watchdog kills and pi-review's launch path

Command: `drivers/e-watchdog.mjs <tree> stall|ceiling|signal` calls `runWatchdog` with an injected `launch` that starts the three-level fake pi. Settings: `stallSecs 1`, `pollSecs 0.5`, `retries 0`. The ceiling case uses `maxSecs 2` and a fake whose top level burns CPU. The signal case sends SIGTERM to the driver at 1.5 s.

Expected: each kill ends the whole POSIX group.

Measured:

| mode | tip | main |
|---|---|---|
| stall | 2577 ms, ok false, 3 processes seen, 0 left | 2566 ms, 3 seen, 0 left |
| ceiling | 2005 ms, ceiling true, 0 left | 2007 ms, ceiling true, 0 left |
| SIGTERM | 1505 ms, signal SIGTERM, 0 left | 1505 ms, same, 0 left |

pi-review launch path:
- `git diff dbb98cbb 77cba752` does not touch `pi-review.mjs`, `pi-worker.mjs` or `claude-review.mjs`.
- `pi-watchdog.mjs`'s diff is only the import and the `killGroup` body; `piLaunch` and `runOnce` are unchanged.
- End to end, `pi-review.mjs --poll 1 --stall-secs 1 --retries 0 --item … --out … -- -p x` ran with a fake `pi` shell script on PATH.
  - Verdict stub: exit 0 and "SUCCESS on attempt 1 … round 1" on both revisions.
  - Stall stub that traps INT, TERM and HUP and has a trapping grandchild: exit 1 on both. The grandchild was seen during the run (1) and was gone after it (0), on both.

## f. The tree-kill scan

Command: `node drivers/f-scan.mjs <scan-module-tree> <repo>` calls the exported `scanTreeKillCopies(repo)` on a git-initialised copy.

Expected: no findings on the tip; a planted copy in a mapped production file is named; test files, comment lines and exception files are not.

Measured:
- Tip: 0 findings, 57 ms.
- Tip's scan over main's tree: 14 findings. One is the missing `process-tree.mjs` exception. The other 13 are lines in the six copy files (bench `run.mjs`, `pi-watchdog.mjs`, `nana-post-edit.ts`, `mutation-runner.mjs`, `bounded-spawn-child.mjs`, `scripts/test.mjs`). This matches the plan's red-on-main list.
- Planted copy (`<scratch>/shh-indep/scan-plant`, committed):

| plant | caught |
|---|---|
| `process.kill(-pid, "SIGKILL")` in a new `packages/nana-pack/lib/*.mjs` | yes |
| `spawnSync("taskkill", …)` | yes |
| template `` execSync(`taskkill /T /F /PID …`) `` | yes |
| `spawn('TASKKILL.EXE', …)` | yes |
| `process.kill(-pid, 0)` group liveness probe | yes (a known limit) |
| a CRLF file with no final newline, in `bin/` | yes |
| a `.ts` file under `packages/nana-knowledge/extensions` | yes |
| a file name with a space | yes |
| the same lines in `packages/nana-pack/tests/zz-plant.test.mjs` | no (by design) |
| `//`, `/*` and ` *` comment lines | no (by design) |
| a copy appended to the exception `scripts/runtime-measure.mjs` | no (by design) |
| `` execSync(`cmd /c taskkill …`) `` | **no** |
| `spawn("C:\\Windows\\System32\\taskkill.exe", …)` | **no** |
| `const neg = -pid; process.kill(neg, …)` | **no** |
| `process.kill(0 - pid, …)` | **no** |
| `process.kill (-pid, …)` (space before the parenthesis) | **no** |
| `process["kill"](-pid, …)` | **no** |
| `process.kill(` with `-pid` on the next line | **no** |
| `spawn("powershell", ["-Command", "Stop-Process …"])` | **no** (a known limit) |
| the same copy in a `.cjs` file under a mapped root | **no** (not a module extension) |
| a file named with a non-ASCII character | **no** (git quotes it, so the root check skips it) |
| an untracked file | **no** (git ls-files only) |
| a trailing comment `// calls taskkill /T` (unquoted) | no |
| a trailing comment holding `kill(-pid)` | yes (false positive) |
| a message string `"taskkill failed; see the log"` | yes (false positive) |

## g. Other in-scope risks

- **Missing taskkill on win32, with real Node events.** Command: `drivers/g-win-sim.mjs <tip>`, with platform injected as `win32` and the real `spawn`/`spawnSync`; there is no taskkill on this host.
  - Waiting form: returned false and called the fallback once, with SIGKILL.
  - No-wait form: called the fallback exactly once, with SIGTERM, although Node emits both `error` and `close`.
  - Throwing fallbacks in both forms: no throw and no uncaught exception (0).
  - Off Windows, a pid with no group (ESRCH): fallback once. With a throwing fallback: no throw. With an unknown signal name: the fallback got it and nothing threw.
- **pid guard.** By reading only: main's mutation-runner `killPid` accepted pid 1 and would have sent `process.kill(-1, "SIGKILL")`, signalling every process the user owns. A truncated `running.pid` holding `1` would trigger that. The tip refuses pids below 2 (R-2658). I did not run this on main, because doing so is destructive.
- **Rulings and preamble size.** The shipped rulings file is 3469 bytes, under the 8192-byte `RULINGS_READ_CAP`.
- **Targeted consumer tests**, run in `scan-tip` with `node scripts/test.mjs <substrings>` (not the full suite):
  - process-tree, rename-retry, review-ledger (171 checks), post-edit-hardening, watchdog-exit, pi-launch-limits, project-working-region and bench timeout: 8 of 8 PASS.
  - worker-lane, rulings, test-runner, mutation-runner and post-edit-values-named: 5 of 5 PASS.
  - test-runner-parallel, suite-records, runtime-map and review-standard: PASS.
  - ci-records failed in the archive copy because it has no `origin` remote. Main's copy fails the same way. It passed once a placeholder github.com origin was added.
  - All of `apps/bench/test`, mutation-runner-takeover and watchdog-cpu: 15 PASS, 1 SKIP.
- **Not measured here:**
  - the Windows leg: R-2657's real case, a real taskkill from post-edit, the relay and the mutation runner, and pi-watchdog's direct taskkill replacing its cmd.exe `execSync` (change C2);
  - the Linux leg;
  - the full suite.
- **Cleanup.** No marker process was left after any run (checked with `pgrep`). Every run's HOME and TMPDIR were under the scratch folder. No file under the real pi folder modified since the runs began mentions the runs' markers or provider. The hanging fixture test files exist only in the extracted trees.

## NOTES (non-blocking)

1. The scan misses honest spellings of a tree-kill copy. These are a taskkill reached through `cmd /c` or an absolute `taskkill.exe` path, and a negative pid passed by variable, by arithmetic, with a space before the parenthesis or on a wrapped line, which a formatter can produce. It also misses `.cjs` files and file names git quotes. All of these were measured in f.
   Known-bug text: `FEAT-033: the tree-kill scan misses a taskkill reached through cmd /c or an absolute path, a negative pid passed by variable, arithmetic or a wrapped call line, .cjs files, and file names git ls-files quotes.`
2. The scan flags a production message string that starts with "taskkill", and a trailing comment holding `kill(-`. An unquoted trailing mention of taskkill does not trip it, which is narrower than the must-meet's known-limit wording.
   Known-bug text: `FEAT-033: the tree-kill scan flags a message string starting with "taskkill" and a trailing comment holding kill(-; an unquoted trailing taskkill mention does not trip it, unlike the known-limit wording.`
3. The pack README says the rename helper "retries EPERM, EBUSY and EACCES three times". Measured: three attempts in total, so two retries.
   Known-bug text: `FEAT-033: the pack README says the rename helper retries three times; it makes three attempts, two of them retries.`
4. `killProcessTreeNoWait` attaches the taskkill child's `error` listener with `once`; main's post-edit used `on`. A second `error` event from that child would be unhandled. I infer this is unlikely: nothing kills, messages or aborts that child, and stdio is ignored.
   Known-bug text: `FEAT-033: killProcessTreeNoWait listens for the taskkill child's error with once, so a second error event from it would go unhandled (inferred unlikely).`
5. Positive, not a bug: the tip's pid guard closes main's `kill(-1)` path for a pid file reading `1` (by reading, see g). Also, the bench no longer crashes on a missing taskkill. The win32 simulation in g covers that path in the shared helper, not the bench itself.
