# win-flake-hardening · plan draft (planner, 2026-10-23, main 16c902c2)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Spend line: the owner's 2026-10-23 pick, "harden the Windows CI tests that fail on timing the lanes did not touch". nana-land now refuses a land until the tip's CI run is green, so each such failure costs about 30 minutes of rerun. It also closes FEAT-031's known bug "the runner's cleanup of a file's temp folder and home has no guard", which win-leg-flakes left for "a small lane on the runner".

Stakes: medium blast, reversible. Four test files change, plus two cleanup sites in the runner that every suite run and every land uses. No stored format changes. A revert restores main.

Every claim below is marked measured or inferred. Raw data and scripts: scratchpad `wfh/` (`runs.json`, `jobs.json`, `logs/`, `fails.json`, `classified.json`, `table.md`, `win-failed-legs.txt`; `fetch.mjs`, `extract.mjs`, `classify.mjs`, `table.mjs`; probes in `wfh/probes/`).

## What I measured, and what I corrected

Method (measured): the last 80 `ci.yml` runs, all branches, 2026-10-21 22:54 to 2026-10-23 04:35 UTC. Every attempt of every run: 568 jobs, 54 failed. The logs of all 54 were pulled. FAIL check lines, file summary lines and `      | FAIL` excerpt lines were extracted. A failure counts as a flake when the same commit passed the same leg in another attempt or run. It counts as a lane bug when it failed on two or more legs at once, or when the branch's next commit changed that test file and passed.

Rates (measured):
- Windows suite leg: 93 attempts, 26 failed; 8 of the 26 hold a lane bug, 18 do not.
- Since the four-files-at-once change landed (2026-10-22 16:14 UTC): 42 Windows attempts, 18 failed, 13 with no lane bug (31%).
- Main push runs: 4 of 15 failed on the first try. Main's newest push run (39896736166, at 16c902c2) is red on Windows and was not re-run.

**Correction 1: the worst flake is the runner, not a test.** In 3 Windows legs the runner itself died. It threw EBUSY from its own unguarded `fs.rmSync` of a finished file's temp folder (`scripts/test.mjs:483-484` and `:540-541`). It died after 17, 20 and 21 of 214 files, with no totals line (runs 39889862826 attempt 1, 39875131910 attempt 1 on main, 39876821115 attempt 1). So about 190 files never ran in each. Measured. The held folders were `...\brief-check-*\lane` twice and `...\build-report-test-*\linked` once. Each is the working folder of pi-worker's children. Inferred holder: a child left running after its parent was killed.

**Correction 2: R-1472 never interleaved.** In all four failures the output blocks were whole. Only the overlap precondition failed: one of the two modes saw overlap 1. Measured, from each failure's JSON. R-1470's single failure is the same miss. At `--jobs=2`, file b started 4,316 ms after file a, which the pool started at the same moment (run 39887104509 attempt 1). Measured.

**Correction 3: templates-update is probably a bystander.** Its adopt check failed in exactly the two attempts where R-2023 failed (39897067709 attempt 1, 39889862826 attempt 2). Neither failed in any other of the 93 Windows attempts. Measured. Its failure detail shows normal copier output and a correct rail result, so a step ended non-zero and printed nothing. Measured. R-2023's check SIGKILLs every pid it recorded once it sees one alive (`pi-launch-limits.test.mjs:280`). On Windows a dead pid can be reused at once. Inferred cause: that SIGKILL hit a templates-update child with a reused pid. That one mechanism also explains R-2023's own "a pid set not dead". The two files ran at the same time in both attempts (measured from their end times and durations).

**Correction 4: brief-check's failure is pi-worker's own sampler.** The passing case's pi-worker returned status null at the 15 s limit (both runs, measured). The whole file passes in 0.8 to 4.0 s on 22 Windows legs (measured). pi-watchdog samples CPU with a synchronous `powershell` call every poll, here 0.1 s (`pi-watchdog.mjs:149-158`). brief-check is the first file in the Windows run order that starts a watchdog, so it starts the leg's first PowerShell (measured: no earlier file names PowerShell). A cold PowerShell start takes 6 to 15+ s on a hosted runner (measured by win-leg-flakes). Inferred: that start pushed the worker past 15 s. The killed worker left its PowerShell child holding the lane folder, and the runner then crashed (Correction 1).

