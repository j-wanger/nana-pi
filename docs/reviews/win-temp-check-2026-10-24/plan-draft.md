# Plan draft: wcf (Windows hard-kill temp check)

Feature: FEAT-006 · Launch builders with execution limits
Base: main at 122d795e. Planner: read-only pass; nothing run on Windows.

## 1. Root cause

Verdict: the fault is in the test, not the watcher (inferred, strongly supported). The three hard-kill
tests check that the whole case temp folder is empty. That folder is also TEMP for pi-worker's Windows
CPU sampler, and Windows PowerShell writes two policy-test files there at every start. `taskkill /F /T`
sometimes kills PowerShell between writing and deleting them. No failure line ever named the leftover
entry, so the exact entry is inferred.

Evidence, read:
- The test is wider than the rows. R-2721 and R-2722 promise only "no file or folder *of the lane's*" /
  "the lane's temp files" (REQUIREMENTS.md:562-563). The tests assert `fs.readdirSync(root).length === 0`
  (worker-claude.test.mjs:177, used at :751, :789, :885).
- The case root is TEMP, TMP and TMPDIR for pi-worker and everything it starts (worker-claude.test.mjs:176, :736, :783, :871).
- pi-worker's watchdog samples builder CPU on every poll (pi-watchdog.mjs:241) via
  `execSync("powershell -NoProfile -Command ...")` with the inherited env (pi-watchdog.mjs:150). The tests run
  `--poll 0.2` (worker-claude.test.mjs:162, :870), so pi-worker almost always has a cmd.exe + powershell.exe
  child alive (inferred: a PowerShell start costs far more than 200 ms on a runner).
- `taskkill /PID <worker> /T /F` (process-tree-helper.mjs:34; called at worker-claude.test.mjs:746, :787, :879) kills that PowerShell mid-run.
- The only failing tests are the three Windows cases that tree-kill a pi-worker at 0.2 s polling and check
  the whole root. R-2721 (:769-772), R-2722 both owners (:774-794) and R-2728 alpha (:879). In ~20 Windows suite runs since
  2026c012 (≈80 such kills) three failed, about 4% per kill. R-2725 kills at `--poll 60` and checks no emptiness. R-2692 and
  R-2724 check emptiness, but their PowerShell is never killed, and they have not failed.
- Every failure shows everything else held: `watcherGone:true`, and in R-2721 and R-2728 `lock:false`.
- The repo already named this risk on 2026-10-18 (docs/reviews/win-review-tests-2026-10-18/seat-audit-1.md:150).

Why not the watcher (read, with inference marked):
- The "test checks too early" framing is ruled out. The test judges only after the watcher process is gone
  (worker-claude.test.mjs:748-751, :788-789, :884-885). The watcher's removal is a synchronous `fs.rmSync`
  (lane-watcher.mjs:114) before `watchLane` returns and the child exits (lane-watcher-child.mjs:27-31).
- The watcher did reach removal. `lock:false` in R-2721 and R-2728 means `releaseLaneLock` ran, and it
  follows `removeLaneFolder` (lane-watcher.mjs:183-185). For a direct Windows launch, release also needs
  `waitForExit(builder)` true (:170-171), so the builder was already dead when removal began.
- No surviving process holds a lane-folder handle. pi-worker and the builder are dead. cmd.exe and
  PowerShell run in the worktree and write to the root, not the lane folder (pi-watchdog.mjs:150, no cwd/env).
- Node 22's removal retries EBUSY/EPERM/ENOTEMPTY/EMFILE/ENFILE with `sleep(i*retryDelay)`, so about 1.5 s per
  stuck entry under the sealed 5 x 100 ms (worker-config.mjs:16-19). Read from Node v22.22.2's internal
  rimraf; CI runs v22.23.4. libuv opens files with share-delete, so a lingering Node handle should not block (inferred).
- pi-worker's normal-path removal has no retries at all (pi-worker.mjs:367), and it removes the folder within ms
  of the builder exiting. It has never failed on Windows in R-2692 or R-2724. If AV or late handles were holding
  lane files, that path would fail first (inferred).
