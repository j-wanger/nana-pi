# launch-limits-identity · adversary pass on the plan draft (main 61671be0)

Counts: 2 MUST, 5 SHOULD, 7 NOTE. Paths are repo-relative. `plt:` is `packages/nana-setup/tests/pi-launch-limits.test.mjs`; `draft:` is `<scratch>/lanes/launch-limits-identity-plan-draft.md`.

Checked and clean. The research logs support the counts. 127 Windows attempts in `<scratch>/winflake/logs` ran R-2023 (111 runs), and 6 failed: 3 before the hardening land and 3 after. Every failure was in run 1 or run 2. Run 1 had three "alive" results and one with no record at all (40160292637/1, `"pids":[]`). Run 2 had two "alive" results. R-2300's one failure (39907491406/1) reads `started:false`, `pids:[1552,8356]` and `elapsed 2220` against `bound 2200`, which is pi plus the relay with no child at 2 s. These file:line claims hold:
- plt `:24`, `:36`, `:54-61`, `:63-66`, `:94`, `:123`, `:135`, `:177-189`, `:180`, `:209`, `:222-234`, `:240-249`, `:274-284`, `:276-282`, `:280`, `:471-487` and `:484`.
- `bounded-spawn-child.mjs:54-57`, `lane-watcher.mjs:86-101` and `:174-176`, `review-round.mjs:93-95` and `:868-886`, `scripts/test.mjs:244-249`.
- `process-tree-helper.mjs:26-35`, `:30` and `:38-44`, `test-runner-parallel.test.mjs:52-53`, `post-edit-hardening.test.mjs:499-501` and `process-tree.mjs:21-25`.
- `docs/known-bugs/FEAT-031.md:99` and `:109`, `FEAT-013.md:131`, and HANDOFF Next item 6.

R-2890 to R-2895 collide with no other lane. The building lanes use the R-2830s to R-2870s, and the sibling plan win-test-limits uses R-2880 to R-2889. `child.kill` after exit sends nothing, because Node drops the handle on exit. The relay returns only after the tree's pipes close or the settle ends (`bounded-spawn-child.mjs:134-144`; pi's child inherits pi's stdio). So a stopped tree cannot beat after the run returns, and the strict "no growth after return" reading adds no flake from a slow tree kill. Pair 8 works on macOS: sh dies, node keeps the pipes, the relay returns after its settle, and pi and its child keep beating. Class ordinary is right, and the local install check is named.

1. **MUST: R-2892 injects a whole reader, so the default reader's own error path never runs, and a reader that fails open on Windows' likely error codes passes every row and pair.**
   - The EBUSY cases replace the reader (draft:95). Only the missing-file case runs the real one.
   - Wrong code that passes: `readBeat = (f) => { try { return fs.statSync(f).size; } catch (e) { if (e.code === "ENOENT") throw e; return 0; } }`.
     - R-2892's injected EBUSY readers still throw past it, and its ENOENT case still throws.
     - Pair 4 (null on error) is caught only through ENOENT.
     - In R-2023 on Windows, an EPERM or EBUSY at both snapshots then reads 0 = 0, "ended". That is the fail-open lookup the critic blocked on, moved into the reader.
   - "At either snapshot before the quiet window ends" (draft:93) also allows retries. A single injected throw followed by a good read would then rightly read ended, and the case as written would fail on correct code.
   - Replace R-2892 with:
     > **R-2892.** IF the judge's size read of a recorded process's beat file fails at either snapshot, THEN the judge shall report that run not ended, naming the record, the failed read and its error code, and shall signal no process. Test: (title unchanged). Cases: the judge's default reader over an injected stat function that throws EBUSY at the first snapshot; the same throwing EPERM at the second; a real missing beat file (ENOENT). One read per snapshot, no retry. Each record's pid is a live bystander that must survive. Red: the default reader returns null, 0 or the last good size on any error code; a missing file read as size 0; no error code in the verdict.
   - Add pair 4b: the default reader rethrows ENOENT and returns 0 on any other code. R-2892's EBUSY and EPERM cases must turn red.

