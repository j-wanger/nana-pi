MUST: 3

**MUST 1. Lane 3's must-meets depend on the runner's TEMP spelling, and they miss case-different spellings, which the same code also gets wrong.**
- GP1 fails without the product fix only because the GitHub runner's TEMP happens to be the 8.3 form `RUNNER~1`, and it runs only on the non-blocking Windows leg. If that TEMP spelling changes, GP1 passes with the product fix removed.
- The same code also breaks on paths whose letter case differs from the on-disk name. I confirmed this on macOS in a scratch repo:
  - `outInTree(root, ".../TMP/.../caserepo/tracked.txt")` returns `null`, so the tracked file is not refused. The correctly cased path is refused.
  - `treeScope` gives two repo keys for one repo: `git:/private/tmp/.../CaseRepo/.git` and `git:/private/TMP/.../caserepo/.git`.
  - The cause: JS `realpathSync("/users/OWNER/nana-pi")` keeps the typed case. `realpathSync.native` and `git rev-parse --show-toplevel` both return `<repo>`.
  - On macOS, `process.cwd()` is already canonical, so this needs an absolute `--out`, `--main` or `--tree` typed in the wrong case. GP2 ("POSIX path untouched") keeps this R-724 overwrite and the R-705 key split live on macOS.
- On Windows (inferred), `path.win32.relative` ignores case, so `relUnder` handles case differences but not 8.3. The plain string comparisons do break on a lowercase drive-letter working folder: `nana-land.mjs:71` and `:148`, `review-round.mjs:163`, `pi-review.mjs:118`. Lane 3's fix covers that input, but nothing pins it.
- Prior art for both halves:
  - `win32-launch.test.mjs:310-337` already builds a case-flipped path and a ShortPath through the Windows FileSystemObject, with a declared SKIP when the volume has no 8.3 names.
  - `mutation-runner.mjs:168,187-188,377` and `adoption.mjs:69` already call `realpathSync.native` on every platform.
- Fix:
  - Add GP3: build the other spelling explicitly instead of relying on TEMP. Use a case flip on both platforms, plus a ShortPath probe on Windows with a SKIP when no 8.3 name exists. Run it against a tracked `--out`, `--main`/`--tree`, the repo key and reclaim.
  - Use one canonical-path function on all platforms, so GP3 also runs on the blocking macOS leg.
  - If Jake keeps POSIX untouched, record the macOS R-724/R-705 residual by name.

**MUST 2. The autocrlf fix in land.test hides a bug that blocks every Windows land of nana-pi, and the R-708 status is not updated.**
- `review-round.mjs:181-186` and `:223` hash the working tree's raw bytes. They take the file mode from the owner-execute bit.
- On Windows, Node's `stat` never reports an execute bit; libuv's stat sets only read and write bits. nana-pi has 10 committed 100755 files, including `nana-land.mjs`, `pi-review.mjs`, `pi-worker.mjs`, `review-ledger.mjs` and `nana-setup.mjs`.
- So a clean nana-pi checkout on Windows records `sha+snap:…` (inferred from the code). `nana-land.mjs:91` requires `r.revision === <plain sha>`. Every land of nana-pi from a Windows seat would therefore refuse with "no verified version-2 LAND review".
- KB1 has the same effect on any repo with no eol attribute under Git for Windows' default `core.autocrlf=true`. The Windows run 5 log already shows this: land.test check 273 recorded `+snap` for a clean linked worktree.
- The plan's `core.autocrlf false` in `repo()` removes the only Windows signal of this. After that, "land 51/51 on Windows" reads as "nana-land works on Windows". R-708 ("snapshot null on a clean tree") stays marked implemented while it is violated on Windows.
- Fix:
  - In the lane that adds autocrlf=false, mark R-708 violated on Windows with the residual.
  - Make KB1+KB2 its own gate lane before the Windows leg turns blocking. The alternative is that the R-684 Support line says nana-land is unsupported from a Windows seat.
  - Reword the HANDOFF line. The bug affects any Windows user of pi-review on nana-pi, not just Jake landing from Windows.

**MUST 3. The tag clause in TR2 can never fail on CI.**
- The v0.6.0 tag exists in CI's full-history checkout. No named check exercises the "missing tag → FAIL" branch, so TR2 passes with that feature removed.
- The real failure at `:209` was also a bad path (`/D:/…` passed to `git -C`), not a missing tag.
- Fix (either):
  - drop the clause, since the path fix removes the mislabelled skip; or
  - pin it: when `NANA_TEST_REQUIRE_COPIER=1`, any probe failure other than an unknown revision FAILs, with one wrong-code run that uses an overridable tag constant.