- Inferred, high confidence, settled by R-2805: Windows PowerShell 5.1 checks its AppLocker policy at start by
  writing `__PSScriptPolicyTest_<random>.ps1` and `.psm1` to `GetTempPath()` (TMP, then TEMP). It deletes
  them in a `finally`, which a hard kill skips.

## 2. The fix (test-only; no product code, no product tunable changes)

The smallest fix brings the three tests in line with their rows. They count every entry left in the case folder,
except, on win32 only, files whose whole name is PowerShell's policy-test name. Every judgement names what it saw.
- New test helper module `packages/nana-pack/tests/temp-leftovers.mjs` (six-tag header, named exports):
  - `POWERSHELL_POLICY_TEST_NAME`: an anchored pattern, `^__PSScriptPolicyTest_[^\\/]+\.psm?1$`. Provenance:
    "contract: Windows PowerShell 5.1 AppLocker start-up test files; names confirmed by R-2805 on CI <date>".
  - `toleratedName(name, { platform })`: the name test, true only on win32.
  - `caseTempLeftovers(root, { platform, readdir })` → `{ counted: [...], tolerated: [...] }`, sorted. It uses `withFileTypes`;
    only a file can be tolerated, never a folder.
  - `caseTempNote(label, result)` → one `note:` line naming the tolerated entries, or null.
- worker-claude.test.mjs: `hardCase` (R-2720/R-2721), the R-2722 loop and the R-2728 block replace `tempEmpty(root)` with
  the helper. Each observation carries `counted` and `tolerated`; its pass needs `counted.length === 0`.
  A pass with tolerated entries prints the note. Leave R-2692, R-2723 and R-2724 alone; their PowerShell is not killed mid-run.
- Product tunables: none change. The watcher's retry tunables and seals stay. New test-only values are marked
  `// test-only:` as in lane-watcher.test.mjs:15: R-2805's event settle wait, chosen with a reason.
- Known bugs (docs/known-bugs/FEAT-006.md:117): replace the line with two residuals.
  - A Windows hard kill during a CPU sample can leave PowerShell's two policy-test files in the user's OS temp folder.
    They are PowerShell's files, not the lane's, and R-2805 measures them.
  - `watcherLimit` (worker-claude.test.mjs:716) counts 5 x 100 ms of retries where Node sleeps 1.5 s per entry.
    This did not cause the failures, since every failing case showed `watcherGone:true`.
- Not built (alternative): pass the lane folder as TEMP/TMP to the sampler's PowerShell when `captureRoot` is set
  (pi-watchdog.mjs:150). The watcher would then sweep PowerShell's files and the strict whole-root check would stand.
  It changes pi-watchdog, the engine behind pi-review, which raises the lane class. It is a separate product lane if
  the owner wants no PowerShell residue in the OS temp folder.
- Contingency: suppose a counted `nana-lane-preamble-*` entry ever appears in a R-2804 detail. Then the product leak is
  real, and a product lane is needed. On win32, when the first `rmSync` throws, the watcher removes again after a wait.
  Its row would use an injected remover on macOS, with two new sealed tunables (passes, wait).

## 3. Must-meet rows (R-2803 to R-2805 are free on main at 122d795e; R-2802 is the last row)