2. **MUST: the fixture's own exit at `HANG_MS` rescues any late judgement, and nothing standing pins "judge each run at once".**
   - The draft admits it (Known limits, draft:175). R-2895's first sum (draft:106-108) is the only guard, and it uses the wrong terms.
     - A leak is seen when the first snapshot comes at least one beat before the earliest self-exit. `QUIET_MS` plays no part. So the red "`QUIET_MS` raised" is not a wrong code: a longer window still sees a beat.
     - What matters is how late the run can return. That is the allowance plus the settle plus the measured stop overrun, `HANG_STOP_MARGIN_MS` (plt:30-31, worst stop 6,714 ms on a 3 s limit). That margin is missing from the sum.
   - Deferred judging, the old structure at plt:276-282, has no pair. With the four runs at 6 s, judging after the last run makes run 4's first snapshot later than its fixtures' self-exit. So a leaky relay passes on every run.
   - Pair 8 catches this only if the seat happens to run it on the final tip. It never runs again after the land.
   - Fix (uses the free R-2896):
     > **R-2896.** The launch-limit judge shall report a record not ended, as judged too late, when its first snapshot comes later than the record's start time plus `HANG_MS` less two `BEAT_MS`. Test: `R-2896: a record whose fixture could already have ended by itself reads judged too late, not ended`. Setup: a record whose start time is `HANG_MS` ago, with a beat file that never grows. Red: the judge ignores the start time; the check uses `QUIET_MS` in place of two beats.
   - Each pid record gains `at: Date.now()`, written in the same line, after the first beat.
   - R-2023's detail prints each record's start offset from its run's start. That also gives the 6 s allowance a measured start spread later, which no pass line prints today.
   - Add a seat pair: R-2023 runs all four launches and then judges. R-2023 must turn red with the correct relay, through run 1's "judged too late".
   - Drop R-2895's first sum and its `QUIET_MS` red, keep the second sum, and remove the Known limit "No test pins 'judge each run at once'".
   - The same rescue applies if the seat takes finding 3's bare-pid design, because a self-ended process reads dead too. The guard stays either way.

3. **SHOULD: the design table leaves out the simplest option, and the measured base rate favours it.**
   - Option: judge each run at once with the existing bare-pid probe. Delete every failure-path kill. Keep the 6 s allowance.
   - Evidence from the same 127 attempts:
     - Judge delay at plt:276-282 is about 12 s for run 1, 8 s for run 2, 4 s for run 3 and 0 s for run 4.
     - Misreads: 3, 2, 0 and 0. So 0 of 254 judgements made within about 4 s of a run's end misread.
   - The failure modes point opposite ways.
     - A bare-pid misread fails closed: a flake, never a pass over a leak.
     - The beat judge's misread, a starved live fixture, is a pass over a leak. The draft names it as its least-sure claim (draft:181-183), and pair 8 cannot test it on Windows.
   - The subtraction drops `BEAT_MS`, `QUIET_MS`, the beat protocol, R-2891, R-2892 and the 8 s of quiet windows.
     - The cost is that a reuse inside the 2 s wait still flakes, measured at 0 of 254.
     - The detail also cannot tell a leak from a reuse (see finding 14).
   - Seat call, default `bare-pid`. If beats stay, put this row and its numbers in the design table so the choice is on record.

4. **SHOULD: the stop request is redundant cleanup that adds a new way to end a leaked process before its judge.**
   - The wrapper cases already end at the relay's own limit, because `launchInstallWrapper` passes `LIMIT_MS: String(HANG_MS)` (plt:174). The R-2023 fixtures end themselves at `HANG_MS` (plt:94). Only the signal-cleanup body holds for 60 s (plt:135, twice).
   - Wrong code R-2023 would pass on: the cleanup runs before the judge, for example in a `try/finally` written the other way round. The leaked processes see the stop within one beat, and the judge reads ended. Only pair 8 at the land catches it.
   - Fix: drop the stop request, R-2893 and the stop-request env name. Set both 60 s holds in the signal-cleanup body to `HANG_MS`. Failure paths then do nothing, which is the "no failure-path kill" decision in its simplest form.
   - If the seat keeps it, the judge must report not ended when the stop request already exists at its first snapshot. Add the pair "R-2023 writes the stop request before judging, with pair 8's mutation; R-2023 red".

5. **SHOULD: R-2890's survival check passes on the `:280` loop unless it waits for the kill to show.**
   - After `process.kill(pid, "SIGKILL")`, the bystander's `exit` event is only queued. A synchronous `exitCode === null && signalCode === null` check right after the cleanup reads null and passes.
   - Fix: spawn the bystander with an IPC channel. After the judge and cleanup, it must answer a ping within `QUIET_MS`. Then end it through its handle.
   - Red: no answer, which means the cleanup signalled it. This works the same on macOS and Windows; Windows exit codes after an outside kill differ from a handle kill, so do not rely on `signalCode` there.

6. **SHOULD: R-2894's row and its test disagree, and the test covers one signal route out of several.**
   - The row allows signals to "a child process it spawned" (draft:102). That permits `process.kill(child.pid, …)`, which the red forbids at `:484`.
   - The source scan sees only `process.kill(`. It misses an import of `killProcessTree` or `killWorkerTree`, and a `spawnSync("taskkill", …)` or `kill` command over recorded pids.
   - The row says "never to another pid read from a fixture record", yet `relayPid` is read from one (plt:197, :477). The exemption is by variable name only.
   - Replace with:
     > **R-2894.** Every `process.kill(` call in the launch-limit test file shall take one of four forms: `process.kill(pid, 0)` inside `processAlive`, `process.kill(-child.pid, …)`, `process.kill(group ? -child.pid : child.pid, …)` or `process.kill(relayPid, …)`. The file shall import no tree-kill helper and start no `taskkill` or `kill` command. Red: the `:280` loop restored; `process.kill(child.pid, …)` at `:484`; an import of `killProcessTree` or `killWorkerTree`; a `taskkill` spawn over recorded pids.
   - Build the scan's patterns so that the check's own source does not match them.

