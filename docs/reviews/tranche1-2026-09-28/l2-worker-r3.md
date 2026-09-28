**L2 r3: the per-call watchdog is gone; user regexes are probed once at config load**

**Commit:** `a24f2bd` on `lane/l2-gate`, not pushed. The gate no longer imports `node:vm` (`grep -n vm extensions/nana-gate.ts` finds nothing).

**Where the check lives:** `lib/config.ts`, next to `compileRegexes`, as the brief declared. `loadConfig` already builds the merged gate lists and owns the `config_invalid` channel (`surface`, once per session, written even with the journal off). In `gate-shell.ts` the gate would have had to invent its own diagnostic path.
- **Method:** each of the first 200 distinct entries per list runs on growing probes, one character at a time up to 40: `a…a!`, `/a/a…!` and `a a…!`, each bare and behind the pattern's literal prefix. The pattern is dropped if any single test takes over 10 ms.
- **Why no timer is needed:** exponential cost multiplies at each step, so the probe gives up after one over-budget test instead of hanging.
- **Cost:** the result is cached per pattern for the process. The first load with 600 patterns took 17 ms; a cached load took 0.43 ms.
- **The cap:** `MAX_PATTERNS` (200) is now imported from config. The cap and the 64 KB subject cap are otherwise unchanged.

**Diagnostic text:** `gate.extraPatterns "(a+)+$" backtracks catastrophically (over 10 ms on a probe of at most 40 chars) — dropped`. The same form appears for `allowPatterns "^rm -rf (a+)+$"` and `protectedPaths "([/a]+)+$"`.

**Per-call cost**, from `/tmp/l2r3-timing.mjs`:

| Case | Before (r2) | After |
|---|---|---|
| Normal command (`git status && ls -la`), avg of 200 | 0.106 ms | 0.040 ms |
| Benign 4 MB command | BLOCK in 1257–1374 ms | ALLOW in 1807–2037 ms |

The 4 MB time is the same with an empty user config, so it comes from the built-in analysis, not from user regexes. That cost was already there before this round (r2 measured 2.8 s for 10 MB), and I left it alone.

**Tests:** the three watchdog timing checks and the watchdog follow-up case are deleted. For each list, a catastrophic pattern now gets exactly one `config_invalid` naming it, and 50 later calls took 1–3 ms in total (the bound is under 1 s). Each verdict matches the pattern being absent. A 4 MB benign command ALLOWs. The pattern-cap, subject-cap, floor and corpus rows are unchanged, and the corpus file passes 198 checks.

**`npm test`:** exit 0. 64 files: 63 PASS, 0 FAIL, 1 SKIP; 2,986 checks pass.

**Seat probes:** the output of `l2-gate-probe` and `l2-gate2-probe` is byte-identical to the pre-change run (`cmp`): 94 BLOCK, 16 ALLOW, every dangerous row blocked. Both scripts import the worktree gate.

**`git diff --stat HEAD~1`:** 4 files, +85/−44. `nana-gate.ts` +10/−31 (net −21), `config.ts` +53, corpus test +28 lines / −10, README +7 lines / −4.

**Claim most likely wrong:** that the probes catch the catastrophic regexes users actually write. They only find blow-ups that show up on these three shapes behind a literal prefix. A pattern whose blow-up needs other characters, or sits behind an alternation or class prefix, gets through. Polynomial regexes (`a*a*a*!`) are also not detected, and they now run on commands of any length with no bound. The README states this.

VERDICT: DONE
