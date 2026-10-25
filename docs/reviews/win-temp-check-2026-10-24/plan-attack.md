# wcf plan attack (adversary, main 122d795e, 2026-10-24)

Counts: 2 MUST, 4 SHOULD, 7 NOTE. Line numbers are worker-claude.test.mjs unless named.

1. **MUST: R-2805 passes vacuously and does not mirror the sampler.** Under the seat's change, a mutant that starts no PowerShell, or a watcher that delivers no event, stays green: nothing seen means everything seen is tolerated. Only the note's content differs, and the red case asks only that a note exists. The draft (§3) also starts `-Command exit`, while the killed process runs `(Get-Process -Id N).TotalProcessorTime.Ticks` (pi-watchdog.mjs:150), which also autoloads a module. Replace the R-2805 row and red cases with:
   - **R-2805.** WHERE the platform is win32, WHEN Windows PowerShell runs the CPU sampler's command for a live pid (`powershell -NoProfile -Command "(Get-Process -Id <pid>).TotalProcessorTime.Ticks"`) with TEMP and TMP set to an empty watched folder and exits 0, every file it created there shall have a name the temp check tolerates. Test: `R-2805: Windows: every file the CPU sampler's PowerShell command creates in its TEMP is tolerated by the temp check` (SKIP off win32). After PowerShell exits, the test writes a probe file in the folder. It judges only once the watcher has reported the probe, then prints one note naming the PowerShell files it saw, or `none`. Red cases:
     - a created name fails the tolerance;
     - PowerShell fails to start or exits nonzero, and the test passes;
     - the probe's event does not arrive within the case limit, and the test passes;
     - the note is missing.
   - Why a probe: ReadDirectoryChangesW reports events in order, so the probe's event proves that every earlier PowerShell event was delivered. A fixed settle wait could not prove that. The probe also replaces the draft's chosen settle tunable.

2. **MUST: R-2803 and R-2804 are wider than their tests.** Each test runs the helper over a planted folder with an injected platform. The rows instead claim what "a hard-kill test" judges and what "a hard-kill case's FAIL detail" holds. No planted-folder test can show that wiring. Example: a mutant that reverts `hardCase` (:751) to `tempEmpty` is green on macOS and on every Windows run that leaves no PowerShell file. That breaks the standard "row no wider than its test" and lets an unpinned claim read as covered. Also, "one note line" is ambiguous: R-2722 (:774-794) judges two folders in one check. Replace with:
   - **R-2803.** WHEN the hard-kill temp check judges a folder, it shall return as counted every entry there, except, where the platform is win32, a file whose whole name is Windows PowerShell's policy-test name (`__PSScriptPolicyTest_`, a random part, then `.ps1` or `.psm1`), which it shall return as tolerated. (Keep the test title and red cases, plus item 5.)
   - **R-2804.** WHEN the hard-kill temp check judges a folder, its result shall name every counted and every tolerated entry, and its note shall be one line naming every tolerated entry, or absent when none is tolerated. Test: `R-2804: the hard-kill temp check's result names every counted and tolerated entry, and its note is one line naming the tolerated entries or is absent`. Red cases:
     - the result omits a counted or a tolerated name;
     - with tolerated entries, the note is absent, holds a line break, or omits a name;
     - with nothing tolerated, a note is present.
   - Add to Seat decisions: "The three hard-kill checks put the check's result in their observation unchanged, and print each judged folder's note when present. This wiring shows in the diff and has no row."

3. **SHOULD: a simpler test-only fix exists; this is the seat's call.** pi-watchdog takes its first sample only after `min(poll, time left to the ceiling)` (pi-watchdog.mjs:215-222, :241). The sampler is the only PowerShell launch in the pack's bin and lib (grep). So starting the killed worker with `--poll 60`, as R-2725 already does (build-report.test.mjs:135, never failed), means no PowerShell is in the tree when the kill lands (kill by about 13 s, ceiling 30 s). That keeps the strict whole-folder check and adds no helper, pattern, contract value or file-watch test. Trade: the tests no longer kill mid-sample, as about 70% of real Windows kills do (inferred), and passing runs show no PowerShell files, which removes the positive evidence R-2804's note gives. Replacement decision text, if taken:
   - "Test-only fix: the killed pi-worker in R-2721's case, the R-2722 loop and R-2728's alpha starts with `--poll 60`, longer than its 30 s ceiling, so no CPU sample runs before the kill. The strict whole-folder check stays, and each observation names the folder's entries."
   - Under that fix, R-2803 and R-2805 drop. R-2804 becomes "WHEN a hard-kill case judges its temp folder, its observation shall name every entry left there."

4. **SHOULD: two test titles become false.** :771 "leaves no temp file" and :793 "the temp folder empty" would pass with tolerated files present. Retitle both tests, and the matching evidence cells (REQUIREMENTS.md:562-563), to:
   - `R-2721: Windows: taskkill /F /T of pi-worker's tree while a directly launched builder runs leaves none of the lane's temp files, no lane lock and no watcher`
   - `R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, none of the lane's temp files and no watcher`

