# win-test-limits · plan draft (planner, 2026-10-25)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Draft for the seat and one adversary. Plans get no review round. Every file:line below was opened at main 61671be0.

## Source of the decision

- The owner's pick on 2026-10-25: "Plan the Windows fix lane after the research".
- The research: `<scratch>/winflake/report.md`, sections 2 to 6 (clusters, systemic view, lane proposal, product bugs, likeliest wrong claim).
- Its critic: `<scratch>/winflake/critic.md` (NEEDS-CHANGES; four changes to the must-meet list, one feature per lane, decide a guard now).
- Raw data: `<scratch>/winflake/fails-detail.txt`, `gather-ci.json`, `logs/120206854751.log` (the R-1242 reason), `pass-40158377773.log` and `pass-40150847184.log` (per-file seconds).

## Feature and precedent for the feature

FEAT-031 owns the test runner and the run-alone list (`REQUIREMENTS.md:2476`). Confirmed: the prior hardening lane, win-flake-hardening, used FEAT-031 for cross-feature test fixes. It placed R-2667 (a build-report test, a FEAT-006 file) at `REQUIREMENTS.md:2608` and R-2670 (a brief-check test, a FEAT-006 file) at `:2611`, both inside FEAT-031. This lane follows that: its rows go in FEAT-031 after R-2670, though most of the tests it changes belong to FEAT-006, FEAT-030, FEAT-003, FEAT-005, FEAT-007 and FEAT-014 files.

This answers the critic's "one feature per lane": the lane is one feature, check reliability, which FEAT-031 owns. The pid-identity work (R-2023, R-2300) is split out to the sibling lane launch-limits-identity.

## Spend line

The current priority through lane reliability: Windows first-try failures cost about 15 minutes of re-runs per land and hold lands (HANDOFF Next item 6, "Windows first-try failures"). Since the hardening land, eight Windows attempts failed on a check this lane changes; one of those (run 40148405918 attempt 1) was also red from a lane bug. Counted by the planner from `fails-detail.txt`.

## Stakes

Low blast, reversible. Test files, one new shared test helper and two run-alone entries. No product code changes. The run-alone entries serialize two files in every parallel run, which costs wall time, not correctness. A revert restores main.

## Threat model

In scope: honest variation in runner speed and load, antivirus scans, process start time (a cold Windows `node`, `cmd.exe` or PowerShell start under four jobs), and Windows pid reuse. Out: deliberate forgery, such as a hand-planted pid file or a forged process command line. A finding outside this model is a residual.

## Seat decisions