The measured table (all failures; details in `wfh/table.md`):

| Test file | Check or row | Count | Runs (run#attempt) | Legs | Kind | Re-run of that run |
|---|---|---|---|---|---|---|
| scripts/test.mjs (runner) | EBUSY on a finished file's temp folder; no totals | 3 | 39889862826#1, 39875131910#1 (main), 39876821115#1 | win | flake (runner) | pass, pass, none |
| test-runner-parallel | R-1472 overlap precondition | 4 | 39889862826#3, 39869394812#1, 39866487964#1, 39817507050#1 | win | flake | pass, pass, none, pass |
| test-runner-parallel | R-1470 freed-slot proof | 1 | 39887104509#1 | win | flake | other fail |
| brief-check | R-2585, passing brief killed at 15 s | 2 | 39889862826#1, 39875131910#1 (main) | win | flake | pass, pass |
| build-report | file crash: taskkill exit 255 unwrapped (`:132`) | 1 | 39897067709#2 | win | flake (real test bug on main) | other fail |
| build-report | file crash: EBUSY on its own folder (`:128` then) | 1 | 39876821115#1 | win | lane bug, fixed by f74582cf | none |
| templates-update | Python adopt update adds 22 untested Part G rows | 2 | 39897067709#1, 39889862826#2 | win | flake, with R-2023 both times | other fail; other fail then pass |
| pi-launch-limits | R-2023 (left out, per the owner) | 2 | the same two | win | flake | as above |
| objective-golden | T2c, "producer failed" | 1 | 39896736166#1 (main) | win | flake | none |
| install-check | hook objective row | 1 | 39840123612#1 (main) | win | flake | pass |
| post-edit-utf8 | Python child output | 2 | 39785202152#1, 39697060728#1 | win | flake, fixed: run-alone since ec1e928e | none |
| review-ledger | file timed out at 300 s | 2 | 39785201330#1, 39761155058#1 | win | fixed by ci-jobs (900 s, run-alone) | pass, none |
| template-acceptance | copier probe during first download | 4 | 39785202152#1, 39778150928#1, 39772777454#1, 39755298929#1 (main) | mac | fixed by ci-jobs R-2577 warm-up | none |
| install-check | pi-subagents install timed out | 4 jobs | 39714947801, 39712602777, 39740755064 | mac, win | network; none since 07:28 UTC 10-22 | n/a |
| review-ledger | two different checks, once each | 2 | 39885180374#1, 39792797841#1 | mac | flake | none |
| mutation-runner | contention check | 1 | 39887104509#2 | win | flake (FEAT-031 known bug) | none |
| path-spelling, hooks-win32-exec | GP4; R-1713 | 1 each | 39890246799#1 | win | unclear | none |
| requirements-deliverables | "not a git repository" | 1 | 39882198923#1 | win | flake | pass |
| writing-injection, runtime-map, doctor-detail | one check each | 1 each | 39712602777, 39721615846, 39882002091 | win, win, mac | flake? | none |
| templates-render, land, ci-records, ci-workflow, runtime-land, worker-lane, claude-review, frontier-summary, build-records | lane bugs | 23 records | see `table.md` | mixed | lane bug | n/a |

The repeaters this lane fixes cover 7 of the 13 unrelated Windows failures since the four-at-once change (inferred effect: 31% falls to about 14%). The R-2023 pair adds 2 more once its kill is fixed (inferred).

Probes on this Mac (measured; outputs in `wfh/probes/*.out`; temp HOME and TMPDIR under the scratch folder):
- P1. R-1472's main fixtures, with fixture 2 delayed 2.5 s before it records its start: overlap 1 in 5 of 5 runs.
- P2. The same with a meeting (each file waits for the other's ready marker): overlap 2 in 5 of 5.
- P3. R-1470 at `--jobs=2` with b delayed 2.5 s: on main's fixtures, c started after a ended in 3 of 3. With a waiting for c's marker, c started before a ended in 3 of 3. At `--jobs=3`: main's fixtures reached overlap 2 in 3 of 3; a three-way meeting reached 3 in 3 of 3.
- P4. The real runner with a preload that throws EBUSY once from `rmSync` of a `nana-test-<pid>-` folder: exit 1, one result line of four, no totals line, an uncaught stack. Same at `--jobs=1` and `--jobs=2`.
- B1. brief-check's passing worker run with a fake pi that lives 0.5 s and a `ps` shim first on PATH that sleeps 40 s, on main's `--poll 0.1` and 15 s limit: the shim ran, and pi-worker returned 143 after 40.7 s. The limit's SIGTERM waited for the synchronous sampler.
- B2. The same with `--poll 60` and a 30 s limit: status 0 in 949 ms; the shim never ran.
- B3. Main's settings, no shim: status 0 in 1,068 ms.
- Baseline at main: brief-check (2 pass, 1 s), build-report (2 pass, 3 s) and test-runner-parallel (8 pass, 28 s) all pass on this Mac.

## Design

One part per flake. Each part keeps what its test proves and removes the timing it hoped for.

1. **Runner: guard a finished file's cleanup (Correction 1).** Both sites (`scripts/test.mjs:483-484` serial, `:540-541` pool) remove the home and the temp folder with `maxRetries` and `retryDelay` from two new names in `test-runner-config.mjs`. A removal that still throws prints one line after the totals, in the existing WARN form: `WARN <file>: temp folder not removed: <path> (<code>)`. The file keeps its verdict and the run goes on. The folder stays in the exit cleanup's set, so `cleanup()` tries once more, silently. Subtraction test: without the guard, one held folder ends the whole leg (P4), so it stays. Without the retries, every short antivirus hold becomes a WARN; two options on an existing call cost nothing, so they stay.
2. **build-report: a kill that tolerates a gone tree (`:132`).** Replace the unwrapped `execFileSync("taskkill", …)` with the non-throwing form the repository already uses: `spawnSync` with `stdio: "ignore"`, inside `try`, as `watchdog-cpu.test.mjs:46-51` and `mutation-runner.mjs:213-219` do. Off Windows, `hardChild.kill("SIGKILL")` stays. The proof that the tree ended stays where it is: `waitForPidExit(fakePiPid)` (`:139`). If shared-helpers lands first, import its shared tree kill instead (its ruling R-2663). Subtraction test: a one-call change; nothing smaller removes the crash.
3. **R-1472: a meeting instead of a hope.** Each of the two fixture files writes `<name>.ready` into `PROBE_OUT`, then waits until its partner's marker exists or `RENDEZVOUS_LIMIT_MS` passes. Only then does it print its tagged lines. Fixture 2 sleeps `START_SKEW_MS` before it records its start, in both modes. That sleep is the injected slow schedule, and it runs every time: main's fixtures fail it 5 of 5 (P1). The check also requires each file's record to say it saw its partner. A runner that ignored `--jobs` still fails: the first file waits out the limit alone. Subtraction test: the skew is what makes a regression fail every run instead of one run in five; the meeting is what makes overlap certain. Both stay.
4. **R-1470: the same meeting.** At `--jobs=2`, a waits for c's marker instead of sleeping 3 s; b carries the skew. At `--jobs=3`, a separate root has a, b and c each wait for all three markers. A batching pool still fails: a waits out the limit, then c starts after a ends. Subtraction test: R-1470 failed once on the same cause, its fixture file is the same, and the helper is shared, so folding it in costs a few lines.
5. **brief-check: take the sampler off the test's path.** `runWorker` passes `--poll` at `WORKER_POLL_SECS`, above the child limit. The watchdog's exit race (`pi-watchdog.mjs:217-228`) then ends the attempt when the fake pi exits, before any sample. The child limit becomes a named 30 s. Both fakes hold `FAKE_PI_HOLD_MS`, so main's 0.1 s poll always samples once. A shim named `ps` (POSIX) or `powershell.cmd` (win32) sits first on PATH, records a marker and sleeps `SLOW_SAMPLER_MS`. That shim is the injected slow schedule: main's settings fail it every run (B1). Subtraction test: the poll removes the slow part; the 30 s limit covers the rest of an unmeasured cold start (two node starts, the trust child, git); the shim is the only thing that makes the old code fail every run. All three stay.
6. **templates-update: no change.** Its inferred cause is outside the file. Any guard inside it would mask a kill from another process. The fix belongs to R-2023's cleanup (Open question 2).

Dropped:
- Adding R-1472 to the run-alone list, as FEAT-031's known-bug line says. Running alone would add the file's 30 to 45 s per leg (measured on Windows). It would not remove the start skew of the file's own two children (4,316 ms inside one file's run, measured). The failure is a missed precondition, not a load-sensitive bound.
- Adding brief-check to the run-alone list. A cold PowerShell is slow alone too, and the slow part is the file's own sampler.
- Adding templates-update to the run-alone list. It takes about 250 s on Windows, so alone it would cost 4 minutes per leg. A pid-reuse kill can still reach any other file.
- Applying the meeting to R-1471 and R-1473. Neither failed in 93 Windows attempts (Known limits).

## Class

Ordinary. The lane changes `scripts/test.mjs`, `test-runner-config.mjs`, four test files, one README paragraph and rows. It changes no nana-setup install, uninstall or doctor, no Claude Code hook, no pi extension, no gate policy, and none of nana-land, pi-review, claude-review or review-round. Precedent: suite-records (2026-10-22) changed the runner as ordinary. The claim I expect to be read differently: parallel-runner (2026-10-19) classed a runner edit as gate, because every nana-land runs the suite. If the seat follows that, the class is gate: add the land reviewer and one independent check.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- a hosted Windows runner under four files at once, or a cold first PowerShell start of 6 to 15+ s;
- a child process that starts seconds late (4,316 ms measured);
- Windows 8.3 temp paths (`RUNNER~1`) and the long form for one folder;
- an antivirus or a just-exited child holding a folder for a moment;
- a test that leaks a grandchild that holds its temp folder;
- a dead pid that Windows reuses at once;
- taskkill exiting non-zero because part of a tree already ended.

Deliberate forgery is out:
- a fixture that writes its partner's ready marker itself;
- a test that holds a folder on purpose to earn a WARN;
- a hand-edited retry value or run-alone list;
- a preload that fakes PASS lines.

A finding outside the model is a residual. The public repo carries no owner name and nothing about the owner's work.

## Precedent

Precedent:
- docs/reviews/win-leg-flakes-2026-10-21/must-meet.md — one verdict per flake, rows written as test-reliability properties, tunables with provenance, an injected slow schedule that fails main's code every run.
- docs/reviews/ci-jobs-2026-10-22/must-meet.md — the run-alone amendment pattern, and its rule that a load-sensitive bound joins the list instead of being loosened.
- docs/known-bugs/FEAT-031.md — the R-1472 run-alone line and the runner-cleanup line this lane closes.
- docs/known-bugs/FEAT-006.md — the brief-check line (main CI, 2026-10-22) this lane closes; it already names the inline limits.
- scripts/test.mjs — `cleanup()` (`:135-149`), the serial site (`:483-485`), the pool site (`:540-542`), the existing `WARN <file>:` form (`:476`, `:569`, `:592`).
- packages/nana-pack/lib/test-runner-config.mjs — home of the runner's tunables, beside `RUN_ALONE`.
- packages/nana-pack/tests/test-runner.test.mjs — `mkRoot`, `run`, the totals regex (`:96`), the WARN check (`:249`), and `runForced` (`:671`), which preloads a module into the runner only.
- packages/nana-pack/tests/review-test-waits.test.mjs — R-1922: a preload whose `rmSync` throws EBUSY (`:71-99`), and a named line instead of an uncaught exception (`:144-153`).
- packages/nana-pack/tests/test-runner-parallel.test.mjs — `mkRoot`, `run`, `maxOverlap`, `recordTiming`, `sleepRecordFixture`, and the R-1470 and R-1472 checks this lane changes.
- packages/nana-pack/tests/build-report.test.mjs — the hard-kill case (`:104-146`) and its retried folder removal (`:27-29`, `:148-152`).
- packages/nana-pack/tests/watchdog-cpu.test.mjs — a test's tree kill that cannot throw (`:46-51`).
- packages/nana-pack/lib/mutation-runner.mjs — `killPid` (`:213-219`), the same form in product code.
- packages/nana-pack/tests/brief-check.test.mjs — the fixture, the stub folder first on PATH, `runWorker` and `runCheck`.
- packages/nana-pack/tests/fake-pi.mjs — the win32 fake pi layout.
- packages/nana-pack/tests/build-records.test.mjs — `CASE_LIMIT_MS = 30_000` (`:44`) for pi-worker runs in a test.
- packages/nana-pack/bin/pi-watchdog.mjs — read only: `cpuSeconds` (`:149-158`) and the exit race (`:215-247`).

Departures, each named:
- R-1472 does not join the run-alone list, though FEAT-031's line says it would (Design, Dropped).
- brief-check's 15 s limit rises to 30 s, though the run-alone rule says a bound is never loosened. The 15 s is a hang guard, not what R-2585 checks.
- The runner's busy folder is a WARN, where R-1922's test cleanup is a FAIL. R-1922 is a test's own result; this line is housekeeping after a verdict (Open question 1).
- The slow schedules live inside each test file, not in a separate meta-test file as in win-leg-flakes. They are fixture-level and cost about 3 s.

## Must-meet rows (FEAT-031)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2666 | IF the test runner cannot remove a finished file's temporary folder or home after its sealed retries, THEN it shall print one WARN line naming that file, the folder and the error code, keep that file's verdict, and run every remaining file and print its totals, in a serial and in a parallel run. | `packages/nana-pack/tests/test-runner.test.mjs::R-2666: a finished file whose temp folder stays busy gets one WARN line naming the file, the folder and the code, keeps its verdict, and every other file still runs, serial and parallel` |
| R-2667 | WHEN the build-report test's hard-kill case kills a worker tree that has already ended in part or in whole, the test shall go on to report R-2601's verdict with no uncaught exception. | `packages/nana-pack/tests/build-report.test.mjs::R-2667: the hard-kill step's tree kill returns without throwing when the tree it kills has already ended` |
| R-2668 | WHEN one of the two files R-1472's check runs at once starts START_SKEW_MS after the other, that check shall still observe both files running at the same time, in verbose and in plain mode. | `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2668: R-1472's two files still run at the same time when one starts 2.5 seconds late, in verbose and plain mode` |
| R-2669 | WHEN one file in R-1470's check starts START_SKEW_MS late, that check shall still observe, at two jobs, the third collected file starting while the first still runs, and at three jobs, three files running at once. | `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2669: R-1470's pool checks hold when one file starts 2.5 seconds late, at two and three jobs` |
| R-2670 | WHILE a CPU sampler first on PATH takes longer than the R-2585 check's per-child limit, the R-2585 check shall still compare brief-check with pi-worker for every brief, and that sampler shall not run. | `packages/nana-pack/tests/brief-check.test.mjs::R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs` |

Seal tests (one per new sealed tunable set; they compare imported names with literals):
- `packages/nana-pack/tests/test-runner.test.mjs::seal: a finished file's temp folder removal retries 5 times on a 100 ms step` names R-2666.
- `packages/nana-pack/tests/brief-check.test.mjs::seal: R-2585's children have a 30-second limit and the worker polls less often than that` names R-2670.

R-2671 to R-2675 stay free. Rows go in FEAT-031's table directly after R-2486, each `untested` first, then `implemented` with backticked `file::title` evidence when its check passes. Add no heading. R-1470, R-1472 and R-2585 keep their text and titles.

### What each test does, and why it is red on main

- **R-2666.** Follow `runForced`: a preload passed with `--import`, so only the runner sees it. It wraps `fs.rmSync` and throws EBUSY, with `error.path` set, for every call whose target's basename starts with `nana-test-` and whose path holds the first fixture file's temp folder. Read the real removal call to find that folder; the preload can learn it from the env the runner gives the file, recorded by the fixture into `PROBE_OUT`. Four fixture files, the first passing and the second red. Run serial and `--jobs=2`. Assert, in both runs: the totals line matches the existing regex; all four files have a result line; the first file is PASS and the second FAIL; exactly one line starts `WARN <first file>: temp folder not removed:`, holds the folder the fixture recorded and `EBUSY`; the exit code is 1, from the red file alone. A third run with only passing files and the same preload exits 0. No stack line appears. Red on main: P4, the runner dies after one result line.
- **R-2667.** Move the hard-kill step's kill into a small local function. The check starts a child of the same kind (node, `-e` that exits at once), waits for its `exit`, then calls the function on that pid. Assert it returns and throws nothing, and that R-2601's line printed after it. Red on main on the Windows leg: `execFileSync("taskkill", …)` on a pid that has ended exits non-zero and throws. Exit 128 for a missing pid is inferred from taskkill's documented codes; exit 255 was measured once (run 39897067709 attempt 2). Off Windows, main's `hardChild.kill` never throws, so main is green there; wrong-code pair 6 covers that platform.
- **R-2668.** The R-1472 roots as Design part 3. Fixture 2 records `{ start, end, delayedMs, sawPartner }`, and fixture 1 records `{ start, end, sawPartner }`. Assert in both modes: `delayedMs >= START_SKEW_MS`; both `sawPartner` true; `maxOverlap === 2`. R-1472's own check keeps its sequence and exit-code assertions and reads the same runs. Red on main: P1, overlap 1 in 5 of 5.
- **R-2669.** The R-1470 roots as Design part 4. At two jobs assert `c.start < a.end`, `maxOverlap === 2` and a's `sawPartner`. At three jobs assert `maxOverlap === 3` and all three `sawPartner`. b's `delayedMs >= START_SKEW_MS` in both. R-1470's own check reads these runs. Red on main: P3, 3 of 3.
- **R-2670.** The stub folder gains the slow shim, first on PATH for both commands. Before the cases, resolve the sampler command the way the watchdog's shell will: `command -v ps` under `/bin/sh` with the test env, or `where powershell` with it on win32. Assert the first hit is the shim. The fakes record their own hold. Assert R-2585's observations are all ok, the passing brief's worker status is 0, the fake's hold is at least `FAKE_PI_HOLD_MS`, and no sampler marker exists. Afterwards, kill any shim process the marker file names. Red on main: B1, the sampler runs and the worker ends 143 off Windows, or null at the limit on Windows (as in runs 39889862826 and 39875131910).

Existing tests the change touches (listed edits, not new tests):
- test-runner-parallel's R-1470 and R-1472 checks read the new fixtures' runs; their titles stay.
- brief-check's R-2585 check runs with the new poll, limit and shim; its title stays.
- build-report's R-2601 check runs after the moved kill; its title stays.

## Tunables

| Name | Value | Where | Provenance |
|---|---|---|---|
| `TEMP_REMOVE_RETRIES` | 5 | `packages/nana-pack/lib/test-runner-config.mjs` | chosen 2026-10-23 (R-2666): build-report's `TEMP_REMOVE_MAX_RETRIES`; Node's linear backoff gives about 1.5 s in all. No Windows hold was measured. Sealed. |
| `TEMP_REMOVE_RETRY_DELAY_MS` | 100 | same | chosen 2026-10-23 (R-2666): build-report's `TEMP_REMOVE_RETRY_DELAY_MS`. Sealed. |
| `START_SKEW_MS` | 2_500 | `packages/nana-pack/tests/test-runner-parallel.test.mjs` | chosen 2026-10-23 (R-2668, R-2669): above R-1470's 2,000 ms gap between a's and b's sleeps and R-1472's 1,000 ms print time, so main's fixtures lose their overlap every run (P1, P3). Fixture constant, not sealed. |
| `RENDEZVOUS_LIMIT_MS` | 30_000 | same | chosen 2026-10-23: about 7 times the worst measured start skew, 4,316 ms (run 39887104509 attempt 1). A runner that ignored `--jobs` then ends each R-1472 root in about 31 s, under `run()`'s 120 s limit. Not sealed. |
| `CHILD_LIMIT_MS` | 30_000 | `packages/nana-pack/tests/brief-check.test.mjs` | measured 2026-10-23 (R-2670): 22 passing Windows legs ran the whole file in 0.8 to 4.0 s; 30 s is 7.5 times that. Seven children at 30 s stay under the 300 s per-file land limit. It matches build-records' `CASE_LIMIT_MS`. Sealed. |
| `WORKER_POLL_SECS` | 60 | same | chosen 2026-10-23 (R-2670): twice `CHILD_LIMIT_MS`, so no sample can start before the limit (B2). Sealed as a relation. |
| `FAKE_PI_HOLD_MS` | 1_000 | same | chosen 2026-10-23: ten times main's 0.1 s poll, so main's code always samples once (B1; without a hold the POSIX fake exits before the first poll, B3). Not sealed. |
| `SLOW_SAMPLER_MS` | 60_000 | same | chosen 2026-10-23: twice `CHILD_LIMIT_MS`, above the limit as a cold PowerShell start is (6 to 15+ s, measured by win-leg-flakes). Not sealed. |

Module headers to update: `scripts/test.mjs` (`@outputs` names the busy-folder WARN line; `@effects` says a removal is retried), `test-runner-config.mjs` (`@outputs`). The four test files keep their six-tag headers; update their `@effects` where a shim or preload is added.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

1. Main's unguarded `rmSync` at both sites → R-2666 (P4: runner dies).
2. A guard that swallows the error and prints nothing → R-2666.
3. The guard on the pool site only → R-2666's serial run.
4. The busy folder counted as a FAIL, or the exit code raised by it → R-2666's all-pass run.
5. Main's `execFileSync("taskkill", …)` → R-2667 on the Windows leg only. The seat runs it on a scratch branch's CI.
6. Off Windows, `process.kill(-pid, "SIGKILL")` with no `try` → R-2667 (ESRCH on an ended group).
7. Main's R-1472 fixtures with the skew kept → R-2668 and R-1472 (P1).
8. Only the late file waits for its partner → R-2668.
9. The skew removed → R-2668's `delayedMs` assertion.
10. Main's R-1470 sleep fixtures with the skew kept → R-2669 and R-1470 (P3).
11. The three-way meeting dropped at three jobs → R-2669 (overlap 2).
12. A batching pool in the copied runner (start two, wait for both) → R-1470 and R-2669, now every run.
13. Main's `--poll 0.1` with the shim → R-2670 and R-2585 (B1).
14. The shim placed after the stub folder, or not written → R-2670's resolution assertion.
15. `FAKE_PI_HOLD_MS` dropped from the fakes → R-2670's hold assertion.
16. `CHILD_LIMIT_MS` back at 15 s, or the retry values changed → the seals.

## Windows notes

- On Windows a live process's working folder and open handles block `rmdir` with EBUSY. On macOS and Linux they do not, so a real hold reproduces only on Windows. R-2666's preload makes the test run the same everywhere.
- `spawnSync`'s time limit ends only the direct child on Windows. The worker's sampler and the fake pi keep running in the lane folder (inferred from the crash paths). Off Windows, pi-worker traps the SIGTERM and exits 143 once the sampler returns (B1).
- taskkill's exit codes: 0 when all ended, 128 when the pid is missing (documented, not probed here), 255 measured once. 255 likely means a tree member ended mid-kill (inferred).
- The watchdog's sampler runs through cmd.exe. cmd.exe takes the first PATH folder holding any PATHEXT match, so `powershell.cmd` in the stub folder should win (inferred). R-2670's resolution assertion checks it on the Windows leg and fails loudly if not.
- The WARN line prints the runner's own path string, the `RUNNER~1` form on CI. R-2666 compares it with the path the fixture recorded, not with a resolved long path.
- The win32 fake pi is node (`fake-pi.mjs`), which already outlives a 0.1 s poll. The hold makes the POSIX fake match it.
- Pair 5 is red only on the Windows leg. The shared mutation runner has judged no pair on Windows (FEAT-031 known bug), so the seat uses a scratch branch's CI.

## Known limits (the seat writes them to FEAT-031's known-bug file before the final round)

- R-1471's and R-1473's overlap preconditions keep their timing (500 against 1,200 ms; 600 against 2,000 ms). Neither failed in 93 Windows attempts.
- worker-lane and build-records keep `--poll 0.1`; worker-lane keeps its 15 s limit over about 55 worker runs. Neither failed on timing in 93 Windows attempts. The same slow-sampler exposure applies.
- pi-watchdog's synchronous sampler blocks its own signal handling while it runs: a SIGTERM at 15 s was handled at 40.7 s (B1, measured). The 8-hour ceiling and Ctrl-C wait on a slow PowerShell too. This is a FEAT-006 product bug. pi-watchdog is pi-review's liveness module, so its fix is a gate lane.
- A WARN keeps a leaking test green. Its leaked process can still disturb later files.
- The retry values are chosen, not measured on a Windows hold.
- templates-update's adopt failure is not fixed; its cause is inferred (Correction 3).
- The Claude Code objective hook's producer limit is 1,500 ms (`hook-producer.mjs:18`). It failed twice on main's Windows runs: install-check (run 39840123612) and objective-golden T2c (run 39896736166, "producer failed"). That fix is a hook lane.
- The pi-subagents install timed out in 4 install-check jobs on 2026-10-22 between 02:39 and 07:28 UTC, and not since. Network, inferred.
- CI re-runs cannot prove the rate fell. The proof is the injected schedules and their wrong-code pairs.

## Not verified

- Why brief-check's worker passed 15 s on CI. The sampler is inferred; the run order is measured.
- What taskkill's exit 255 means.
- The link between templates-update and R-2023's cleanup kill.
- That Node's `rmSync` retries cover a real Windows antivirus hold.
- That cmd.exe resolves `powershell.cmd` from the stub folder.
- Any of the five parts on Windows. Every probe ran on this Mac.

## Docs that change

- `README.md`, the `npm test` paragraph: one sentence that the runner retries removing a finished file's temp folder and home, and prints a WARN line naming the file, the folder and the error when it cannot, then goes on.
- `REQUIREMENTS.md`: R-2666 to R-2670 in FEAT-031 after R-2486.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated.
- Seat notes, in the reviewed change before the final round:
  - FEAT-031: replace "If it fails again it joins the run-alone list" with this lane's fix; close "the runner's cleanup of a file's temp folder and home has no guard"; add the Known limits.
  - FEAT-006: close the line "brief-check (main CI, 2026-10-22): … R-2585's passing case once outlived its 15-second limit …"; add the watchdog sampler that blocks signal handling.
  - HANDOFF Landed line and the session entry.
- Unchanged: nana-setup, every hook and extension, pi-worker, pi-watchdog, pi-launch-limits and R-2023, templates-update, `RUN_ALONE`.

## Seat steps

1. Cut `feat/win-flake-hardening` from main. It shares no file with claude-code-builder-parity. shared-helpers also edits `scripts/test.mjs` and test-runner's `mkRoot`; whichever lands second merges main.
2. Run one adversary pass on this draft. Commit the must-meet of record and build brief 1. The brief carries `Feature: FEAT-031 · Run checks reliably and without contaminating work` and a Precedent section. Run `brief-check.mjs` on it.
3. Build with the small builder: `pi-worker --lane win-flake-hardening --brief … --out … --lane-size small`.
4. Seat checks on the build tip:
   - the touched files: test-runner, test-runner-parallel, brief-check and build-report;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review brief and the land.
5. Run pairs 1 to 4 and 6 to 16 through the mutation runner. Run pair 5 on a scratch branch's CI.
6. Push a draft PR. The Windows suite leg runs three times: the push, then two re-runs. Report every first-try failure with its file.
7. Write the notes before the final round.
8. Run one final reviewer of a different lineage from the builder, on the exact tip.

## Open questions to the owner

1. **A busy temp folder: WARN or FAIL?** WARN keeps the leg green and names the folder. FAIL also costs a re-run but reports the leak as a failure. Today the runner dies, which is worse than either. Default: **warn**.
2. **R-2023's cleanup kill.** Its check SIGKILLs every recorded pid once one looks alive. A reused pid can belong to another test's child; this is the inferred cause of the two templates-update failures. shared-helpers rewrites the relay's kill, not this test-side kill. Default: **a one-row follow-up after shared-helpers lands**.
3. **The objective hook's 1,500 ms producer limit.** It failed twice on main's Windows runs. It is a hook lane: land reviewer and one independent check. Default: **next hook lane**.
4. **Main's newest push run is red** (39896736166, objective-golden T2c on Windows). It was not re-run, so release did not run at 16c902c2 (inferred). Default: **re-run it**.