7. **SHOULD: R-2895 says the allowance is "used as the parent-kill and R-2303 start wait", but no test checks that use.**
   - Wrong code that passes: `observeParentKill` keeps `waitFor`'s default `PID_POLL_MS` (plt:180).
   - Fix: `observeParentKill` and R-2303 return `startWait` in their result.
     - R-2130 and R-2131 assert it equals `START_ALLOWANCE_MS` on macOS.
     - R-2300 and R-2303 assert the same on Windows.
   - Add a pair: `observeParentKill` keeps `PID_POLL_MS`. R-2130 and R-2131 must turn red on macOS.
   - The other way out is to narrow R-2895's sentence to the constant and its second sum.

8. **NOTE: the overlap list is incomplete.**
   - The sibling plan win-test-limits closes `docs/known-bugs/FEAT-031.md:97`, `:108` and `:111` and `FEAT-013.md:203`. It adds R-2880 to R-2889 to `REQUIREMENTS.md`, and it regenerates the tree and the map. This lane writes FEAT-013 known limits and retires FEAT-031 lines.
   - All four building lanes touch `REQUIREMENTS.md` and `docs/requirements-tree.md`, not only adoption-window.
   - review-texts-durable adds a FEAT-031 line, "R-2023 failed again at 61671be0 … a planned lane takes its pid check". This lane should retire that line too.
   - knowledge-freeze-notice adds a doctor row after `knowledge index`. `timedDoctor` finds `pi executable` by label, so R-2023 is unaffected.
   - Merge main and re-read these lines before the final round.

9. **NOTE: the judge's wait must be synchronous, or R-2023 overruns the case limit.**
   - `CASE_LIMIT_MS` is 9 + 5 + 1 = 15 s (plt:35). R-2023 grows to about 36 s.
   - A synchronous case cannot time out, because the race resolves before the timer runs. An `await sleep(QUIET_MS)` between runs lets the 15 s timer fire, and the result is "case exceeded".
   - Say in the brief that the judge waits with `sleepSync`, as `waitDeadSync` does (plt:72-76). R-2891 and R-2893 fit inside 15 s either way.

10. **NOTE: three citations are off.**
    - The detail check's format is `steps.mjs:1130` and `:1136` only for install and the dry run. R-2023's run 3 is doctor, whose text is at `doctor.mjs:368`. Name both.
    - 40160292637/1 recorded no process at all, not "three processes could not start". Pi's own Node process did not write its record inside 3 s.
    - `killWorkerTree` (`process-tree-helper.mjs:38-44`) uses `child.kill` on POSIX only. On Windows it runs `taskkill /T /F` on the child's pid, so it is a half precedent for R-2303's `child.kill`.

11. **NOTE: the provenance and time lines need fixing.**
    - `QUIET_MS` "equals the old 2 s end wait, so each judgement costs what the probe cost" (draft:118) is false. `waitDeadSync` returns as soon as every pid reads dead, so a passing judgement cost about 0 s. The draft's own time line adds 2 s per run.
    - `BEAT_MS` "answers the bare-pid misreads" (draft:117). The 20-to-1 ratio answers a late timer; the misreads are answered by the beat design as a whole.
    - R-2023 also grows by about 20 s on macOS (12 s more launch time plus 8 s of windows). Only Windows is stated.

12. **NOTE: two values are inline.**
    - "Two quiet windows" is a tunable with no name (draft:120). The file's own precedent names a derived bound: `CLEANUP_DELAY_MS = 2 * RELAY_PARENT_POLL_MS` (plt:34). Name it, with `chosen` and the reason, or drop it with finding 4.
    - The bystander's lifetime in R-2890 and R-2892 should read `HANG_MS`, not a literal.

13. **NOTE: the fail-closed rule has two holes, and R-2891 covers only one mode.**
    - A record with no `beat` name, or one naming a file outside the beat folder, must read not ended. Skipping such a record is an honest slip that the draft's rules do not forbid.
    - R-2891 starts only child mode. A body that sets up its beat timer in the child branch alone passes every row, because pair 8 catches the leak through the child. Run R-2891 in pi mode as well, naming both records. Red: the pi branch beats once.

14. **NOTE: the cause stays inferred unless the detail records the bare-pid probe.**
    - Add `processAlive(pid)` beside each record's two beat sizes in R-2023's failing detail. It is a diagnostic only and stays out of the verdict.
    - "Beat stopped, pid alive" then shows a reuse, and "beat grew" shows a leak. R-2894's scan already allows the `pid, 0` probe.
    - Without it, the next failure after the lane cannot tell a starved fixture from a leak. That is the draft's least-sure claim.