**SHOULD**
1. **Lane 3 leaves out a site the triage named.** It drops `pi-review.mjs:70`, the source-scope exclude. If `:161-163` is fixed alone, the source snapshot keeps an existing untracked in-tree `--out` (short-path exclude, so no match) while the checkout leaves it out. The result is "dirty snapshot could not be reproduced" on an 8.3 working folder. Today that review runs. GP1 would catch it at immutable-review check 2. Fix it once inside `workingState`'s skip (`review-round.mjs:208`, `relUnder(root, realOut(x))`) so every caller is covered.
2. **Reclaim on Windows will start refusing reviews (lane 3).**
   - pi is spawned `detached:true` (`pi-watchdog.mjs:177`), so it is outside libuv's kill-on-close job. It survives a TerminateProcess of pi-review and keeps its working folder inside the checkout.
   - Windows cannot delete a folder a live process is using, so `pi-review.mjs:98` throws "cannot reclaim stale review worktree". Every later pi-review on that repo then refuses until the orphaned pi exits.
   - List this as a known limit, or have reclaim warn and skip.
   - Lane 1's port must write `OBSERVE_PID` before `OBSERVE`. Check 11 kills the fake by that pid (`:171-173`); if the kill misses after lane 3, checks 11-17 cascade.
3. **Move land.test to lane 3.**
   - Its 40 lane-1 failures all belong to lane 3.
   - The fixes the refusals hide (autocrlf, quoting, `true`) cannot be seen until lane 3.
   - LR1's "prints the short and long paths it compared" cannot be met for land.test, because the refusal text names no paths.
   - Lane 3 then owns its own wrong-code pairs.
4. **immutable-review `:134` stays vacuous on Windows.** `checkout` no longer exists when it is compared, so the helper's fallback compares short against long. Canonicalize `checkout` right after the observe read, as the plan already does for `killedCheckout`.
5. **The fake-pi helper changes the macOS stubs.** It swaps sh for `exec node` on POSIX. The brief must say how review-ledger's sleeper and ignorer modes (section 7, R-623) keep their meaning, since one `pi` per folder cannot be both. Matching counts (LR2) do not prove identical checks. Stall mode is safe: idle node CPU is flat after about 100 ms on macOS (measured).
6. **The review-ledger `:604-608` skip covers a case that does exist on Windows.** An ACL-denied ledger folder gives EPERM, which `failMessage` handles. `icacls <dir> /deny *S-1-1-0:(OI)(CI)(W)` and then `/remove:d` before cleanup can pin it. Otherwise reword the skip to "untested on Windows".
7. **KB4 is worded wrongly.** On Windows, Ctrl+C reaches pi-review's SIGINT handler and closing the console reaches SIGHUP; SIGTERM never arrives.
8. **`gitOnlyPath` on win32 puts git's whole folder on PATH.** In a scoop or chocolatey shim folder that folder also holds `uvx`, which makes "reports missing uvx" depend on the machine. Fail with a reason if the chosen folder contains `uvx`.
9. **IP2's macOS half is vacuous.** The native separator there is `/`, so it passes with the fix removed. State IP2 as pinned on Windows, or inject `path.win32`.
10. **`real-path.mjs` claims more than it does.**
    - libuv's realpath already strips `\\?\`, so the plan's strip branch never runs (inferred from libuv source).
    - "So the code exists once" is false while `mutation-runner.mjs` and `adoption.mjs` call `realpathSync.native` directly. Fold them in or drop the claim.

**Amended cut**

- **Lane 1, win-review-tests (ordinary).**
  - Files: immutable-review, review-ledger, worker-lane and `fake-pi.mjs`. land.test moves to lane 3.
  - Add to the plan's fixes: the pid file written before observe, `checkout` canonicalized at observe time, and stated POSIX behaviour for the sleeper and ignorer modes.
  - LR1: no crash; worker-lane 51 pass plus 1 SKIP; the remaining immutable-review and review-ledger FAILs are exactly the listed lane-3 set, each with detail; no "No API key found" line.
  - LR2 as cut. R-705, R-724 and R-967 are recorded as violated on Windows until lane 3.
- **Lane 2, win-template-tests (ordinary).** As cut, except: drop TR2's tag clause or pin it with a wrong-code run, and `gitOnlyPath` refuses a folder that holds `uvx`.
- **Lane 3, one spelling per folder (gate).**
  - Files: the product sites plus all of land.test's fixes.
  - The `:70` exclude is fixed inside `workingState`.
  - One canonical-path function. I recommend native on every platform, following the existing prior art; otherwise record the macOS residual.
  - Must-meets: GP1, GP2, plus GP3 (built spellings: a case flip on both platforms, ShortPath on Windows with a SKIP when no 8.3 name exists).
  - Known limit: reclaim refuses while an orphaned pi holds the checkout.
  - The autocrlf decision is made here, alongside the R-708 status from MUST 2.
- **Lane 4, win-impact-paths (ordinary).** As cut, with IP2 stated as pinned on Windows only.
- **Lane 5, win-objective-golden (ordinary).** As cut. I checked `displayPath`: the hand-built form matches it, since it uses uppercase hex, backslash doubling and quotes only when a path is unsafe.
- **New lane, a clean Windows checkout reads clean (gate, KB1+KB2).** It lands before the Windows leg turns blocking. Until then, R-708 stays violated on Windows. Jake's call: queue this lane, or narrow the Support line to exclude nana-land on Windows.