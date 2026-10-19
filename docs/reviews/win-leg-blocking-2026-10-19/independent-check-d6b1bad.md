# Independent check — win-leg-blocking at d6b1bad (2026-10-19)

VERDICT: FINDINGS

The runner change works on every input I could probe. One MUST blocks the land: the new test file breaks the requirements trace, which main passes today. Private copy: <tmp> (lane at f74ab32, a clone of main at b3f6ec2, and a "fix" copy). Every probe used a temp HOME and TMPDIR under that folder.

**Must-meet tests**
- Command: `node --experimental-strip-types packages/nana-pack/tests/test-runner.test.mjs`
- Output: R-1380, R-1381, R-1382 and R-1383 all PASS, then "all checks passed". The temp folder held 0 leftover entries afterwards.
- Verdict: holds.

**Probes**

P1. The skip list equals the set of files that failed on CI Windows run 2.
- Command: grep the PASS/FAIL/SKIP lines for desk and bench out of `ci-windows-run-2.log`, then diff the FAIL set against the keys of `WINDOWS_SKIPS`.
- Output: `LIST == CI FAIL set (20)`. The ones not in the list: live-feel and nine bench files PASS, and study-tasks SKIPs (existing SKIPS entry).
- Verdict: holds.

P2. Runner forced to win32, desk filter.
- Command: `node --import file://$B/force-win32.mjs scripts/test.mjs apps/desk/test/`
- Output: 16 SKIP lines, each with its reason, then `PASS apps/desk/test/live-feel.test.mjs 64 pass` and `17 files: 1 PASS, 0 FAIL, 16 SKIP`.
- Verdict: holds.

P3. macOS, no forcing, listed bench files.
- Command: `node scripts/test.mjs apps/bench/test/argv …/usage …/agentdir …/catch-ledger`
- Output: exit 0. agentdir 26, argv 32+1 skip, catch-ledger 75, usage 90. These counts equal `macos-baseline.txt` line for line.
- Verdict: holds. The skip list is inert off win32.

P4. Forced win32, a filter that matches only skipped files, coverage knob on.
- Command: `NANA_COVERAGE_DIR=$B/cov node --import …force-win32.mjs scripts/test.mjs apps/bench/test/usage.test`
- Output: exit 0, `1 SKIP`. The record reads `{"path":"apps/bench/test/usage.test.mjs","label":"SKIP","seconds":0}` and `runner-done.json` is written.
- Verdict: holds. Exit 0 on an all-SKIP set matches how main treats existing SKIPS.

P5. Forced win32 with `--self-test` and the same filter.
- Output: `self-test: every fixture got its expected verdict`. Exit 1 by design (the fixtures FAIL). 0 temp files left over.
- Verdict: holds.

P6. `node scripts/code-map.mjs --check`
- Output: `286 modules … 0 problem(s)`, exit 0.
- Verdict: holds.

P7. `node scripts/readme-check.mjs --check`
- Output: `readme: 690 claims checked; 0 problem(s)`.
- Verdict: holds.

P8. `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs`
- Output: exit 0, 89 PASS, 0 FAIL. "leaf counts total 1,219" PASS.
- Verdict: holds.

P9. `node --experimental-strip-types packages/nana-pack/tests/requirements-trace.test.mjs`
- Tip f74ab32: exit 1, the process crashes with `Error: packages/nana-pack/tests/test-runner.test.mjs:576: '// req:' must sit directly above a test( or it( or check( call`.
- Main b3f6ec2: exit 0, 61 PASS.
- Verdict: BROKEN (see F1).

P10. `node --experimental-strip-types packages/nana-pack/tests/requirement-rows.test.mjs`
- Tip: exit 1. It prints 3 PASS, then crashes with the same trace error at line 576.
- Main: exit 0.
- Verdict: BROKEN (F1).

P11. `node scripts/requirements-trace.mjs` (the CLI)
- Tip: exit 1, same error. Main: exit 0.
- product-report, requirements-tree, lift and regroup all use the same trace. Inferred: they fail the same way; I did not run them.
- Verdict: BROKEN (F1).

P12. Line 576 fixed in a private copy only. I moved `// req: R-1382` below the `const unlistedDeskBenchPaths` line.
- Output: requirements-trace exit 0 with 61 PASS. requirement-rows exit 0.
- Verdict: line 576 is the only cause.

P13. Windows path spellings, simulated with `path.win32.relative` on three root spellings.
- Roots: `D:\a\nana-pi\nana-pi`, the short form `C:\Users\RUNNER~1\…`, and `d:\A\Nana-Pi`.
- Output on all three: `usage-line=true argv=true live-feel=false`. The list is frozen. `__proto__` and `toString` are not keys.
- Verdict: holds. This is a simulation; the real Windows leg is still the evidence for real paths.

P14. Repo writes.
- Command: `git status --short` in the private lane after every probe.
- Output: empty.
- Verdict: no writes outside the temp folders.

**Findings**

F1 [MUST: something main does today no longer works; the full suite goes red on every leg]
- At packages/nana-pack/tests/test-runner.test.mjs:576, `// req: R-1382` sits above `const unlistedDeskBenchPaths = …`, not above the `check(` call.
- The trace scanner throws on it. That makes requirements-trace.test.mjs and requirement-rows.test.mjs FAIL in `npm test` on macOS, Linux and Windows. The trace CLI also exits 1.
- So the Windows leg cannot read 0 FAIL, which is the lane's goal. `nana-land` would also refuse a red suite.
- Fix: put the `const` line above the marker, so the marker sits directly over `check("R-1382: …")`.
- P12 shows that fix clears both files.
- CI run 39248335035 on feat/win-leg-blocking was still in progress, so I did not read its result.

F2 [known bug, docs]
- The new apps/desk/README.md "Known limits" bullet says the runner SKIPs "those 16 files on win32 with that reason".
- Three of the 16 carry different reasons: host-rule and origin-rule (the harness path bug), and knowledge-home-isolation (the launcher regex).
- The sentence also calls the config file "the repo test runner".

**Not checked**
- The behaviour of a real win32 host. A forced platform keeps `path` and `fileURLToPath` on the host flavour, as the plan itself says.
- Wrong-code pairs. The seat's seat-mutate.mjs was running pairs M1 to M6 during my check, so I did not duplicate them.

---

Seat note: the checker ran on f74ab32. 60f8362 fixed F1 and F2, and d6b1bad adds only the seat's pairs record. CI run 39249092658 on d6b1bad shows requirements-trace and requirement-rows green on every leg. It is also the real Windows run the checker could not do (`ci-windows-run-2.log`).
