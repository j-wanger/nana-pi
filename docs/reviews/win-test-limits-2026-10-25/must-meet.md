# win-test-limits · must-meet of record (seat, 2026-10-25)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 0 MUST, 6 SHOULD, 9 NOTE). The seat took all six SHOULDs and all nine NOTEs; the seat decisions below say how each landed. Plans get no review round. Where this file and the draft differ, this file holds; the draft keeps the measured causes, fixture designs and the research trail.

The owner's decision, 2026-10-25: "Plan the Windows fix lane after the research". This is planning only. The build waits for the owner's go and a free building slot. The pick is the owner's exception to the page-readability pause (HANDOFF Next item 4); the session notes say so.

Spend line: the current priority through lane reliability (HANDOFF Next item 6, "Windows first-try failures"). Each Windows first-try failure costs about 15 minutes of re-runs per land and holds the land. Since the hardening land, eight Windows attempts failed on a check this lane changes (planner's count, recounted by the adversary).

Stakes: low blast, reversible. Test files, one new shared test helper and two run-alone entries. No product code changes. A revert restores main.

Threat model: honest variation in runner speed and load, antivirus scans, process start time (a cold Windows `node`, `cmd.exe` or PowerShell start under four jobs) and Windows pid reuse is in scope. Deliberate forgery is out, such as a hand-planted pid file or a forged process command line. A finding outside this model is a residual.

## Seat decisions

- **Feature.** FEAT-031 owns the test runner and the run-alone list. The precedent for cross-feature test fixes under FEAT-031 is the win-flake-hardening lane: it placed R-2667 (a build-report test) and R-2670 (a brief-check test) inside FEAT-031. This lane's rows go in FEAT-031 after R-2670, though most changed tests belong to FEAT-006, FEAT-030, FEAT-003, FEAT-005 and FEAT-007 files. The pid-identity work (R-2023, R-2300) is the sibling lane launch-limits-identity.
- **Class ordinary, larger builder, no install check.** Confirmed: no file under `packages/nana-setup/` changes, setup tests included. `hook-deadlines.test.mjs` is named in the run-alone list but not edited. If the build touches a setup test after all, the seat adds the local install check before the land.
- **S1, R-2880's late pass is 1 second.** LATE_PASS_MS is `1_000`: any sleep above the old 800 ms fails the old limit every run, and 1 s leaves a-pass 4 s of the 5 s record limit for a cold start. a-pass records its own measured sleep, as `meetingFixture` does; the check does not use the runner's seconds, which include start time on Windows.
- **S2, the shim never leaks.** The slow-sampler shim lives in a per-launch folder that only R-2883's launch (the one placed beside R-2619) puts on PATH, through `run`'s `more` argument: `PATH: <shimDir><delimiter><stubDir><delimiter><process.env.PATH>`, plus `SAMPLER_MARKER` and `SLOW_SAMPLER_MS`. The shim never goes in the stub folder, so no later launch in the file finds it. The helper writes into a folder its caller passes and calls neither `mkdtempSync` nor `tmpDir` (R-917's scan).
- **S3, one shared shim helper.** The slow-sampler shim and all its constants move from `brief-check.test.mjs` into one new test helper, `packages/nana-pack/tests/slow-sampler.mjs`, which both brief-check and worker-lane import (the 2026-10-22 second-caller ruling). It holds: the shim writer (`brief-check.test.mjs:63-67`), the PATH resolution of the sampler name (`:69-71`, with the caller's spawn limit passed in), the first-on-PATH comparison (`:119-123`), and SLOW_SAMPLER_MS, WORKER_POLL_SECS and FAKE_PI_HOLD_MS (`:51-53`) with their 2026-10-23 provenance. Each test file keeps its own CHILD_LIMIT_MS. R-2670's text, title and seal stay; its seal keeps pinning WORKER_POLL_SECS through the import. It is a new module, not `process-tree-helper.mjs`, because one module has one purpose.
- **S4, overlap.** The overlap section below is rewritten against the four lanes now building.
- **S5, sources-file prints what it saw.** sources-file's `run` (`sources-file.test.mjs:36-42`) reads a named CHILD_LIMIT_MS of 30 s and returns each child's elapsed ms. Each of its checks prints a detail with each child's elapsed ms, status and signal. The limit change is named in the provenance with its cause marked inferred.
- **S6, hook-deadlines stays on the run-alone list.** The seat, not the builder, narrows the FEAT-013 known-bug line at notes time (below).
- **Every changed check prints what it saw (draft decision 3, N7).** R-2880: per-file label, cause, seconds and a-pass's recorded sleep, both runs. R-2619: each launch's entry, status, elapsed ms and stderr tail. R-1701 and R-2884: the alive, ended, survived, settled and delay values. No row; it shows in the diff.
- **Late starts and late releases live in the fixture body**, as R-2668 puts its skew in `meetingFixture`. Each records its measured delay, and each row asserts it, so a dropped delay fails.
- **worker-lane changes its shared launcher once.** `run` (`worker-lane.test.mjs:72-75`) launches at WORKER_POLL_SECS with worker-lane's CHILD_LIMIT_MS, so R-2619 and every other `run` caller launch sampler-free. `launchTogether` (`:577`) keeps `--poll 0.1`; it has no child limit. The ceiling case (`:624`) still fires, because pi-watchdog checks the ceiling before it samples.
- **R-1701's cleanup reaps the shell pid only when the check did not see it end** (`post-edit-hardening.test.mjs:334`). No row: pid reuse cannot be forced. It shows in the diff.
- **R-1242: one named wait serves the test and the probe.** CONTEND_WAIT_MS is the held wait and is passed to run1 as `NANA_TEST_WAIT_MS`, as R-1775's case does. The probe's `rendezvous-lock` branch waits `NANA_TEST_START_DELAY_MS` (default 0, so no other case changes) before its mark and writes its measured delay into the mark.
- **GP4 (N13).** GP4's owner becomes IMPOSSIBLE_PID, and each iteration's folder carries the iteration index (`nana-review-${IMPOSSIBLE_PID}-gp4-${index}`), so iterations never share a folder. pi-review's `^nana-review-(\d+)-` still matches. GP4 first asserts that probing the pid throws ESRCH. IMPOSSIBLE_PID is the third copy of 2,147,483,647; a test file cannot import another test file.
- **writing-injection.** Its runCase guard (`writing-injection.test.mjs:121`) reads a named CASE_CHILD_LIMIT_MS of 30 s. It stays unsealed because no row of this lane owns it (R-2500 is a feature row).
- **R-2884's SKIP line (N9).** R-2884's check sits in the same win32 block as R-1701's, with its title as a plain literal and its own exact-title SKIP line in the block's `} else {` (R-1954's scanner).
- **No deterministic guard in this lane (N15).** A check that every test child limit comes from a named constant checks form, not adequacy: a named constant can still be too small, as TREE_DEADLINE_MS and the hook bounds were. The remedies that do see adequacy (a floor on test child limits, a Windows time scale, a review-standard line for the two habits) are owner calls. The seat carries them to HANDOFF as one Open-for-the-owner line, default "none until the next ten Windows legs".
- **Not in this lane.** No product change. No loosening of a sealed bound: R-1700's check seals TREE_DEADLINE_MS (its row states no number); R-1779's 30 s and R-1960's 300 s config values; the hook's deadline and producer limit; R-2484. No R-2023, R-2300 or bystander changes. No time scale, job-count change, wider run-alone list or retry. No edit to `adoption-reader.test.mjs`, `hook-deadlines.test.mjs`, `requirements-deliverables.test.mjs`, R-1713, R-1984, the README rehearsal or the review lock.

## Must-meet rows (FEAT-031, after R-2670)

Six rows, R-2880 to R-2885, `untested` until each check passes, then `implemented`. R-2886 to R-2889 stay free; launch-limits-identity holds R-2890 to R-2897. Existing rows keep their text and titles. R-2753's check imports RECORD_LIMIT_MS instead of `Number("800")` (`test-runner.test.mjs:611`).

- **R-2880.** WHEN the file in R-2546's record fixture that sleeps LATE_PASS_MS and then passes runs under RECORD_LIMIT_MS, the run record shall label it PASS with no cause, and shall label the fixture file that runs past RECORD_LIMIT_MS FAIL with cause `timed out`, in the serial and the two-job run. Test: `packages/nana-pack/tests/test-runner.test.mjs::R-2880: a record-fixture file that passes after 1 second is labelled PASS with no cause, and the file that outlives the record limit is labelled FAIL timed out, serial and parallel`. In the fixture (`:522-531`), a-pass sleeps LATE_PASS_MS by a sleep loop and records its measured sleep under a per-run folder passed in env; d-timeout sleeps TIMEOUT_FIXTURE_MS, then ends itself; `runRecorded` (`:533`) passes `String(RECORD_LIMIT_MS)`. Red cases:
  - RECORD_LIMIT_MS back to 800: a-pass is FAIL `timed out`.
  - a-pass's sleep removed: its recorded sleep is below LATE_PASS_MS.
  - d-timeout ending before the limit: its cause reads `no passing check`.
- **R-2881.** WHEN R-1960's bounded-release child starts CHILD_LATE_START_MS late, the check shall read that child's result, with the child's recorded start delay at least CHILD_LATE_START_MS. Test: `packages/nana-pack/tests/mutation-runner.test.mjs::R-2881: R-1960's bounded-release child still reports its result when it starts 3 seconds late`. The child body (`:670-685`) opens with an `Atomics.wait` of CHILD_LATE_START_MS and records the delay in its result file; its guard (`:692`) and R-1779's guard (`:740`) read CHILD_LIMIT_MS. R-1960's own check reads the same run. Red cases:
  - The guard back to 1500 ms: the child is killed and no result is read.
  - The late start removed: the recorded delay is below CHILD_LATE_START_MS.
- **R-2882.** WHEN the first run's probe in R-1242's contend case marks its lock held PROBE_LATE_MARK_MS after it starts and is released LATE_RELEASE_MS after the second run is refused, the second run shall exit 2 and the first run shall exit 0 with its record whole and its lock gone, and the recorded delays shall be at least the named delays. Test: `packages/nana-pack/tests/mutation-runner.test.mjs::R-2882: R-1242's contend case holds when the first run marks its lock 5 seconds late and is released 5 seconds after the refusal`. The contend case (`:1323-1337`) passes `NANA_TEST_START_DELAY_MS` and `NANA_TEST_WAIT_MS: String(CONTEND_WAIT_MS)` in run1's env, waits CONTEND_WAIT_MS for the mark, and writes the release LATE_RELEASE_MS after run2 returns, measuring that wait. Red cases:
  - The held wait back to 4000 ms: "contend: run1 never reached its rendezvous".
  - `NANA_TEST_WAIT_MS` dropped from run1's env: the probe's 4 s default ends first, and run1 is not `GREEN 1`.
  - The probe's late mark removed: the mark's recorded delay is below PROBE_LATE_MARK_MS.
  - The late release removed: the measured release wait is below LATE_RELEASE_MS.
- **R-2883.** WHILE a CPU sampler slower than worker-lane's CHILD_LIMIT_MS is first on PATH for one launch through worker-lane's shared pi-worker launcher whose fake pi holds FAKE_PI_HOLD_MS, that launch shall exit 0 without starting the sampler, and worker-lane's default launch environment shall not resolve the sampler name to that shim. Test: `packages/nana-pack/tests/worker-lane.test.mjs::R-2883: worker-lane's launcher runs a fake pi that holds one second to exit 0 without starting a CPU sampler slower than the child limit, and no other launch finds that sampler`. Placed beside R-2619. The check swaps in a holding fake pi that writes its held time (as `brief-check.test.mjs:54-61` does), writes the shim into its own folder through the helper, launches once through `run` with the PATH S2 names, then restores the default stub (`worker-lane.test.mjs:64`). It then resolves the sampler name in `run`'s default env and checks the stub folder holds no shim. Red cases:
  - `run`'s poll back to `0.1`: the sampler marker exists (macOS too, where the sampler is `ps`).
  - The shim folder placed after the real `ps` or `powershell` on PATH: the first-on-PATH comparison fails.
  - The hold dropped: the held time is below FAKE_PI_HOLD_MS.
  - The shim written into the stub folder: the default env resolves the shim, or the stub folder holds it.
- **R-2884.** WHERE the platform is win32, WHEN the first level of R-1701's checker tree starts TREE_LATE_START_MS late, the case shall see that tree alive, then see the shell end and the run settle timed out, with the first level's recorded start delay at least TREE_LATE_START_MS. Test: `packages/nana-pack/tests/post-edit-hardening.test.mjs::R-2884: with taskkill off PATH and the tree's first level starting 3 seconds late, the shell still ends and the run settles timed out`; Windows leg only. `writeTreeFixture` (`:129`) gains a `lateStartMs` option: level A waits that long before writing its pid files and records the delay. The taskkill-off-PATH case (`:279-342`) uses TREE_LATE_START_MS and WIN_TREE_DEADLINE_MS for the check's `timeoutMs` and its alive wait. It prints R-1701's check (predicate unchanged, `descendantsSurvived` included) and R-2884's, each with its exact-title SKIP line off Windows. Red cases (Windows CI only):
  - The case's `timeoutMs` back to TREE_DEADLINE_MS: the shell is killed before level A writes its pid files.
  - The alive wait back to TREE_DEADLINE_MS: the wait ends before the late start.
  - The late start removed: the recorded delay is below TREE_LATE_START_MS.
- **R-2885.** The run-alone list shall name `packages/nana-setup/tests/hook-deadlines.test.mjs` and `packages/nana-pack/tests/adoption-reader.test.mjs`, each with a reason naming HOOK_DEADLINE_MS or HOOK_PRODUCER_TIMEOUT_MS, and each name a reason gives shall be a number the hook-producer module exports. Test: `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2885: the run-alone list names hook-deadlines and adoption-reader, each with a reason naming HOOK_DEADLINE_MS or HOOK_PRODUCER_TIMEOUT_MS`. Beside R-1474 (`:491-496`). The check reads RUN_ALONE and imports `packages/nana-setup/lib/hook-producer.mjs` (test roots are layer-exempt). The list's provenance comment (`test-runner-config.mjs:48-57`) gains the two failures each entry answers. Red cases:
  - Either entry missing.
  - A reason that names neither constant.
  - A named constant that hook-producer does not export as a number.

## Seal tests

- `packages/nana-pack/tests/test-runner.test.mjs::seal: the record fixture's per-file limit is 5 seconds, its slow file passes after 1 second and its timing-out file ends itself after 25 seconds` names R-2880.
- `packages/nana-pack/tests/mutation-runner.test.mjs::seal: the bounded lock children have a 30-second limit and the contend case waits 30 seconds, with a 3-second late child, a 5-second late mark and a 5-second late release` names R-2881 and R-2882.
- `packages/nana-pack/tests/worker-lane.test.mjs::seal: worker-lane's launches have a 30-second limit and poll less often than that` names R-2883. It pins worker-lane's CHILD_LIMIT_MS and the poll-above-limit rule only; the shared constants stay pinned by R-2670's seal.
- `packages/nana-pack/tests/post-edit-hardening.test.mjs::seal: the taskkill-off-PATH case allows 10 seconds and starts its first level 3 seconds late, inside the settle watchdog and the fixture's self-exit` names R-2884. It runs on every platform.

## Tunables

Each is defined once beside its use, with provenance, as `brief-check.test.mjs:47-53` does. Every other assertion imports the name.

| Name | Value | File | Provenance |
|---|---|---|---|
| RECORD_LIMIT_MS | 5_000 | test-runner.test.mjs | chosen 2026-10-25 (R-2880): 800 ms missed on four Windows first tries (08e99dbf, 822286b5, 86c628b9, 1e77de81); R-2753 passed in the later three, so both records used 800 ms and the miss was in labels or causes. Margin after the late pass: 4 s, chosen. Sealed. |
| LATE_PASS_MS | 1_000 | test-runner.test.mjs | chosen: above the old 800 ms, so the old limit fails every run. Sealed. |
| TIMEOUT_FIXTURE_MS | 5 × RECORD_LIMIT_MS | test-runner.test.mjs | chosen: the runner self-test's ratio (`scripts/test.mjs:237`, `:249`). Sealed. |
| CHILD_LIMIT_MS | 30_000 | mutation-runner.test.mjs | chosen 2026-10-25 (R-2881): 1.5 s killed R-1960's child once at d3cf9a0d (measured: SIGKILL, empty output). Both guards read it. Sealed. |
| CHILD_LATE_START_MS | 3_000 | mutation-runner.test.mjs | chosen: twice the old 1.5 s guard. Sealed. |
| CONTEND_WAIT_MS | 30_000 | mutation-runner.test.mjs | chosen 2026-10-25 (R-2882): the 4 s held wait missed once (run 39887104509 attempt 2, measured); matches RENDEZVOUS_LIMIT_MS. Sealed. |
| PROBE_LATE_MARK_MS, LATE_RELEASE_MS | 5_000 each | mutation-runner.test.mjs | chosen: above the old 4 s waits, so each fails every run. Sealed. |
| SLOW_SAMPLER_MS, WORKER_POLL_SECS, FAKE_PI_HOLD_MS | 60_000; 60; 1_000 | slow-sampler.mjs (moved) | their 2026-10-23 provenance (R-2670), moved unchanged. WORKER_POLL_SECS stays sealed by R-2670's seal. |
| CHILD_LIMIT_MS | 30_000 | worker-lane.test.mjs | chosen 2026-10-25 (R-2883): R-2619 missed its 15 s limit once at 26235c79 (cause inferred: a cold CPU sampler at a 0.1 s poll); matches brief-check's. Sealed. |
| WIN_TREE_DEADLINE_MS | 10_000 | post-edit-hardening.test.mjs | chosen 2026-10-25 (R-2884): 2.5 s missed once at 833bedee (cause inferred); four times the old deadline. R-1700 keeps TREE_DEADLINE_MS. Sealed. |
| TREE_LATE_START_MS | 3_000 | post-edit-hardening.test.mjs | chosen: above the old 2.5 s, so the old deadline fails every Windows run. Sealed. |
| CHILD_LIMIT_MS | 30_000 | sources-file.test.mjs | chosen 2026-10-25: 10 s missed once at d3cf9a0d, in a run where the file took 83 s against 7.9 to 12.7 s (cause inferred: a sustained runner stall). Not sealed. |
| CASE_CHILD_LIMIT_MS | 30_000 | writing-injection.test.mjs | chosen 2026-10-25: 5 s missed once (run 39712602777, measured SIGTERM). Not sealed. TIME_LIMIT_MS (`:346`) stays. |
| IMPOSSIBLE_PID | 2_147_483_647 | path-spelling.test.mjs | chosen: the impossible owner `mutation-runner-takeover.test.mjs:24` uses; GP4 failed once (run 39890246799). |

## Precedent (verified at main 61671be0)

- `REQUIREMENTS.md:2608` (R-2667) and `:2611` (R-2670): rows in FEAT-031 for other features' tests, from win-flake-hardening.
- `scripts/test.mjs:237` and `:249`: the self-test's 3 s limit and a fixture that ends itself after 15 s.
- `packages/nana-pack/tests/test-runner-parallel.test.mjs:121-138`: `meetingFixture`, a delay in the fixture body recorded as `delayedMs` under `PROBE_OUT`; `:52-53` named start skew and rendezvous; `:40` the detail argument; `:491-496` R-1474.
- `packages/nana-pack/tests/test-runner.test.mjs:522-533`: the record fixture and `runRecorded`; `:611` R-2753; `:620-629` R-917's scan.
- `packages/nana-setup/tests/hook-deadlines.test.mjs:55`: the `Atomics.wait` late start (read only).
- `packages/nana-pack/tests/brief-check.test.mjs:50-53`, `:63-71`, `:77`, `:119-123`, `:138`: the constants, shim, resolution, sampler-free launch, comparison and seal that move.
- `packages/nana-pack/tests/fake-pi.mjs:1-9`: a shared test helper module's form.
- `packages/nana-pack/tests/worker-lane.test.mjs:64`, `:72-75`, `:266`, `:577`, `:624`: default stub, `run`, R-2619, `launchTogether`, the ceiling case.
- `packages/nana-pack/bin/pi-watchdog.mjs:215`, `:221`, `:235`: first timer `min(poll, time left)` and the ceiling before a sample (read only).
- `packages/nana-pack/tests/mutation-runner.test.mjs:133` and `:151-154`: the probe's wait and rendezvous branch; `:422` and `:451` R-1775's matching waits; `:670-692` and `:740` the two child guards; `:1323-1337` the contend case; `:620` the impossible pid.
- `packages/nana-pack/tests/post-edit-hardening.test.mjs:98`, `:129`, `:273`, `:279-342`: TREE_DEADLINE_MS, `writeTreeFixture`, R-1700's seal, the R-1701 case and its SKIP line.
- `packages/nana-pack/tests/windows-skip-lines.test.mjs:28` and `:117-120`: R-1954's scan of the win32 block.
- `packages/nana-pack/lib/test-runner-config.mjs:48-65`: RUN_ALONE and its provenance comment.
- `packages/nana-setup/lib/hook-producer.mjs:23` and `:28`: the two constants (read only).
- `packages/nana-pack/tests/mutation-runner-takeover.test.mjs:24`: DEAD_PID.
- `packages/nana-pack/tests/path-spelling.test.mjs:405-408` and `packages/nana-pack/bin/pi-review.mjs:88-91`: GP4 and pi-review's reclaim (read only).
- `packages/nana-knowledge/tests/sources-file.test.mjs:36-42`: `run`.
- `packages/nana-pack/tests/writing-injection.test.mjs:121`: the inline guard.

Helper move: the slow-sampler shim, its resolution, its comparison and its three constants leave `brief-check.test.mjs` for the new `packages/nana-pack/tests/slow-sampler.mjs`; brief-check and worker-lane import them. No other private helper gains a second caller. The `Atomics.wait` late start is one line in each fixture body, not a helper.

## Class and builder

Ordinary. Test files, one new test helper and the run-alone list. No install, uninstall or doctor code, no hook, no pi extension, no gate, no land or review tool; the runner's list was classed ordinary by suite-records and win-flake-hardening. No file under `packages/nana-setup/` changes, so the local install check does not apply. Ladder: one final reviewer, the roster's. Builder: the roster's larger builder (`pi-worker --lane-size larger`): about eleven files across three packages, and R-2884 is proven only on Windows. The seat pushes the draft pull request at build 1 and reads the Windows leg before the review brief.

## Seat wrong-code pairs

Each must turn its row red on every run. Pairs 14 to 16 run on a scratch Windows CI push, as earlier Windows pairs did; the rest run on macOS.

1. RECORD_LIMIT_MS back to 800 → R-2880 (a-pass FAIL `timed out`).
2. a-pass's sleep removed → R-2880 (recorded sleep below LATE_PASS_MS).
3. d-timeout sleeping `RECORD_LIMIT_MS - 1000`, then ending → R-2880 (cause `no passing check`).
4. R-1960's child guard back to 1500 → R-2881.
5. R-1960's child late start removed → R-2881 (delay check).
6. The contend held wait back to 4000 → R-2882.
7. `NANA_TEST_WAIT_MS` dropped from run1's env → R-2882.
8. `NANA_TEST_START_DELAY_MS` dropped from run1's env (the late mark removed) → R-2882.
9. The late release's wait removed → R-2882.
10. worker-lane `run`'s poll back to `"0.1"` → R-2883 (sampler marker).
11. R-2883's shim folder placed after `process.env.PATH` → R-2883 (first on PATH).
12. R-2883's fake pi hold removed → R-2883 (held time).
13. R-2883's shim written into the stub folder → R-2883 (leak check).
14. Windows: the R-1701 case's `timeoutMs` back to TREE_DEADLINE_MS → R-2884.
15. Windows: the case's alive wait back to TREE_DEADLINE_MS → R-2884.
16. Windows: level A's late start removed → R-2884.
17. R-2884's SKIP line removed → R-1954.
18. hook-deadlines removed from RUN_ALONE → R-2885.
19. adoption-reader removed from RUN_ALONE → R-2885.
20. hook-deadlines' reason stripped of both constant names → R-2885.
21. GP4 given `process.pid` instead of IMPOSSIBLE_PID → GP4's ESRCH precondition fails, naming it.

No one-place lane edit expresses R-2885's "not exported as a number" case; a rename in hook-producer would show it at a merge.

## Known limits (the seat writes them to FEAT-031's file before the final round)

- R-1779's child guard reads CHILD_LIMIT_MS but has no late-start case; only the seal pins the constant.
- worker-lane's `launchTogether` and build-records keep `--poll 0.1`; neither has a child limit that can fail on time.
- R-1701's shell-ended wait judges a bare pid; Windows can reuse it within one 20 ms poll.
- R-1700's tree case keeps 2.5 s with the same Windows start exposure; it has not failed in 171 legs.
- Other tests still judge the pid of an exited process: `hook.test.mjs:486`, `mutation-runner.test.mjs:1341-1342`, `review-ledger.test.mjs:794`, `worker-claude.test.mjs:811` and `:872`. None failed in 171 legs.
- sources-file's and writing-injection's limits are named but not sealed. A runner stall longer than 30 s per spawn still fails sources-file.
- requirements-deliverables keeps its 10 s git limit, because artifact-readers edits that file now.
- Wall time: the two run-alone files run after the pool drains, about 27 to 36 s more per full parallel run on every platform, local runs included. Inside the pool, test-runner.test.mjs gains about 10 s, mutation-runner.test.mjs about 13 s (120 to 154 s on Windows today), and the R-1701 case about 7.5 s on Windows.
- R-2671's late live case overran the hook deadline by 454 ms at 1e77de81. Running hook-deadlines alone removes the load that exposed it.
- adoption-reader's one failure came during a runner-wide stall; running alone would not have prevented it. Its time is re-measured after adoption-window lands.
- The causes of the R-2546, R-2619, R-1701 and sources-file failures are inferred; those checks printed no detail. This lane adds the detail.
- R-2884 and its pairs are proven only on Windows CI.
- CI re-runs cannot prove the rate fell. The proof is the forced late starts and their pairs.
- New tests keep arriving with the same two habits. About 41% of the next flakes may come from checks not yet seen (the critic's estimate). A floor on test child limits, a Windows time scale or a review-standard line are owner calls (HANDOFF).

## Notes the seat writes before the final round

- HANDOFF: one Open-for-the-owner line for the guard decision (default: none until the next ten Windows legs); the Source of this lane is the owner's 2026-10-25 pick, the exception to Next item 4's pause.
- worker-lane's Windows file time before (59.4 to 92.9 s on the eight passing 10-25 legs) and after, in the session notes. If it does not fall, the 30 s limit holds, not the poll.
- Known-bug lines closed or narrowed: `docs/known-bugs/FEAT-031.md:97` (worker-lane part; build-records stays), `:108` (R-2546), `:111` (R-1960); `FEAT-003.md:69` (sources-file: limit widened, cause inferred); `FEAT-014.md:81` (adoption-reader, now run alone); `FEAT-013.md:203` narrowed, not closed, to: "R-2671's late live case overran the hook deadline by 454 ms at 1e77de81, past objective-hook-win's revisit trigger; hook-deadlines now runs alone, so CI no longer runs these hooks under load; the deadline is a hook-lane question." If review-texts-durable lands first, its FEAT-030 line on the R-1701 flake at 833bedee is closed or narrowed with these.
- No README change: `README.md:296` names the list, not its entries.
- Before the final review and the land, the seat runs `requirements-moved --base main` and carries its output in both.

## Overlap with the four lanes now building

- **artifact-readers** edits `requirements-deliverables.test.mjs` (this lane leaves it out) and `REQUIREMENTS.md`, with hunks in FEAT-031's header (a `Reads:` line naming `mutation-runner.mjs`) and FEAT-032's header, flanking R-2670 where this lane's rows go. It does not edit the mutation runner's library; this lane edits only its test.
- **adoption-window** edits `adoption-reader.test.mjs`, `packages/nana-pack/lib/adoption.mjs`, a new adoption config module, `nana-adoption.mjs` and the pack README. This lane edits none of them. It adds adoption-reader to the run-alone list, which R-1474 accepts while the file exists. R-2885 reads HOOK_DEADLINE_MS and HOOK_PRODUCER_TIMEOUT_MS by name, so a rename there turns R-2885 red at the merge.
- **knowledge-freeze-notice** edits `packages/nana-knowledge` (lib, bin, README) and `sources-file.test.mjs`. This lane edits sources-file's `run` and its checks' details: a likely text conflict. Whoever lands second merges main and re-runs sources-file.
- **review-texts-durable** edits `docs/known-bugs/FEAT-031.md` (two lines after `:111`, on R-1984 and R-2023) and `docs/known-bugs/FEAT-030.md` (the R-1701 flake this lane answers), plus `REQUIREMENTS.md`, HANDOFF and the session archive. No test file is shared; the known-bug lines meet at notes time.
- **launch-limits-identity** (planned, not building) takes `pi-launch-limits.test.mjs` and retires `FEAT-031.md:99` and `:109`. This lane edits neither file.
- This lane and all four building lanes touch `REQUIREMENTS.md`. Whoever lands second merges main and regenerates `docs/requirements-tree.md` and `docs/code-map.md`.
