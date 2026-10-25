# launch-limits-identity · plan draft (planner, 2026-10-25)

Feature: FEAT-013 · Install and connect harness runtimes

Main at draft time: 61671be0. Every file:line below was opened at that commit.

## Source of the decision

- The owner's pick on 2026-10-25: "Plan the Windows fix lane after the research".
- The research: `<scratch>/winflake/report.md`, sections 2 to 6. Its critic: `<scratch>/winflake/critic.md`.
- The research proposed one lane over six features. The critic asked for one feature per lane. This lane is the FEAT-013 part: R-2023's bare-pid judge and kills, and R-2300's start wait.
- The critic rated the bystander link low and flagged a rescue risk in the research's identity design. This plan takes both points (Seat decisions, design choice).

## Spend line

HANDOFF Next item "Windows first-try failures". Windows first-try failures cost about 15 minutes of re-runs per land, and each one holds a land.
R-2023 failed six times since 2026-10-22, three after the hardening land; R-2300 failed once.
Plan on this lane removing 3 of the 13 live flake attempts seen since the hardening land. The bystander files may add up to 2 more; the critic rates that low.

## Stakes

Low blast, reversible. One test file changes, plus ledger and regenerated docs. No product file changes. A revert restores main.

## Threat model

In scope, honest variation: runner speed and load, antivirus holds on files, process start time, timer delay, and Windows pid reuse within seconds.
Out: deliberate forgery, such as a process writing another fixture's beat file or a hand-made pid record. A finding outside this model is a residual.

## Root cause (research and critic, inferred, medium confidence)

