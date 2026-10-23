# win-flake-hardening · plan attack (adversary, 2026-10-23, main df910cd3)

Read-only pass over `win-flake-hardening-plan-draft.md`. Scratch work, scripts and logs: `scratchpad/wfh/adv/` (`myjobs.json`, `logs/`, `classify2.mjs`, `probe-meet.mjs` and `.out`, `bc/` brief-check variants, `run-parallel-loaded.sh`, `loaded-parallel-*.out`). Every claim is marked measured or inferred. One disclosure: I ran `git fetch` once to list remote branches; it wrote remote refs under `.git`, nothing else.

## Summary

The measurement holds. I re-fetched all 81 newest ci.yml runs and every attempt myself (581 jobs). My own extractor found the same 26 failed Windows suite legs and the same repeaters: runner EBUSY 3, R-1472 4, R-1470 1, R-2585 2, build-report crash 2 (one a lane bug), templates-update with R-2023 2. Measured. No repeater is missing, and every top-row failure ran at a commit now on main that touched no runner file. Measured.

The causes for R-1472, R-1470 and R-2585 hold up under probes. The meeting design survives a 10 s skew and still catches a streaming runner and a serial runner. The brief-check fix passes in 2 s with a 40 s sampler shim first on PATH. Measured on this Mac.

Two parts need changing before the build. The busy-folder WARN turns a leaked process into a green leg, and nothing in CI, the land or the records reads a WARN (M-1). R-2667's check kills a dead pid by number on Windows, the mechanism the plan itself blames for templates-update, and it never exercises the measured exit 255 (M-2).

## Findings

### M-1 · The busy-folder WARN hides a leak and loosens what a land accepts

