# launch-limits-identity · must-meet of record (seat, 2026-10-25)

Feature: FEAT-013 · Install and connect harness runtimes

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 2 MUST, 5 SHOULD, 7 NOTE). The seat took the adversary's simpler design (its item 3): judge each run at once with the existing bare-pid probe and send no failure-path kill. That drops the draft's beat files, `BEAT_MS`, `QUIET_MS`, the stop request and the reader injection, so the adversary's item 1 (reader injection) and item 4 (stop request) are moot. The seat took item 2 (a row pins "judged at once", here R-2891), items 5, 6 and 7, and notes 8 to 14. Plans get no review round. Where this file and the draft or the attack differ, this file holds.

The owner's decision, 2026-10-25: "Plan the Windows fix lane after the research". This is planning only; the build waits for the owner's go and a free building slot.

Spend line: HANDOFF Next item "Windows first-try failures". Each Windows first-try failure costs about 15 minutes of re-runs per land and holds that land. R-2023 failed six times since 2026-10-22, three after the hardening land; R-2300 failed once.

Stakes: low blast, reversible. One test file changes, plus ledger rows and regenerated docs. No product file changes; a revert restores main.

Threat model: honest variation is in scope: runner speed and load, process start time, timer delay, antivirus holds and Windows pid reuse within seconds. Deliberate forgery is out, such as a process writing a hand-made pid record or a record naming another fixture's pid on purpose. A finding outside this model is a residual.

Main at plan time: 61671be0. Every path:line below was opened at that commit.

## Root cause (research, critic and adversary; inferred, medium confidence)