| ID | Row | Test (file::title) | Red cases |
|---|---|---|---|
| R-2803 | WHEN a hard-kill test judges a case temp folder, it shall count every entry left there, except, where the platform is win32, a file whose whole name is Windows PowerShell's policy-test name (`__PSScriptPolicyTest_`, a random part, then `.ps1` or `.psm1`). | worker-claude.test.mjs::`R-2803: the hard-kill temp check counts every entry in a case temp folder except, on win32 only, Windows PowerShell's policy-test files` (runs on every platform; injected `platform` over a real planted folder) | Not counted on win32: a `nana-lane-preamble-x` folder or a `pi-review-x` folder. Tolerated on darwin: a policy-test-named file. Tolerated on win32: `x__PSScriptPolicyTest_a.ps1`, `__PSScriptPolicyTest_a.ps1.bak`, `__PSScriptPolicyTest_a.txt`, or a folder named `__PSScriptPolicyTest_a.ps1`. Counted on win32: a `__PSScriptPolicyTest_lvnwlq0m.dy0.ps1` or `.psm1` file. An empty folder returns anything. |
| R-2804 | WHEN a hard-kill case's temp check fails, its FAIL detail shall name every counted and every tolerated entry, and WHEN it passes with tolerated entries, the test shall print one note line naming them. | worker-claude.test.mjs::`R-2804: a hard-kill case's FAIL detail names every counted and tolerated entry, and a pass that tolerated entries prints one note naming them` (injected platform, planted folder) | The detail omits a counted name or a tolerated name. A pass with tolerated entries prints no note, or two. A pass with nothing tolerated prints a note. |
| R-2805 | WHERE the platform is win32, a Windows PowerShell started with `-NoProfile` and TEMP and TMP set to an empty folder shall create at least one file there, and every file it creates shall have a name the temp check tolerates. | worker-claude.test.mjs::`R-2805: Windows: a PowerShell started as the CPU sampler starts it creates policy-test files in its TEMP, all tolerated by the temp check` (SKIP off win32; `fs.watch` on the folder, async spawn of `powershell -NoProfile -Command exit`, collect created names, print them in a note) | No creation is seen: the premise is refuted, so the tolerance must go and the lane must stop. A created name fails `toleratedName`: the pattern is too tight, or PowerShell writes another file kind. |

The wiring has no row of its own, since R-2721, R-2722 and R-2728 judging through the helper is visible in the
diff. The seat reads it in the diff and in the PR's Windows leg. Those three rows keep their text and tests.

## 4. Precedent

- Helper module with an injected platform and its header: packages/nana-pack/tests/process-tree-helper.mjs (`killWorkerTree`, `windowsLaneWatchers`).
- Unit check of a test helper with an injected platform, inside a consumer test: packages/nana-pack/tests/build-report.test.mjs:112-120 (R-2667).
- Windows-only check that SKIPs elsewhere: packages/nana-pack/tests/worker-claude.test.mjs:769-772 (`check(..., skipped)`, :72).
- `note:` line: packages/nana-pack/tests/worker-claude.test.mjs:714.
- Case root and its emptiness check being replaced: packages/nana-pack/tests/worker-claude.test.mjs:175-177.
- The PowerShell start R-2805 mirrors: packages/nana-pack/bin/pi-watchdog.mjs:147-156. R-2805 starts its own `powershell -NoProfile`
  rather than importing `cpuSeconds`, which is unexported and sits in a review-tool module. Departure: a mirrored launch shape.
- `fs.watch`: no precedent in the repo, since no test has needed directory events. Follow Node's `fs.watch` docs (win32 gives file names).
- The earlier written risk: docs/reviews/win-review-tests-2026-10-18/seat-audit-1.md:150.
- Known-bug line to replace: docs/known-bugs/FEAT-006.md:117.

## 5. Class

Ordinary lane. The AGENTS.md review ladder (AGENTS.md:94) names install, uninstall or doctor, Claude Code hooks, pi extensions,
the nana-gate policy, and `nana-land`, `pi-review`, `claude-review` and `review-round`. It does not list pi-worker. In any case,
this lane changes no product file. It touches two test modules, REQUIREMENTS.md and one known-bug file. The 2026-10-10 Windows
ruling still binds. Push the branch to a draft PR and read the Windows suite leg before the final review, because R-2805 and the
three hard-kill cases run only there. The rejected alternative in section 2 would edit pi-watchdog, behind pi-review, and would
likely raise the class (inferred).

## 6. Threat model

Honest variation in our tools' output and environment is in scope: Windows file locks, slow or loaded runners, antivirus
scans, PowerShell's own start-up files, and process-kill timing. Deliberate forgery is out. A planted file that mimics
PowerShell's name to hide a leak is a forgery and a residual.

## 7. The claim most likely wrong

The leftover entry was PowerShell's policy-test file. No failure line ever named it, so this is inferred from code paths and from
which tests failed. R-2805 tests the premise on the PR's Windows leg, and R-2804 makes any later failure name its entry. If a
`nana-lane-preamble-*` folder ever shows up as counted, the product leak is real, and the contingency in section 2 applies.