1. **The two habits, test by test.** The live flakes come from a child limit or wait a cold start can miss, and from judging a bare pid. This lane fixes the first habit at each live site and GP4's bare pid. R-2023 and R-2300 stay with launch-limits-identity.
2. **No deterministic guard in this lane (the critic's point, decided).** A check that every test child limit comes from a named constant fails the subtraction test:
   - It checks form, not adequacy. Two live misses were already named limits: `TREE_DEADLINE_MS` (2.5 s, `post-edit-hardening.test.mjs:98`) and the sealed hook bounds behind R-2671 and adoption-reader. A named 800 ms passes such a check.
   - It is not narrow. Test files hold 168 inline `timeout: N` options and 65 inline `setTimeout` limits across about 40 files (planner's grep). A repo-wide check needs a 40-file sweep or a baseline file, a new artifact with its own maker and reader (2026-10-22 ruling).
   - Narrowed to this lane's sites, it duplicates the seal tests below.
   - The deterministic remedies that do see adequacy are a floor on test child limits or a Windows time scale. Both are policy, so both go to the owner (Known limits, last line).
3. **Every changed check prints what it saw.** R-2546, R-2619 and R-1701 printed no detail when they failed, so their causes are inferred. Each changed check gains a failure detail, as `test-runner-parallel.test.mjs:40` does: per-file label, cause and seconds for R-2546; the failing entry, status and stderr tail for R-2619; the alive, ended, survived, settled and delay values for R-1701. No row; it shows in the diff.
4. **Late starts and late releases live in the fixture body**, as R-2668 puts its skew in `meetingFixture` (`test-runner-parallel.test.mjs:141`). Each records its measured delay, and each row asserts that delay, so a dropped delay fails.
5. **Run alone, two files, reasons by constant name.** `hook-deadlines.test.mjs` and `adoption-reader.test.mjs` join the list. Each reason names the hook-producer constant behind its bound (`HOOK_DEADLINE_MS`, `HOOK_PRODUCER_TIMEOUT_MS`, `packages/nana-setup/lib/hook-producer.mjs:23`, `:28`), so retuning changes no code. The critic's "WHEN the suite runs with more than one job" is dropped; the row states only the list.
   - Cost, named: hook-deadlines took 31.7 s and 32.0 s on two passing Windows legs; adoption-reader 4.4 s. Run alone, they add about 36 s to every full parallel run, on every platform, local runs included. Against that: one failure each in 78 legs after the land.
6. **Seals only where a row of this lane owns the constant.** sources-file's and writing-injection's new limits are named with "chosen" provenance but not sealed. Sealing them would add seal tests to existing rows (R-2370 to R-2372, R-2500) in files another lane edits now.
7. **Out of the research's leave-out list, one comes in.** writing-injection's runCase child guard (`writing-injection.test.mjs:121`, inline `timeout: 5000`) is a one-line inline limit of the same kind; it failed once (run 39712602777). requirements-deliverables' 10 s git limit is the same kind but already named (`requirements-deliverables.test.mjs:43`), and artifact-readers edits that file now; it stays out, as a known-bug line. R-1713 (unknown cause), R-1984 (a machine-dependent doctor row), the README rehearsal retry (network) and the review-lock bug (product code) are not limits of this kind.
8. **worker-lane changes its shared launcher once.** `run` at `worker-lane.test.mjs:72-75` gets the named poll and child limit, so R-2619 and every other caller of `run` launch sampler-free. Checked: no caller asserts poll lines; the ceiling case (`:624`, `--max-secs 1`) still fires, because pi-watchdog's timer is `min(poll, time left)` and the ceiling check runs before a sample (`packages/nana-pack/bin/pi-watchdog.mjs:215`, `:221`, `:235`); `--poll invalid` at `:89` is still ignored as a second occurrence (`pi-watchdog.mjs:101-103`). `launchTogether` (`:577`) keeps `--poll 0.1`; it has no child limit, so it cannot fail on time.
9. **The sampler shim moves to a shared helper** (2026-10-22 ruling: its second caller imports it). brief-check's shim writing (`brief-check.test.mjs:63-67`), PATH resolution (`:69-71`) and first-on-PATH comparison (`:119-123`) move to a new `packages/nana-pack/tests/slow-sampler.mjs`. Its form follows `packages/nana-pack/tests/fake-pi.mjs`. brief-check keeps its constants and its env; R-2670 keeps its text and title. A new module, not `process-tree-helper.mjs`, because launch-limits-identity is expected to edit that file.
10. **R-1701's cleanup reaps the shell pid only when the check did not see it end.** Today `reapTree([levelA, levelB, shellPid])` (`post-edit-hardening.test.mjs:334`) can kill a process that reused the ended shell's pid. No row: pid reuse cannot be forced in a test. It shows in the diff.
11. **R-1242: the observed miss was the held wait.** The 2026-10-23 log reads "contend: run1 never reached its rendezvous" (`logs/120206854751.log`), the test's 4 s wait at `mutation-runner.test.mjs:1327`. The probe's own 4 s wait (`:133`, read at `:153`) is the matching one. One named wait serves both, passed to run1 as `NANA_TEST_WAIT_MS` as R-1775's case does (`:422`, `:451`). The row's case delays both, so each old wait fails.
12. **adoption-reader.test.mjs is not edited.** adoption-window adds tests there now. The research's "elapsed time in the detail" for case "c" is dropped; the hook's stderr is already in that check's detail.

**What the lane does not do:**
- No product change: no runner, hook, watchdog, relay, pi-review, post-edit or knowledge code. `test-runner-config.mjs` gains two list entries only.
- No loosening of a bound a requirement states: R-1700's 2.5 s seal (`post-edit-hardening.test.mjs:273`), R-1779's 30 s and R-1960's 300 s (sealed at `mutation-runner.test.mjs:755-763`), the hook's 4 s deadline and 2.5 s producer limit, R-2484.
- No R-2023, R-2300 or bystander changes (templates-update, project-stale, project).
- No time-scale setting, job-count change, wider run-alone list or retry of failed files.
- No edit to R-1713, R-1984, requirements-deliverables, the README rehearsal, the review lock, or the other exited-process pids (Known limits).

## Must-meet rows (FEAT-031, after R-2670)

Six rows, R-2880 to R-2885, each `untested` then `implemented`. R-2886 to R-2889 stay free. Existing rows keep their text and titles; R-2753's check imports the record limit by name instead of `Number("800")` (`test-runner.test.mjs:611`).

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2880 | WHEN a file in R-2546's record fixture passes after LATE_PASS_MS, the run record shall label it PASS with no cause, and the fixture file that runs past RECORD_LIMIT_MS shall be labelled FAIL with cause `timed out`, in the serial and the two-job run. | `packages/nana-pack/tests/test-runner.test.mjs::R-2880: a record-fixture file that passes after 1.5 seconds is labelled PASS with no cause, and the file that outlives the record limit is labelled FAIL timed out, serial and parallel` |
| R-2881 | WHEN R-1960's bounded-release child starts CHILD_LATE_START_MS late, R-1960's check shall read that child's result. | `packages/nana-pack/tests/mutation-runner.test.mjs::R-2881: R-1960's bounded-release child still reports its result when it starts 3 seconds late` |
| R-2882 | WHEN the first run's probe in R-1242's contend case marks its lock held PROBE_LATE_MARK_MS after it starts and is released LATE_RELEASE_MS after the second run is refused, the second run shall exit 2 and the first run shall exit 0 with its record whole and its lock gone. | `packages/nana-pack/tests/mutation-runner.test.mjs::R-2882: R-1242's contend case holds when the first run marks its lock 5 seconds late and is released 5 seconds after the refusal` |
| R-2883 | WHILE a CPU sampler slower than CHILD_LIMIT_MS is first on PATH, a launch through worker-lane's shared pi-worker launcher whose fake pi holds FAKE_PI_HOLD_MS shall exit 0 without starting that sampler. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2883: worker-lane's launcher runs a fake pi that holds one second to exit 0 without starting a CPU sampler slower than the child limit` |
| R-2884 | WHERE the platform is win32, WHEN the first level of R-1701's checker tree starts TREE_LATE_START_MS late, R-1701's check shall see that tree alive, then see the shell end and the run settle timed out. | `packages/nana-pack/tests/post-edit-hardening.test.mjs::R-2884: with taskkill off PATH and the tree's first level starting 3 seconds late, the shell still ends and the run settles timed out`; Windows-leg-only |
| R-2885 | The run-alone list shall name `packages/nana-setup/tests/hook-deadlines.test.mjs` and `packages/nana-pack/tests/adoption-reader.test.mjs`, each with a reason naming the hook-producer constant behind its load-sensitive bound. | `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2885: the run-alone list names hook-deadlines and adoption-reader, each with a reason naming its load-sensitive hook bound` |

### What each test does, and its red cases

- **R-2880.** In the record fixture (`test-runner.test.mjs:521-531`), `a-pass` sleeps LATE_PASS_MS before printing PASS. `d-timeout` (`:526`, today exactly 5000 ms) sleeps TIMEOUT_FIXTURE_MS, then ends itself. `runRecorded` (`:533`) passes `String(RECORD_LIMIT_MS)`. The check reads both recorded runs. Red:
  - RECORD_LIMIT_MS back to 800: `a-pass` is FAIL `timed out`.
  - The `a-pass` sleep removed: its recorded seconds fall below LATE_PASS_MS / 1000.
  - `d-timeout` ending before the limit: its cause reads `no passing check`.
  - Note for the brief: R-2753 pins the literal "800" at `:611`; it changes to the name. The old 5000 ms sleep would race a 5 s limit; TIMEOUT_FIXTURE_MS removes the race.
- **R-2881.** The bounded-release child body (`mutation-runner.test.mjs:670-685`) opens with an `Atomics.wait` of CHILD_LATE_START_MS and records the delay in its result file. Its guard (`:692`) reads CHILD_LIMIT_MS. R-1960's own check reads the same run. Red:
  - The guard back to 1500 ms: the child is killed and no result is read.
  - The late start removed: the recorded delay is below CHILD_LATE_START_MS.
- **R-2882.** The probe fixture's `rendezvous-lock` branch (`:151-154`) waits `NANA_TEST_START_DELAY_MS` (default 0, so no other case changes) before writing `lockheld-<key>`, and writes `Date.now()` into that mark. The contend case (`:1323-1337`) passes PROBE_LATE_MARK_MS and `NANA_TEST_WAIT_MS: String(CONTEND_WAIT_MS)` in run1's env, waits CONTEND_WAIT_MS for the mark, and writes the release LATE_RELEASE_MS after run2 returns. Red:
  - The held wait back to 4000 ms: "contend: run1 never reached its rendezvous".
  - `NANA_TEST_WAIT_MS` dropped from run1's env: the probe's 4 s default ends first, and run1 is not `GREEN 1`.
  - Either delay removed: the marks' times show less than the named delay.
- **R-2883.** Placed beside R-2619. The check swaps in a fake pi that holds FAKE_PI_HOLD_MS and writes its held time, as `brief-check.test.mjs:54-61` does. It writes the slow sampler first on PATH through the new helper, launches once through `run`, then restores the default stub (`writeStub(mainPosixScript(true), mainNodeBody(true))`, `worker-lane.test.mjs:64`). Red:
  - `run`'s poll back to `0.1`: the sampler marker exists (macOS too, where the sampler is `ps`).
  - The shim placed after the real `ps` or `powershell`: the first-on-PATH comparison fails.
  - The hold dropped: the held time is below FAKE_PI_HOLD_MS.
- **R-2884.** `writeTreeFixture` (`post-edit-hardening.test.mjs:129`) gains a `lateStartMs` option: level A waits that long before writing its pid files and records the delay. The taskkill-off-PATH case (`:279-342`) uses TREE_LATE_START_MS and WIN_TREE_DEADLINE_MS, for the check's `timeoutMs` and its alive wait. The same case prints R-1701's check (unchanged predicate, including `descendantsSurvived`) and R-2884's. Off Windows it prints a SKIP line, as R-1701 does. Red (Windows CI only):
  - The case's deadline back to TREE_DEADLINE_MS: the shell is killed before the tree is seen alive.
  - The late start removed: the recorded delay is below TREE_LATE_START_MS.
- **R-2885.** Beside R-1474 (`test-runner-parallel.test.mjs:491-496`). The check reads RUN_ALONE and imports `packages/nana-setup/lib/hook-producer.mjs` (test roots are layer-exempt, `code-map.config.json`). Red:
  - Either entry missing.
  - A reason that names neither constant.
  - A named constant that hook-producer does not export as a number.

### Seal tests

- `packages/nana-pack/tests/test-runner.test.mjs::seal: the record fixture's per-file limit is 5 seconds, its slow file passes after 1.5 seconds and its timing-out file ends itself after 25 seconds` names R-2880.
- `packages/nana-pack/tests/mutation-runner.test.mjs::seal: the bounded lock children have a 30-second limit and the contend case waits 30 seconds, with a 3-second late child, a 5-second late mark and a 5-second late release` names R-2881 and R-2882.
- `packages/nana-pack/tests/worker-lane.test.mjs::seal: worker-lane's launches have a 30-second limit and poll less often than that` names R-2883.
- `packages/nana-pack/tests/post-edit-hardening.test.mjs::seal: the taskkill-off-PATH case allows 10 seconds and starts its first level 3 seconds late, inside the settle watchdog and the fixture's self-exit` names R-2884. It runs on every platform.

## Tunables

Each is defined once, beside its use, with provenance, as `brief-check.test.mjs:47-53` does. Every other assertion imports the name.

| Name | Value | File | Provenance |
|---|---|---|---|
| RECORD_LIMIT_MS | 5_000 | test-runner.test.mjs | chosen 2026-10-25 (R-2880): 800 ms missed on four Windows first tries, at 08e99dbf, 822286b5, 86c628b9 and 1e77de81; 5 s is above LATE_PASS_MS plus a cold start. Sealed. |
| LATE_PASS_MS | 1_500 | test-runner.test.mjs | chosen: above the old 800 ms, so the old limit fails on every run. Sealed. |
| TIMEOUT_FIXTURE_MS | 5 × RECORD_LIMIT_MS | test-runner.test.mjs | chosen: the runner self-test's ratio, a 3 s limit and a 15 s self-end (`scripts/test.mjs:237`, `:249`). Sealed. |
| CHILD_LIMIT_MS | 30_000 | mutation-runner.test.mjs | chosen 2026-10-25 (R-2881): 1.5 s killed R-1960's child once at d3cf9a0d; matches brief-check's CHILD_LIMIT_MS. Both inline guards (`:692`, `:740`) read it. Sealed. |
| CHILD_LATE_START_MS | 3_000 | mutation-runner.test.mjs | chosen: twice the old 1.5 s guard. Sealed. |
| CONTEND_WAIT_MS | 30_000 | mutation-runner.test.mjs | chosen 2026-10-25 (R-2882): the 4 s held wait missed once (run 39887104509 attempt 2); matches RENDEZVOUS_LIMIT_MS (`test-runner-parallel.test.mjs:53`). Sealed. |
| PROBE_LATE_MARK_MS, LATE_RELEASE_MS | 5_000 each | mutation-runner.test.mjs | chosen: above the old 4 s waits, so each old wait fails on every run. Sealed. |
| CHILD_LIMIT_MS, WORKER_POLL_SECS, FAKE_PI_HOLD_MS | 30_000; 60; 1_000 | worker-lane.test.mjs | chosen 2026-10-25 (R-2883): R-2619 missed its 15 s limit once at 26235c79 (cause inferred: a cold CPU sampler at a 0.1 s poll); the values and rule follow brief-check's (`:50-52`). Sealed. |
| WIN_TREE_DEADLINE_MS | 10_000 | post-edit-hardening.test.mjs | chosen 2026-10-25 (R-2884): 2.5 s missed once at 833bedee (cause inferred); four times the old deadline. R-1700 keeps TREE_DEADLINE_MS. Sealed. |
| TREE_LATE_START_MS | 3_000 | post-edit-hardening.test.mjs | chosen: above the old 2.5 s, so the old deadline fails on every Windows run. Sealed. |
| CHILD_LIMIT_MS | 30_000 | sources-file.test.mjs (`run`, `:36-42`) | chosen 2026-10-25: 10 s missed once at d3cf9a0d, in a run where the file took 83 s. Not sealed. |
| CASE_CHILD_LIMIT_MS | 30_000 | writing-injection.test.mjs (`:121`) | chosen 2026-10-25: 5 s missed once (run 39712602777). Not sealed. TIME_LIMIT_MS (`:346`) stays: it is the "never hangs" bound those checks assert. |
| IMPOSSIBLE_PID | 2_147_483_647 | path-spelling.test.mjs (GP4, `:406`) | chosen: the impossible owner `mutation-runner-takeover.test.mjs:24` uses; GP4 failed once (run 39890246799). GP4 first asserts that probing it throws ESRCH, which pi-review requires (`packages/nana-pack/bin/pi-review.mjs:90-91`). |

## Precedent (verified at 61671be0)

- **Rows in FEAT-031 for other features' tests:** `REQUIREMENTS.md:2608` (R-2667) and `:2611` (R-2670), from win-flake-hardening.
- **Record limit and a self-ending timeout fixture (R-2880):** `scripts/test.mjs:237` and `:249`. Detail argument: `packages/nana-pack/tests/test-runner-parallel.test.mjs:40`.
- **Late start in the fixture body (R-2881, R-2882, R-2884):** `packages/nana-pack/tests/test-runner-parallel.test.mjs:52` and `:141`; the `Atomics.wait` form at `packages/nana-setup/tests/hook-deadlines.test.mjs:54-55`; fixture options at `packages/nana-pack/tests/post-edit-hardening.test.mjs:129`.
- **Child limit and its seal (R-2881, R-2883):** `packages/nana-pack/tests/brief-check.test.mjs:50` and `:137-138`.
- **Rendezvous with a matching probe wait (R-2882):** `packages/nana-pack/tests/mutation-runner.test.mjs:422` and `:451`; the probe reads its wait at `:133`.
- **Sampler-free launches (R-2883):** `packages/nana-pack/tests/brief-check.test.mjs:51-53`, `:63-71`, `:77`, `:119-123`. Helper module form: `packages/nana-pack/tests/fake-pi.mjs`.
- **Windows tree deadline (R-2884):** `packages/nana-pack/tests/post-edit-hardening.test.mjs:98`, the R-1701 case at `:279-342`, R-1700's seal at `:273`.
- **Run alone (R-2885):** `packages/nana-pack/lib/test-runner-config.mjs:58-65`; R-1474's check at `packages/nana-pack/tests/test-runner-parallel.test.mjs:491-496`.
- **Impossible pid (GP4):** `packages/nana-pack/tests/mutation-runner-takeover.test.mjs:24`; `packages/nana-pack/tests/mutation-runner.test.mjs:620`.

Helper moves: the sampler shim, as seat decision 9 says. No other private helper gains a second caller. The `Atomics.wait` late start is one line in each fixture body, not a shared helper; hook-deadlines' preload also records a time origin, so the bodies differ. IMPOSSIBLE_PID is a local constant, because a test file cannot import another test file; its provenance names the takeover constant.

## Overlap with lanes building now

- **knowledge-freeze-notice** edits `sources-file.test.mjs` (new checks, its header's check count). This lane edits only `run` (`:36-42`) and adds no check there. Whichever lands second merges main and re-runs that file.
- **adoption-window** edits `adoption-reader.test.mjs` and reads `hook-producer.mjs`. This lane edits neither file. R-2885 reads `HOOK_DEADLINE_MS` and `HOOK_PRODUCER_TIMEOUT_MS` by name, so a rename there turns R-2885 red at the merge.
- **artifact-readers** edits `requirements-deliverables.test.mjs` and `packages/nana-pack/lib/mutation-runner.mjs`. This lane leaves the first out and edits only the mutation runner's test, not its library.
- **review-texts-durable:** no shared file.
- **launch-limits-identity (sibling, planned):** `pi-launch-limits.test.mjs` and likely `process-tree-helper.mjs`. This lane edits neither.

## Class and builder

Ordinary. The lane changes test files, one new test helper and the run-alone list. It changes no install, uninstall or doctor code, no hook, no pi extension, no gate, and no land or review tool. The test runner's list was classed ordinary by suite-records and win-flake-hardening. It changes nothing under `packages/nana-setup/`, so the local install check does not apply. Ladder: one final reviewer, the roster's.

Builder: the roster's larger builder (`pi-worker --lane-size larger`). About eleven files across three packages, and R-2884 is proven only on Windows.

Windows: push the draft pull request at build 1 and read the Windows leg before the review brief. R-2884's rows and pair need that leg.

## Seat wrong-code pairs to run

Each must turn its row red on every run. Pairs 1 to 9 and 11 run on macOS. Pair 10 runs on a scratch Windows CI push, as earlier Windows pairs did.

1. `RECORD_LIMIT_MS` back to 800 → R-2880 (`a-pass` FAIL `timed out`).
2. `d-timeout` sleeping `RECORD_LIMIT_MS - 1000` → R-2880 (cause `no passing check`).
3. `a-pass`'s sleep removed → R-2880 (seconds below 1.5).
4. R-1960's child guard back to 1500 → R-2881.
5. R-1960's child late start removed → R-2881 (delay check).
6. The contend held wait back to 4000 → R-2882.
7. `NANA_TEST_WAIT_MS` dropped from run1's env → R-2882.
8. worker-lane `run`'s poll back to `"0.1"` → R-2883 (sampler marker).
9. The sampler shim directory placed after the real `ps` on PATH → R-2883 (resolution).
10. Windows: the R-1701 case's `timeoutMs` and alive wait back to TREE_DEADLINE_MS → R-2884.
11. hook-deadlines removed from RUN_ALONE, and separately its reason stripped of both constant names → R-2885.
12. GP4 given `process.pid` instead of IMPOSSIBLE_PID → GP4's ESRCH precondition fails, naming it.

## Docs that change

- `REQUIREMENTS.md`: R-2880 to R-2885 after R-2670 in FEAT-031; R-2753's test column unchanged.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated (the new helper module).
- Known-bug lines the seat closes or narrows in the notes: `docs/known-bugs/FEAT-031.md:97` (worker-lane part; build-records stays), `:108` (R-2546), `:111` (R-1960); `FEAT-003.md:69` (sources-file); `FEAT-013.md:203` (R-2671, now run alone); `FEAT-014.md:81` (adoption-reader "c").
- No README change: `README.md:296` names the list, not its entries.
- Before the final review and the land, the seat runs `requirements-moved --base main` and carries its output in both.

## Known limits (the seat writes them to FEAT-031's file before the final round)

- R-1779's child guard reads CHILD_LIMIT_MS but has no late-start case. Only the seal pins the constant, not that site.
- worker-lane's `launchTogether` and build-records keep `--poll 0.1`. Neither has a child limit that can fail on time.
- Other tests still judge the pid of an exited process: `hook.test.mjs:486`, `mutation-runner.test.mjs:1341-1342`, `review-ledger.test.mjs:794`, `worker-claude.test.mjs:811` and `:872`. None failed in 171 legs.
- sources-file's and writing-injection's limits are named but not sealed.
- requirements-deliverables keeps its 10 s git limit, because artifact-readers edits that file now.
- Running hook-deadlines and adoption-reader alone adds about 36 s to every full parallel run, local runs included.
- The causes of the R-2546, R-2619 and R-1701 failures are inferred; those checks printed no detail. This lane adds the detail.
- R-2884 and its pair are proven only on Windows CI.
- CI re-runs cannot prove the rate fell. The proof is the forced late starts and their wrong-code pairs.
- New tests keep arriving with the same two habits. About 41% of the next flakes may come from checks not yet seen (the critic's estimate). A floor on test child limits, a Windows time scale, or a review-standard line for the two habits are owner calls this lane does not make.