- R-2023 runs four timed-out launches, then judges all four (`pi-launch-limits.test.mjs:276-282`). Run 1 is judged about 12 s after its processes end, run 2 about 8 s, run 3 about 4 s, run 4 at once.
- The judge calls a pid alive through `process.kill(pid, 0)` (`:54-61`) and re-probes every pid at the end of its wait (`:72-76`). Windows reuses pids quickly, so a stranger can hold a recorded pid by then.
- On failure it sends SIGKILL to every recorded pid (`:280`), which can hit a neighbour process. Five more failure paths do the same (`:187`, `:204`, `:423-425`, `:445`, `:483`).
- Across 127 Windows attempts that ran R-2023 (the adversary's count from the research logs), misreads by run were 3, 2, 0 and 0. So 0 of 254 judgements made within about 4 s of a run's end misread.
- One failure recorded no process at all in run 1 (CI 40160292637/1): pi's own Node process did not write its record inside the 3 s limit.
- R-2300 saw pi and the relay but no child inside its 2 s start wait (CI 39907491406/1, `:180` through `waitFor`'s default `PID_POLL_MS`, `:36`).

## Design table (on record)

| Design | Identity | How it misreads | Measured | Cost |
|---|---|---|---|---|
| **Bare-pid probe, judged at once (chosen)** | `kill(pid, 0)`; only ESRCH reads gone | A pid reused before the first probe reads alive. That fails closed: a flake, never a pass over a leak. | 0 of 254 judgements made within about 4 s of a run's end misread (runs 3 and 4 of 127 attempts); runs 1 and 2, judged 12 s and 8 s late, misread 3 and 2 times | No new protocol. R-2023 grows about 12 s from the allowance |
| Beat files, 2 s quiet window (draft) | A per-process file that grows every 100 ms | A live fixture starved for a whole quiet window reads ended. That is a pass over a leak, and the macOS product pair cannot test it on Windows. | Not measured | `BEAT_MS`, `QUIET_MS`, stop request, reader injection, about 8 s of quiet windows |
| Command-line lookup (research) | PowerShell or `ps` | Fail open reads every pid as not ours (the critic's rescue risk); fail closed turns a cold PowerShell into a new flake | Not measured | 1 to 10 s per cold PowerShell; rejected by the critic |

## Seat decisions

- **Bare-pid judge, at once.** R-2023 calls the judge right after each run returns, not after all four. The judge probes with the existing bare-pid probe; it sends no signal.
- **No failure-path kill anywhere in the file.** The six loops that SIGKILL recorded pids go. A leaked hang fixture ends itself at `HANG_MS` (`:94`). R-2303's wrapper cleanup (`:484`) becomes `child.kill("SIGKILL")` on the test's own handle, which sends nothing after exit.
- **Judged too late reads not ended (R-2891).** Each hang-body record gains `at: Date.now()`, written in the same line before the self-exit timer is armed. A run's deadline is its earliest record `at` plus `HANG_MS` less `SELF_EXIT_MARGIN_MS`. A first probe at or after the deadline reports "judged too late"; a gone read counts only from a probe that started before it; the wait stops at the deadline. So a fixture's own exit can never pass as an end.
- **Fail closed (R-2892, note 13).** One probe function returns alive, gone (ESRCH only) or the error code. Any other code reads not ended and is named. A record without a positive integer `pid` and `ppid`, or without a numeric `at`, reads not ended and is named; nothing is filtered out silently. `processAlive` becomes "probe is not gone", so the timed checks fail closed too. The probe takes an injected `kill` (default `process.kill`), as `pidAlive` does, so the real probe's error path runs in the test.
- **A pid read gone stays ended** within one judgement and is not probed again. A gone read proves that fixture process ended; this shrinks the reuse window. Unpinned (Known limits).
- **The judge reports what it saw (note 14).** Each run's detail names every pid with its record's args, its `at` offset from the run's start, its first and last probe results, the run's return and judge times, and the reason. When any run reads not ended, R-2023 then waits, synchronously, until the latest such record's `at` plus `HANG_MS` plus `SELF_EXIT_MARGIN_MS` and probes each pid still alive once more, recording "after self-exit: gone" or "alive". Gone after self-exit points to a fixture leak; alive points to another process holding the pid. This probe is a diagnostic only; it never changes the verdict.
- **Synchronous judge (note 9).** The judge waits with `sleepSync`, as `waitDeadSync` does (`:72-76`), so R-2023 stays one synchronous case that the 15 s case limit cannot cut (`:35`, `:508-513`).
- **R-2023 keeps its started rule:** at least three distinct pids from pid and ppid (shim, pi, pi's child). The shim's deadline uses pi's record, since the shim ends when pi ends.
- **One sealed start allowance, apart from R-2484.** `START_ALLOWANCE_MS = 6_000` is R-2023's launch limit for its four runs and the start wait in `observeParentKill` and R-2303, through one helper. `PARENT_KILL_BOUND_MS` and R-2484's seal stay as they are. R-2023 asserts each run's row detail names `START_ALLOWANCE_MS / 1_000` seconds and "stopped" (formats: `steps.mjs:1130` for `--version`, `:1136` for install, `doctor.mjs:368` for doctor).
- **The start wait's use is checked (R-2895, item 7).** The hang body gains a chosen `CHILD_DELAY_MS` environment name that delays pi's child. A POSIX case starts pi's child `LATE_CHILD_MS` after pi, between the default poll and the allowance, and requires `observeParentKill` to count the launch started.
- **The source scan covers every signal route (R-2893, item 6).** Row and test agree: every call to a function named `kill`, every tree-kill import and every kill command.
- **Kept unchanged:** `LIMIT_MS` for R-2020 to R-2022; `HANG_MS`; `HANG_STOP_MARGIN_MS`; `PARENT_KILL_BOUND_MS`; every `RELAY_*` value; R-2484's seal; the signal-cleanup body's two 60 s holds (`:135`); the 2 s start wait in R-2026, R-2027 and R-2133.
- **No new module.** The judge and probe stay in the test file; they have one caller. The header's `@outputs` names twenty-four checks; the code map entry is regenerated.

### What the lane does NOT do

- No product change: no relay, `bounded-spawn`, `steps.mjs`, `doctor.mjs` or `process-tree` edit.
- No PowerShell or `ps` lookup; `windowsLaneWatchers` stays as it is.
- No beat files, stop request or quiet window.
- No loosening of R-2484, the parent-kill bound, `HANG_MS`, the hang-stop margin or any product bound.
- No change to the bystander files: templates-update, project-stale, project.
- No run-alone list, job count or time-scale change.
- None of the research's other clusters (R-2546, R-1960, R-1242, R-2619, R-1701, R-2671, adoption reader, sources-file, GP4).

## Must-meet rows (FEAT-013; test file `packages/nana-setup/tests/pi-launch-limits.test.mjs`)

Six rows, R-2890 to R-2895, each `untested` then `implemented`. R-2896 and R-2897 stay free.

- **R-2890.** WHEN the launch-limit judge finds a recorded pid still alive when its wait ends, it shall report that run not ended, name that pid with its probe result, and signal no process.
  - Test: `R-2890: a recorded pid still alive when the judge's wait ends makes the run read not ended, is named with its probe result, and is left running`.
  - Setup: the test spawns a Node bystander with an IPC channel; it answers each message and ends itself after `HANG_MS`. The test writes records holding the bystander's pid, with a fresh `at`, and runs the judge as R-2023 calls it. After the judge returns, the bystander must answer a ping within `PID_POLL_MS` (item 5: the check waits for any kill to show). The test then ends it through its own handle.
  - Red cases: the judge sends SIGKILL to each pid it reads alive (the old `:280` loop); the verdict omits the pid or its probe result; the judge reads ended from the record count without probing.
- **R-2891.** IF the launch-limit judge first probes a run at or after the earliest start time its records carry plus `HANG_MS` less the sealed self-exit margin, or any record carries no start time, THEN it shall report that run not ended, naming the reason.
  - Test: `R-2891: a run judged after its fixture could have ended by itself, or holding a record with no start time, reads not ended with the reason named`.
  - Cases: a record whose `at` is `HANG_MS - SELF_EXIT_MARGIN_MS / 2` ago and whose pid is a process that already exited (reason "judged too late", whatever the probe reads); a record with no `at` (reason names the missing start time).
  - Red cases: the judge ignores `at`; the deadline drops the margin (`at + HANG_MS`); a record with no `at` is skipped or judged.
- **R-2892.** IF the launch-limit judge's probe of a recorded pid fails with an error code other than ESRCH, or a record holds a pid or ppid that is not a positive integer, THEN the judge shall report that run not ended, naming the error code or the record.
  - Test: `R-2892: a probe error other than ESRCH, or a record without a positive integer pid and ppid, makes the judge report its run not ended and name it`.
  - Cases: an injected `kill` that throws EINVAL; one that throws EPERM; records with `pid: 0`, `pid: "123"` and no `ppid`.
  - Red cases: the probe reads any code but EPERM as gone (today's `processAlive` polarity, `:59`); EPERM read as gone; the judge drops records without a valid pid (the `readPids` filter, `:69`); the verdict omits the code.
- **R-2893.** Every call to a function named `kill` in the launch-limit test file shall be the probe's `kill(pid, 0)`, `process.kill(-child.pid, …)`, `process.kill(group ? -child.pid : child.pid, …)`, `process.kill(relayPid, …)` or `child.kill(…)`; the file shall import no tree-kill helper and start no `taskkill` or `kill` command.
  - Test: `R-2893: the launch-limit test signals only through its allowed kill calls, imports no tree-kill helper and starts no kill command`.
  - The test reads its own source. Its patterns are built so that the scan's own text does not match them.
  - Red cases: the `:280` loop restored; any `for (const pid of …) process.kill(pid, …)`; `process.kill(child.pid, …)` left at `:484`; the judge calling its injected `kill` with a signal; an import of `killProcessTree` or `killWorkerTree`; a `taskkill` spawn over recorded pids.
- **R-2894.** The launch-limit test shall give a fixture's process tree a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, with the allowance plus the relay settle window plus the stop margin ending at least the self-exit margin before the fixture hang, and the allowance plus the parent-kill bound ending before it.
  - Test: `R-2894: a fixture tree gets a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, and a stopped launch returns at least that margin before the fixture's hang`.
  - Asserts: `START_ALLOWANCE_MS === 6_000`; `SELF_EXIT_MARGIN_MS === 1_000`; `PARENT_KILL_BOUND_MS` equals R-2484's expected sum; `START_ALLOWANCE_MS + RELAY_SETTLE_MS + HANG_STOP_MARGIN_MS <= HANG_MS - SELF_EXIT_MARGIN_MS` (10.5 ≤ 11 s); `START_ALLOWANCE_MS + PARENT_KILL_BOUND_MS < HANG_MS` (8.2 < 12 s).
  - Red cases: the allowance at 3 s; the allowance at 7 s (11.5 > 11 s); the margin at 0; the start wait folded into `PARENT_KILL_BOUND_MS`.
- **R-2895.** WHEN a fixture's pi starts its child later than the default poll but inside the start allowance, the parent-kill check shall count that launch started.
  - Test: `R-2895: the parent-kill check counts a launch whose pi starts its child after the default poll but inside the start allowance as started`.
  - POSIX only; on win32 it skips, because the Windows start spread is what the allowance absorbs.
  - Setup: `observeParentKill({ group: false, childDelay: LATE_CHILD_MS })`. Asserts: started; `PID_POLL_MS < LATE_CHILD_MS < START_ALLOWANCE_MS`; the child record's `at` is at least `LATE_CHILD_MS` after pi's.
  - Red cases: `observeParentKill` keeps `waitFor`'s default `PID_POLL_MS`; the start wait uses `LIMIT_MS`; the hang body ignores `CHILD_DELAY_MS`.

Existing rows keep their text and titles: R-2023, R-2300, R-2303, R-2130, R-2131, R-2026, R-2027, R-2133 and R-2484. R-2023's test changes show in the diff with no new row: judged at once through the judge, the allowance as its limit, the detail check, and the after-self-exit diagnostic.

### Seal lines

- `START_ALLOWANCE_MS = 6_000`. Chosen 2026-10-25 (R-2894). It answers two misses: R-2023's run 1 had no record inside its 3 s limit (CI 40160292637/1), and R-2300 saw no child inside its 2 s wait (CI 39907491406/1). The R-2894 test pins it.
- `SELF_EXIT_MARGIN_MS = 1_000`. Chosen 2026-10-25 (R-2891, R-2894). It covers a fixture timer armed from Node's cached loop time and a small clock step, so a self-exit cannot pass as an end (inferred, not measured). The worst measured stop, 6,714 ms on a 3 s limit (`:30`), scales to about 9.7 s on the allowance, under the 11 s deadline. The R-2894 test pins it.
- `LATE_CHILD_MS = (PID_POLL_MS + START_ALLOWANCE_MS) / 2`. Derived, chosen: 2 s past the default poll and 2 s inside the allowance. Not sealed.
- `CHILD_DELAY_MS` is a fixture layout name, chosen, not sealed.
- Every other assertion imports these names, never the literals.

## Precedent (verified at 61671be0)

- **Fail-closed polarity, an unknown answer blocks the verdict:** `packages/nana-pack/lib/lane-watcher.mjs:86-101` (`defaultProcessStartedAt` returns null on any failure) and `:175-176` (`identitySafe` false sends no kill). The judge copies the polarity, not the code.
- **Bare-pid probe with an injected kill:** `pidAlive`, `packages/nana-pack/lib/process-tree.mjs:21-25`. The file's own copy is `processAlive`, `pi-launch-limits.test.mjs:54-61`. The new probe reverses the polarity: only ESRCH reads gone. Departure, named: the lane edits the file's copy, not the shared helper.
- **Synchronous wait:** `waitDeadSync` and `sleepSync`, `pi-launch-limits.test.mjs:50-52` and `:72-76`. The judge replaces `waitDeadSync`.
- **A fixture that ends itself:** the hang body's own exit at `HANG_MS`, `pi-launch-limits.test.mjs:94`; and `scripts/test.mjs:249`, the self-test fixture that exits itself after the runner limit.
- **Records, cases and env plumbing:** `readPidRecords` `:63-66`; `makeFixture` env `:123`; `launchInstallWrapper` `:173-175`; `timedStep` and `timedDoctor` `:222-234`; R-2023 `:274-284`; `observeParentKill` `:177-189`; R-2303 `:471-487`.
- **A start wait named apart from a measured bound:** `START_SKEW_MS` and `RENDEZVOUS_LIMIT_MS`, `packages/nana-pack/tests/test-runner-parallel.test.mjs:52-53`. Seal pattern: R-2484 at `pi-launch-limits.test.mjs:240-249`.
- **A child with an IPC channel:** `packages/nana-pack/tests/test-runner-parallel.test.mjs:524` (`stdio: [..., "ipc"]`).
- **Kill through the test's own handle:** `killWorkerTree`, `packages/nana-pack/tests/process-tree-helper.mjs:38-44`. It is a half precedent: it uses `child.kill` on POSIX only and runs `taskkill /T /F` on Windows. Not imported.
- **A test that reads source text for a forbidden shape:** R-644, `packages/nana-pack/tests/post-edit-hardening.test.mjs:500-501`.
- **Rejected:** `windowsLaneWatchers`, `process-tree-helper.mjs:26-35`, which returns `[]` when PowerShell fails (`:30`).

No private helper moves to a shared module.

## Class and builder

- **Ordinary, plus the local macOS install check.** It changes one test file under `packages/nana-setup/tests`, `REQUIREMENTS.md` and regenerated docs. No install, uninstall, doctor, hook, pi extension, gate, land or review code changes. Ladder: one final reviewer.
- **Install check:** the lane touches `packages/nana-setup/`, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land`. The builder does not run it.
- **Builder:** pi-worker, small lane, one session (one file, about 150 changed lines).
- **Windows proof:** the seat pushes the draft pull request at build 1 and reads its Windows leg before the review brief, including R-2023's detail there.
- **Time (inferred, not measured):** R-2023 grows about 12 s on macOS (four runs at 6 s, not 3 s) and somewhat more on Windows. The new checks add about 7 s: R-2890 about 2 s, R-2895 about 5 s.

## Seat wrong-code pairs (each must turn its row red every run, on macOS unless noted)

1. The judge sends SIGKILL to each pid it reads alive (the old `:280` loop) → R-2890 and R-2893.
2. The judge's verdict drops the pid list and probe results → R-2890.
3. The judge sets "ended" from the record count without probing → R-2890.
4. The judge ignores `at` → R-2891 (judged-too-late case).
5. The deadline is `at + HANG_MS`, with no margin → R-2891 (half-margin case).
6. The judge skips a record with no `at` → R-2891 (no-start-time case).
7. The probe keeps today's polarity, any code but EPERM reads gone → R-2892 (EINVAL case).
8. The probe reads EPERM as gone → R-2892 (EPERM case).
9. The judge filters records through `readPids`' positive-integer filter → R-2892 (record cases).
10. The verdict omits the error code → R-2892.
11. `process.kill(child.pid, "SIGKILL")` kept at R-2303's wrapper cleanup (`:484`) → R-2893.
12. The `:187` loop in `observeParentKill` restored → R-2893.
13. The judge calls its injected `kill(pid, "SIGKILL")` on a live pid → R-2893 and R-2890.
14. An unused `import { killWorkerTree } from "../../nana-pack/tests/process-tree-helper.mjs"` → R-2893.
15. `spawnSync("taskkill", ["/PID", String(pid), "/F"])` over recorded pids in R-2023 → R-2893.
16. `START_ALLOWANCE_MS = 3_000` → R-2894 (and R-2895). `START_ALLOWANCE_MS = 7_000` → R-2894. `SELF_EXIT_MARGIN_MS = 0` → R-2894. `PARENT_KILL_BOUND_MS` gains `START_ALLOWANCE_MS` → R-2894 and R-2484.
17. `observeParentKill` keeps `waitFor`'s default `PID_POLL_MS` → R-2895. Its start wait uses `LIMIT_MS` → R-2895.
18. The hang body ignores `CHILD_DELAY_MS` → R-2895 (spread check).
19. R-2023 runs all four launches, then judges (the old `:276-282` order) → R-2023, through run 1's "judged too late".
20. R-2023's runs use `LIMIT_MS` instead of `START_ALLOWANCE_MS` → R-2023, through the detail check.
21. Product mutation, seat only: `killTree` in `packages/nana-setup/lib/bounded-spawn-child.mjs:54-57` calls `child.kill("SIGKILL")` instead of `killProcessTree` → R-2023. On macOS the shim dies, and pi and pi's child stay alive past the judge, inside the deadline.

## Known limits (the seat writes them to FEAT-013's known-bug file before the final round)

- A pid reused between a fixture's end and the judge's first probe reads alive, so R-2023 fails closed as a flake. Measured 0 of 254 judgements within about 4 s.
- The after-self-exit probe is a diagnostic and unpinned. A hung fixture and a stranger both read alive after self-exit.
- No test pins that a pid read gone stays ended, or that the wait stops at the deadline once the first probe came before it.
- `SELF_EXIT_MARGIN_MS`'s reason, a timer armed from Node's cached loop time, is inferred, not measured.
- The timed checks (R-2300, R-2303, R-2130, R-2131, R-2026, R-2027, R-2133) keep bare-pid reads inside their bounds and no deadline. A reused pid can turn them red but draws no kill.
- R-2303 (Windows) and R-2133 (POSIX) still signal the relay pid read from a record. The relay's 12 s limit keeps it alive then, and R-2894's second sum keeps the signal inside it.
- R-2303's start wait uses the allowance through the shared helper, but only the Windows leg runs it; no macOS red case covers that call site.
- R-2026, R-2027 and R-2133 keep the 2 s default start wait (POSIX; not in the failure data).
- After a failed R-2027 or R-2133, the signal-cleanup fixture's processes run until their own 60 s hold ends, since no failure path kills them now (POSIX only).
- The bystander link (templates-update, project-stale, project copier render) stays unproven; the critic rates it low. A bystander failure with no R-2023 failure in the same attempt disproves it.
- If R-2023 fails after the lane and its after-self-exit probe reads gone, that is a real relay leak. FEAT-013's relay-overrun known bug is the first suspect, and it needs a product lane.
- CI re-runs cannot prove the rate fell. The proof is the wrong-code pairs and the named judge detail.

## Overlap with the four lanes now building, and the sibling plan

- No source file overlaps. artifact-readers, adoption-window, knowledge-freeze-notice and review-texts-durable touch none of this lane's code. adoption-window edits `adoption-reader.test.mjs` and `lib/adoption.mjs`; knowledge-freeze-notice edits `packages/nana-knowledge` and the sources-file tests.
- knowledge-freeze-notice adds a doctor row after `knowledge index`. `timedDoctor` finds `pi executable` by label, so R-2023 is unaffected.
- Shared ledger and generated files: all four touch `REQUIREMENTS.md`, `docs/requirements-tree.md` and `docs/code-map.md`. Their rows sit in R-2830 to R-2872; this lane's R-2890 to R-2895 collide with none.
- `docs/known-bugs/FEAT-031.md`: review-texts-durable edits it and adds a line on R-2023 failing at 61671be0. This lane's notes retire R-2023's part of lines 99 and 109 and that new line. review-texts-durable also edits `docs/known-bugs/FEAT-030.md`; this lane does not.
- The sibling plan win-test-limits (not building) uses R-2880 to R-2889, closes FEAT-031 lines 97, 108 and 111 and FEAT-013 line 203.
- Whoever lands second merges main and regenerates `docs/requirements-tree.md` and `docs/code-map.md`. This lane merges main and re-reads the known-bug lines before the final round.

## The claim I would most expect to be wrong

That a stopped launch always returns, and its processes read gone, before the 11 s deadline on a loaded Windows runner. If not, R-2023 reads "judged too late" and fails closed as a new flake; it never passes over a leak.