5. **SHOULD: R-2803 has no mixed-folder red case.** The listed red cases never put a tolerated file and a counted entry in one folder, so a helper that stops counting after its first tolerated match would pass. Add the red case: "on win32, a folder holding `__PSScriptPolicyTest_lvnwlq0m.dy0.ps1` and a `nana-lane-preamble-x` folder returns the lane folder as tolerated, or drops either name."

6. **SHOULD: no rule for an empty R-2805 note.** The must-meet says the seat reads the note, but not what follows when it names no policy-test file. Add to Seat decisions: "If R-2805's note on the pull request's Windows leg names no policy-test file, the premise is unconfirmed. The seat stops the lane before the final review and drops the tolerance."

7. **NOTE: the root-cause evidence is weaker than stated; the lane still fails safe.**
   - `lock:false` shows only that the watcher reached removal, not that removal worked. Removal errors are swallowed (lane-watcher.mjs:113-115), and the lock is released anyway (:185).
   - R-2722's failing case was the live owner (run 40105506993 attempt 1, job 120906245841: `{"owner":"live",...,"gone":true,"empty":false}`). That case is a claude.cmd builder launched through cmd.exe, so the watcher did not wait for it (lane-watcher.mjs:171). "The builder was dead before removal" therefore covers only R-2721 and R-2728 (run 40107395869).
   - Any lane folder left behind is still counted, so a wrong root cause shows as a named FAIL.
   - Replace "in two the lock released, which happens after the folder removal" with: "in R-2721 and R-2728 the directly launched builder had exited before removal began; R-2722's failing case ran its builder through cmd.exe, and the watcher does not wait for that builder."

8. **NOTE: attack 1, other writers, checked; none found.**
   - Only the sampler starts PowerShell. cmd.exe, Node, the fake pi and the fake claude write nothing into the case folder: their pid, record and copy files go to the fixture root (:64-71, :733, :778, :868).
   - The watcher appends the ledger in the common dir. It runs git after removal and is never killed (lane-watcher.mjs:183-184).
   - The test's watcher-query PowerShell inherits the test's TEMP, not the case folder (process-tree-helper.mjs:22).
   - Windows Error Reporting does not run on TerminateProcess.
   - Every `tempEnv` case puts `nana-lane-preamble-*` in the case folder, with the capture `pi-review-*` inside it (pi-worker.mjs:172, :366). R-2728 puts two lane folders there.
   - No lane or watcher file name can match the anchored pattern.
   - A full PowerShell run leaves nothing: review-ledger.test.mjs:164-172 judges a sampled TEMP strictly and passes on Windows.

9. **NOTE: attack 3, which PowerShell.** pi-watchdog runs `powershell` through cmd.exe (an execSync string). On windows-latest that resolves to Windows PowerShell 5.1 in System32; pwsh is never started. Microsoft's App Control page (PowerShell 7.6 docs) documents the same `$Env:TEMP/__PSScriptPolicyTest_<random-8dot3-name>.ps1` and `.psm1` for PowerShell 7. The names hold for both, so the provenance can cite that page instead of "inferred". R-2805 must start `powershell`, never `pwsh`. Tightening the pattern to `^__PSScriptPolicyTest_[a-z0-9]{8}\.[a-z0-9]{3}\.psm?1$` (the documented 8.3 shape) is optional, because honest variation gains nothing either way.

10. **NOTE: watching the folder on Windows.** fs.watch (ReadDirectoryChangesW) gives names for a create and a delete. The repo has no fs.watch precedent. Close the watcher before removing the folder. Wrong-code pairs for R-2805 can run only on a Windows leg; name that in the pairs plan.

11. **NOTE: the known-bug wording.** "They are PowerShell's files, not the lane's" reads as a dodge: our sampler's PowerShell leaves them, and pi-review shares the sampler. Replacement for FEAT-006.md:117: "pi-watchdog's Windows CPU sampler (pi-worker and pi-review): a tree kill that lands mid-sample can leave PowerShell's two small policy-test files in the user's temp folder; the hard-kill tests tolerate exactly those names."

12. **NOTE: the code map and wording.**
    - Test helpers are mapped (docs/code-map.md lists process-tree-helper.mjs), so the new module needs `npm run map` before the land.
    - Add process-tree-helper.mjs:22 to Precedent: it is the existing test that starts `powershell -NoProfile`.
    - "R-2692, R-2723 and R-2724 ... their PowerShell is never killed": R-2723 is POSIX-only and runs no PowerShell. Say "R-2723 runs off Windows only."

13. **NOTE: the owner's pick.** The owner picked "the Windows cleanup timing fix". This lane changes the test's judgement instead and keeps a product leftover as a known bug. Say so in the owner report.