- Measured: in all 4 known runner EBUSY crashes, the file whose folder was held had already printed its own FAIL. These are the 3 in the window (brief-check twice, build-report once) and the older run 39464607963 attempt 1 (stale-copies, `FAIL ... exit 1`, then the runner's EBUSY on its index file).
- So a FAIL-and-continue costs no extra re-run against WARN in any measured case. The WARN differs only when a file passes but leaves a holder behind. That is a real leak, which FEAT-031 ("without contaminating work") exists to catch.
- Measured: no reader of WARN lines exists. `grep -i warn` finds nothing in `.github/workflows/ci.yml`, `lib/suite-records.mjs`, `bin/nana-land.mjs` or the land libraries. The leg's conclusion is all that CI and nana-land read.
- Inferred, concrete: build-report's own cleanup already swallows its EBUSY (`build-report.test.mjs:148-152`, `console.error` only). A leaked holder of `linked` would then pass the file. The runner's removal would then WARN and the Windows leg would go green. The held path in run 39876821115 was exactly `build-report-test-*\linked`.
- Precedent is FAIL, twice: R-1922 ("a busy temporary folder ... gives one named FAIL line") and the runner's own "tracked repository files changed by tests" path (`scripts/test.mjs`, `:577-582`, the `FAIL ${failure}` line, `unnamedFailures.push`, `tally.FAIL++`).
- As drafted, R-2666's text and pair 4 pin the WARN, so taking Open question 1's default ships the loosening.
- Change: count a busy folder as one unnamed failure in the existing FAIL form, keep running every remaining file, print totals. Keep the retries and the exit-time retry. Pair 4 inverts: "the busy folder printed as a WARN with exit 0 → R-2666 red". Default for Open question 1 becomes **fail**.

### M-2 · R-2667's check kills a dead pid by number, and misses the measured exit code

- The planned check starts a node child, waits for its exit, then calls the kill function on that pid. On Windows that runs `taskkill /T /F /PID <dead pid>`.
- The plan's own threat model and Correction 3 say a dead pid can be reused at once on Windows. Then this check can kill another file's process tree under four files at once. That is the same inferred mechanism the plan blames for templates-update. Inferred; I did not measure Windows pid reuse.
- Measured: the one crash was taskkill exit 255 (run 39897067709 attempt 2, `build-report.test.mjs:132:36`, `status: 255`). A dead root pid gives 128 (documented, not probed). So the check exercises 128, not the 255 that crashed the file.
- The row says "ended in part or in whole". The test covers only "in whole", so the row is wider than its test.
- Main is green off Windows, so pair 5 needs a scratch-branch CI run. It is the lane's only Windows-only pair.
- Change: give the local kill function an injected runner, defaulting to `spawnSync` (precedent: win-leg-flakes' `runWindowsPowerShell(…, spawn = spawnSync)`). The check passes fakes that return status 255, return status 128, and throw. Assert no throw each time, and that the default runner is `spawnSync` with `stdio: "ignore"`. Nothing real is killed. The check is red on main on every platform once pair 5 restores a throwing call, so pair 5 runs in the mutation runner on this Mac. Narrow R-2667 to "whatever status the tree kill returns, or if it cannot start".

### S-1 · R-2666's row is wider than its test

- The row covers "the temporary folder or home". The planned preload throws only for `nana-test-` folders, so the home removal never fails in the test. Inferred from the plan text; deterministic.
- A guard on the temp folder alone, home left unguarded, keeps R-2666 green. That wrong code survives.
- Measured: all 4 held paths were under the per-file temp folder, none under the runner's home. brief-check and build-report give their children a HOME inside that temp folder.
- Change: narrow the row to the temp folder, or make the home busy in a second fixture file and add the pair.

### S-2 · CHILD_LIMIT_MS's "measured" provenance is wrong

- The draft says 22 passing Windows legs ran brief-check in 0.8 to 4.0 s. Measured from the planner's own logs: 15 Windows legs passed it, in 1.8 to 4.0 s. The 0.8 s is a macOS leg. 23 passes across all three systems.
- All 15 come from legs that failed for other reasons, since only failed logs were pulled. That sample is biased toward loaded legs.
- The value stays fine (30 s is 7.5 times 4.0 s). Fix the provenance line before it is sealed.

### S-3 · Two new millisecond floors can flake by one millisecond

- R-2668 asserts `delayedMs >= START_SKEW_MS`, and R-2670 asserts the fake's hold is at least `FAKE_PI_HOLD_MS`. Both read a `Date.now()` difference around one `setTimeout`.
- Node timers can fire about 1 ms early against `Date.now()` because of millisecond truncation, most often reported on Windows. Inferred. On this Mac: 0 early in 46 runs (40 at 200 ms, 6 at 2,500 ms). Measured.
- Change: each fixture sleeps in a loop until the measured difference reaches the value. Then the floor cannot miss.

### S-4 · build-report's hard-kill worker keeps the same sampler on its path

- The hard-kill case starts pi-worker with `--poll 0.1` (`build-report.test.mjs:116`). Its fake pi runs forever, so the 0.1 s poll starts the same synchronous PowerShell sampler that part 5 removes from brief-check. Measured from the code.
- A sampler cut off mid-start can outlive the tree kill with its working folder in `linked`. That would match the held path of run 39876821115. Inferred; that run's holder is unknown.
- Change: give that worker a poll above the test's 10 s start wait, as part 5 does. Its kill needs a live worker, not a sample. Or record it as a known limit beside worker-lane and build-records.

### S-5 · Scope, overlap and land order

- Measured, per `git diff --name-only main...<branch>`:
  - ci-timing-records: README.md, REQUIREMENTS.md, FEAT-031.md, code map, requirements tree, `scripts/test-locked.mjs` and ci.yml. It does not edit `scripts/test.mjs`. Its FEAT-031 lines append right after the R-1472 line this lane rewrites.
  - claude-code-builder-parity: REQUIREMENTS.md, code map, requirements tree, `pi-worker.mjs` (the lane path rewritten, 129 lines) and `pi-watchdog.mjs` (launch injection only; the poll loop and exit race are unchanged). Brief-check's fix depends on that path. So "it shares no file with claude-code-builder-parity" holds only for the edited source files.
  - park-deliverables: README.md, REQUIREMENTS.md, code map, requirements tree.
  - shared-helpers is not cut yet. Its plan cuts it after parity lands. It edits `scripts/test.mjs` (`killTree`) and test-runner's copy list.
- R-2023 and templates-update stay out. Correct.
- Land order I would name: ci-timing-records (in final review) first; then parity; then this lane, merging main each time and re-running brief-check, build-report and test-runner at the merge tip; shared-helpers after, as its own plan says.

### S-6 · The base moved, and Open question 4 is answered

- Main is now df910cd3 (session-start-frontier landed). None of the six source and test files this lane edits changed since 16c902c2. Measured. Every cited line in them still matches.
- Measured: main's newest push run 39903888663 at df910cd3 passed every job, release included. Drop Open question 4.
- The hook producer limit moved to `hook-producer.mjs:23`.

### N · Smaller notes

- N-1. Pair 14's first half survives as worded. Measured: in my V0 run the shim sat in a PATH folder after the stub folder and still ran as `ps`. Word it "after the folder holding the real `ps` or `powershell`".
- N-2. B3 says the POSIX fake exits before the first poll without a hold. Measured: main's unpatched test with a 40 s `ps` shim sampled once and failed (worker 143 after 41 s, 1 of 1). The hold is right; the claim should say "sometimes".
- N-3. A `powershell.cmd` shim cannot sleep with `timeout /t` under redirected input. Use `ping -n` or node. Only pair 13 on Windows would notice, and it is not run.
- N-4. The retries buy nothing measured. The one holder seen at job end, an orphan PowerShell in run 39889862826 attempt 1, outlived the crash by 3 s. They are cheap; the provenance already says "chosen".
- N-5. With newer data, the since-four-at-once rate is 13 of 45 (29%). Measured.
- N-6. Pair 11 survives if file d starts more than 1.5 s late, which happens only under load. Fine on this Mac.
- N-7. CPU load alone does not reproduce the skew. Measured: main's test-runner-parallel passed 3 of 3 under 20 nice-10 CPU burners on this 10-core Mac. Inferred: the Windows stalls are process-start latency. The injected skew is the right tool.

## Probes I ran (measured, this Mac, temp HOME and TMPDIR under scratch)

- Meeting design (`probe-meet.out`): main runner with a 10 s skew → overlap 2 in both modes, 2 of 2. Runner mutated to stream pool output live → verbose output interleaved (65 to 77 owner changes), 3 of 3, so R-1472 stays red on its real target. Runner mutated to run the pool serially → overlap 1, first file never saw its partner, 1 of 1, about 34 s per root.
- brief-check (`bc/`): main test plus a 40 s `ps` shim → FAIL, worker 143 after 41 s, shim ran (V0 unpatched, V1 with a 1 s hold). Poll 60, 30 s limit and the hold → PASS in 2 s, shim never ran (V2).
- Failure details: all 4 R-1472 failures had contiguous blocks (one owner change each) and overlap 1 in one mode, plain 3 times and verbose once. In R-1470's failure, b started at 4,316 ms. Both R-2585 failures had the passing case's worker status null. Run 39889862826 attempt 1 ended with an orphan PowerShell and conhost terminated at job cleanup.

## Class

Ordinary is defensible only with M-1's FAIL. Then the runner never accepts a run it rejected before; it only runs more files. That matches suite-records (2026-10-22, runner edit, ordinary).

With the WARN default, the lane makes CI's Windows leg, which nana-land now reads, pass a run that dies today. That is parallel-runner's reason for gate (2026-10-19, "every nana-land runs this suite"). Then add the land reviewer and one independent check.

Precedent paths: all 16 in the Precedent section are tracked (`git ls-files --error-unmatch`). Measured.

## Plan sections I would change

1. Design part 1, R-2666, pair 4 and Open question 1: FAIL-and-continue with the runner's "tracked repository files changed" path as precedent. Default **fail**. Narrow the row to the temp folder, or test the home.
2. Design part 2, R-2667, pairs 5 and 6, and Windows notes: an injected kill runner; fakes for 255, 128 and a throw; no kill of a dead pid; pair 5 in the Mac mutation run; the row narrowed to its test.
3. Tunables: the CHILD_LIMIT_MS provenance (15 Windows legs, 1.8 to 4.0 s, failed legs only).
4. What each test does (R-2668, R-2670): fixtures loop until the elapsed time reaches the floor.
5. Design or Known limits: build-report's hard-kill worker poll (S-4).
6. Seat steps 1 and 4: name ci-timing-records and parity as overlaps; land order ci-timing-records, parity, this lane; re-run brief-check, build-report and test-runner at each merge of main.
7. Open questions: drop 4; rebase the plan's header onto df910cd3.
8. Class: ordinary with FAIL; gate if WARN stays.
9. Pair 14's wording (N-1).

Claim I would most expect to be wrong: M-2's premise that Windows can hand a just-freed pid to another process within the milliseconds of the R-2667 check. It is inferred, and I did not measure it. The rest of M-2 (the missed 255, the row width, the Mac-runnable pair) stands without it.