- R-2023 runs four timed-out launches, then judges all four (`pi-launch-limits.test.mjs:276-282`). Run 1 is judged about 12 s after its processes end.
- The judge calls a pid alive through `process.kill(pid, 0)` (`:54-61`). Windows reuses pids quickly, so a stranger can hold that pid.
- On failure it sends SIGKILL to every recorded pid (`:280`). That can hit a neighbour process.
- Every failing run was run 1 or 2, never run 3 or 4. Run 1's fixture processes end themselves 12 s after start (`HANG_MS`, `:24`, and the body at `:94`). So a run-1 "alive" at the judge points to reuse, not a leak (inferred).
- One failure recorded no process in run 1 (CI 40160292637/1): three processes could not start inside the 3 s limit.
- R-2300 saw 2 of 3 processes inside its 2 s start wait (CI 39907491406/1, `:180` through `waitFor`'s default `PID_POLL_MS`, `:36`).

## Design choice: beat files, not a command-line lookup

| Design | External lookup | Failure mode | Runs on macOS pairs | Cost |
|---|---|---|---|---|
| Command-line lookup (research): generalize `windowsLaneWatchers` | PowerShell on Windows, `ps` elsewhere | Fail open reads every pid as not ours (critic's rescue risk). Fail closed turns a cold PowerShell into a new flake. | Windows half only | 1-10 s per cold PowerShell |
| Beat file (critic, chosen) | None | A live process starved for a whole quiet window reads ended | Yes, same code on every platform | One quiet window per judgement |

- Chosen: each fixture process appends one byte to its own beat file every `BEAT_MS`. The judge calls a process ended when its beat file did not grow over `QUIET_MS`.
- Identity comes from the file, not the pid. A stranger holding a reused pid cannot grow a fixture's beat file.
- Considered and dropped: a loopback socket per fixture process, closed by the OS at death. It needs no window, but `stepPiRegister` blocks the test's event loop, so it needs more machinery.

## Seat decisions

- **The judge never signals.** It returns a verdict per run and names each recorded process with its two beat sizes or its read error.
- **Cleanup sends no signal.** A case's failure path writes the fixture's stop request. Every fixture process checks it before each beat and exits on it.
  - The fixture already ends itself at `HANG_MS`. The stop request only shortens that.
  - So "failure-path kills routed through the same check" becomes "no failure-path kill at all", the check's strongest form.
- **A lookup failure reads not ended.** A beat file that cannot be read, or is missing, at either snapshot until the window ends, gives "not ended" and names the error. This is lane-watcher's fail-closed shape.
- **Order in the fixture body:** first beat, then the pid record. So every record's beat file exists once the record is visible.
- **Each record names its beat file** (`beat: "<pid>-<random>"`), so two fixture processes that share a reused pid never share a file.
- **R-2023 judges each run right after it returns.** A leaked process from run 1 would otherwise end itself before the judge.
- **R-2023 requires pi's child.** Each run must hold a record whose args start with `child`, else the run reads not started.
- **R-2023 judges the processes that beat: pi's Node process and pi's child.**
  - The shim (`sh` on POSIX, `cmd.exe` on Windows) is pi itself, not a process pi started, so the row title stays true.
  - The old judge also checked the shim through each record's `ppid`. That extra check goes.
- **One start allowance, two uses (subtraction).** `START_ALLOWANCE_MS` is R-2023's launch limit and the start wait in `observeParentKill` and R-2303. It is not a second R-2023 limit.
  - R-2023 asserts each run's row detail names `START_ALLOWANCE_MS / 1000` seconds, so the use is checked (format at `steps.mjs:1130` and `:1136`).
- **Kept unchanged:** `LIMIT_MS` (3 s) for R-2020 to R-2022, `HANG_MS`, `HANG_STOP_MARGIN_MS`, `PARENT_KILL_BOUND_MS`, every `RELAY_*` value, and R-2484's seal.
- **The timed checks keep their bare-pid reads.** R-2300, R-2303, R-2130, R-2131, R-2026, R-2027 and R-2133 measure an end inside a bound. A quiet window would add to the measured time. Their failure-path kills still move to the stop request.
- **R-2303's wrapper cleanup** (`:484`, `process.kill(child.pid, …)`) becomes `child.kill("SIGKILL")` on the test's own ChildProcess handle, which never signals after exit.
- **No new module.** The judge, beat reader and cleanup stay in the test file; they have one caller. No helper gains a second caller.
- **The header changes:** `@outputs` names the new check count. The code map entry is regenerated.

### What the lane does NOT do

- No product change: no relay, `bounded-spawn`, `steps.mjs`, doctor or `process-tree` edit.
- No PowerShell or `ps` lookup. `windowsLaneWatchers` stays as it is.
- No loosening of R-2484, the parent-kill bound, `HANG_MS`, the hang-stop margin or any product bound.
- No change to the bystander files: templates-update, project-stale, project.
- No run-alone list, job count or time-scale change.
- None of the research's other clusters (R-2546, R-1960, R-1242, R-2619, R-1701, R-2671, adoption reader, sources-file, GP4). Each belongs to its own feature's lane.
- No beat judge for the timed checks (above).

## Must-meet rows (FEAT-013; test file `packages/nana-setup/tests/pi-launch-limits.test.mjs`)

Six rows, R-2890 to R-2895, each `untested` then `implemented`. R-2896 and R-2897 stay free.

- **R-2890.** WHEN a fixture pid record names a process whose beat file stopped growing, the launch-limit judge shall count that record ended, and neither the judge nor the case cleanup shall signal that pid.
  - Test: `R-2890: a fixture record whose pid now belongs to another process reads ended, and the judge and cleanup leave that process running`.
  - Setup: the test spawns a plain Node bystander, then writes a record holding the bystander's pid and a beat file that never grows. It runs the judge (injected wait) and the cleanup. Then it ends the bystander through its own handle.
  - Red: the cleanup signals every recorded pid (old `:280` loop); the judge reads liveness through `process.kill(pid, 0)`; the bystander's exit code or signal is set after the cleanup.
- **R-2891.** WHEN a fixture process's beat file grows during the judge's quiet window, the judge shall report that run not ended and name that process's record.
  - Test: `R-2891: a fixture process still beating through the quiet window makes the judge report its run not ended and name it`.
  - Setup: the test starts the hang body in child mode as its own ChildProcess, waits for its record, and judges with the real wait.
  - Red: one snapshot; "ended" whenever the beat file exists; the verdict does not name the record.
- **R-2892.** IF the judge cannot read a recorded process's beat file at either snapshot before the quiet window ends, THEN it shall report that run not ended, name the failed read and its error code, and signal no process.
  - Test: `R-2892: a beat file that cannot be read, or is missing, makes the judge report its run not ended and signal nothing`.
  - Cases: an injected reader that throws EBUSY at the first snapshot; one that throws at the second; a record whose beat file is missing (ENOENT). Each record's pid is a live bystander that must survive.
  - Red: a reader that returns no value on failure, so two failures compare equal and read ended; a missing file read as size 0; no error code in the verdict.
- **R-2893.** WHEN a case's cleanup runs on a fixture whose processes still beat, it shall write the fixture's stop request, and every fixture process shall end within two quiet windows with no signal sent.
  - Test: `R-2893: the cleanup stop request ends a live fixture's pi and pi's child within two quiet windows without a signal`.
  - Setup: the test starts the hang body in its pi mode as its own ChildProcess, so it spawns pi's child. It waits for both records, then runs the cleanup.
  - Asserts: the judge reads ended; the pi process exited with code 0 and no signal.
  - Red: the fixture body ignores the stop request; the cleanup only waits; the cleanup signals.
- **R-2894.** The launch-limit test file shall send a nonzero signal only to a child process it spawned, that child's process group, or the relay pid a case is testing, and never to another pid read from a fixture record.
  - Test: `R-2894: the launch-limit test signals only its own children, their group or the relay under test, never a recorded fixture pid`.
  - The test reads its own source. Each `process.kill(` call must match one of four forms: `pid, 0` inside the liveness probe; `-child.pid`; `group ? -child.pid : child.pid`; `relayPid`. `child.kill(` is allowed.
  - Red: the `:280` loop restored; any `for (const pid of …) process.kill(pid, …)`; `process.kill(child.pid, …)` left at `:484`.
- **R-2895.** The launch-limit test shall give a fixture's process tree a sealed 6-second start allowance, used as R-2023's launch limit and as the parent-kill and R-2303 start wait, apart from the parent-kill bound, with the allowance plus the relay settle window plus the quiet window, and the allowance plus the parent-kill bound, each under the fixture hang.
  - Test: `R-2895: a fixture tree gets a sealed 6-second start allowance, apart from the parent-kill bound, and the allowance with the settle and quiet windows ends before the fixture's hang`.
  - Asserts: `START_ALLOWANCE_MS === 6_000`; `PARENT_KILL_BOUND_MS` equals R-2484's expected sum; 6 + 1 + 2 < 12 s; 6 + 2.2 < 12 s.
  - Red: the allowance at 3 s; the start wait folded into `PARENT_KILL_BOUND_MS`; `QUIET_MS` raised so the first sum reaches `HANG_MS`.

Existing rows keep their text and titles: R-2023, R-2300, R-2303, R-2130, R-2131, R-2026, R-2027, R-2133 and R-2484.
R-2023's test changes show in the diff with no new row: judge at once, beat judge, pi's child required, the allowance as its limit, and the detail check.

### Seal lines

- `START_ALLOWANCE_MS = 6_000`. Chosen 2026-10-25 (R-2895). It answers two misses. R-2023's run 1 recorded no process inside its 3 s limit (CI 40160292637/1). R-2300 saw 2 of 3 processes inside its 2 s wait (CI 39907491406/1). Sealed by the R-2895 test, which names R-2023, R-2300 and R-2895.
- `BEAT_MS = 100`. Chosen 2026-10-25: 20 beats per quiet window, so one late timer never reads as an end. It answers the bare-pid misreads in R-2023's six failures.
- `QUIET_MS = 2_000`. Chosen 2026-10-25. It replaces the bare-pid probe behind R-2023's six Windows failures since 2026-10-22. It equals the old 2 s end wait, so each judgement costs what the probe cost.
- One seal test with no row pins both: `seal: fixture processes beat every 100 ms and the judge needs a 2-second quiet window of 20 beats`. It names R-2890, R-2891, R-2892 and R-2893.
- The cleanup bound is two quiet windows, derived, with no new name. The stop-request and beat-folder names are fixture layout names, chosen, not sealed.
- Every other assertion imports these names, never the literals. The fixture body reads `BEAT_MS` from its environment, so the test's constant is the one source.

## Precedent (verified at 61671be0)

- **Fail-closed identity, a lookup failure blocks the signal:** `packages/nana-pack/lib/lane-watcher.mjs:86-101` (`defaultProcessStartedAt` returns null on any failure) and `:174-176` (`identitySafe` false sends no kill). The judge copies the polarity, not the code.
- **Renewal-based liveness with a quiet window:** `packages/nana-pack/bin/review-round.mjs:93-95` (stale after no renewal for a window) and `:868-886` (`renew`, `startHeartbeat` every 1/5 of the window).
  - Departure: 20 beats per window, not 5. A fixture beat costs one byte and no lock, and more beats per window make a late timer less likely to read as an end.
- **A fixture that ends itself:** the hang body's own exit at `HANG_MS`, `packages/nana-setup/tests/pi-launch-limits.test.mjs:94`; and `scripts/test.mjs:244-249`, a self-test fixture that exits itself after the runner limit.
- **A pi child branch in a fixture body:** the hang body's `child` mode at `pi-launch-limits.test.mjs:94`. The signal-cleanup body (`:135`) replaces its inline `-e` child with the same `child` branch, so both of its processes beat and obey the stop request.
- **Records, cases and env plumbing:** `readPidRecords` `:63-66`; `makeFixture` env `:123` and the `withFixtureEnv` name list `:209`, which gains the beat-folder, stop-request and beat-interval names; `timedStep` and `timedDoctor` `:222-234`; R-2023 `:274-284`; `observeParentKill` `:177-189`; R-2303 `:471-487`.
- **Kill through the test's own handle:** `killWorkerTree`, `packages/nana-pack/tests/process-tree-helper.mjs:38-44` (`child.kill`).
- **A start wait named apart from a measured bound:** `START_SKEW_MS` and `RENDEZVOUS_LIMIT_MS`, `packages/nana-pack/tests/test-runner-parallel.test.mjs:52-53`. Seal pattern: R-2484 at `pi-launch-limits.test.mjs:240-249`.
- **A test that reads source text for a forbidden shape:** R-644, `packages/nana-pack/tests/post-edit-hardening.test.mjs:499-501`.
- **Rejected:** `windowsLaneWatchers`, `process-tree-helper.mjs:26-35`, which returns `[]` when PowerShell fails (`:30`). Not imported, not generalized.
- **Left alone:** the file's `processAlive` (`:54-61`) copies `pidAlive` (`packages/nana-pack/lib/process-tree.mjs:21-25`). The lane adds no caller, so it does not move.

No private helper moves to a shared module.

## Class and builder

- **Ordinary.** It changes one test file under `packages/nana-setup/tests`, `REQUIREMENTS.md`, known-bug lines and regenerated docs. No install, uninstall, doctor, hook, pi extension, gate, land or review code changes. Ladder: one final reviewer.
- **Local install check:** the lane touches `packages/nana-setup/`, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land`.
- **Builder:** the small builder, one session. Size: small (one file, about 150 lines; the subtle part is the judge's polarity).
- **Windows proof:** push the draft pull request at build 1 and read its Windows leg before the review brief. Read R-2023's detail on that leg.
- **Time:** R-2023 grows from about 16 s to about 36 s on Windows (four runs at 6 s, plus 2 s each). The new checks add about 8 s. Inferred, not measured.

### File overlap with the four building lanes

- No source file overlaps. artifact-readers, adoption-window, knowledge-freeze-notice and review-texts-durable touch none of this lane's code.
- Shared ledger and generated files: `REQUIREMENTS.md` (adoption-window, other feature section), `docs/requirements-tree.md` (all four), `docs/code-map.md` (artifact-readers, adoption-window), `docs/sessions/2026-10.md` (review-texts-durable).
- `docs/known-bugs/FEAT-031.md`: review-texts-durable edits it. This lane's notes retire its lines 99 and 109 on R-2023, so merge main first.
- Merge main and regenerate the tree and map before the final round.

## Seat wrong-code pairs (each must turn its row red every run, on macOS unless noted)

1. The cleanup sends SIGKILL to every recorded pid, the old `:280` loop → R-2890 and R-2894.
2. The judge reads liveness through `process.kill(pid, 0)` instead of beats → R-2890.
3. The judge takes one snapshot and calls a record ended when its beat file reads → R-2891.
4. The beat reader returns `null` on a read error, and `null` equals `null` reads unchanged → R-2892. This is the "lookup returns no rows on failure" pair.
5. A missing beat file reads as size 0 → R-2892, missing-file case.
6. The fixture body ignores the stop request → R-2893.
7. `process.kill(child.pid, "SIGKILL")` kept at `:484` → R-2894.
8. Product mutation, seat only: `killTree` in `packages/nana-setup/lib/bounded-spawn-child.mjs:54-57` calls `child.kill("SIGKILL")` instead of `killProcessTree` → R-2023. On macOS the shim dies, and pi and pi's child keep beating.
9. R-2023's runs use `LIMIT_MS` instead of `START_ALLOWANCE_MS` → R-2023, through the row-detail check.
10. The hang body stops spawning pi's child → R-2023, through the pi's-child check.
11. `START_ALLOWANCE_MS = 3_000`, or `QUIET_MS = 6_000` → R-2895.
12. `BEAT_MS = 500` → the seal test.

## Known limits (the seat writes them to FEAT-013's known-bug file before the final round)

- The shim is not judged. It is pi itself and exits with its only child, but a suspended shim would go unseen.
- A live fixture process starved for a whole 2 s quiet window reads ended, so R-2023 would miss that leak.
- The timed checks (R-2300, R-2303, R-2130, R-2131, R-2026, R-2027, R-2133) still read liveness by bare pid inside their bound. A reused pid can turn them red but never draws a kill.
- R-2303 (Windows) and R-2133 (POSIX) still signal the relay pid from a record. The relay is alive while its 12 s limit runs, and R-2895's second sum keeps the signal inside it.
- No test pins "judge each run at once"; R-2895's first sum gives the reason.
- The bystander link (templates-update, project-stale, project copier render) stays unproven. After the lane, a bystander failure with no R-2023 failure in the same attempt disproves it.
- If R-2023 fails after the lane and names a process still beating, that is a real relay leak. FEAT-013's known bug on relay overrun (line 131) is the first suspect, and it needs a product lane.
- The file runs about 28 s longer on Windows (inferred).
- CI re-runs cannot prove the rate fell. The proof is the wrong-code pairs and the named judge detail.

## The claim I would most expect to be wrong

That a 2 s quiet window never reads a live, CPU-starved fixture process as ended on a loaded Windows runner. If it does, R-2023 passes over a real leak. Pair 8 runs only on macOS, so the Windows side of that rests on CI legs.
