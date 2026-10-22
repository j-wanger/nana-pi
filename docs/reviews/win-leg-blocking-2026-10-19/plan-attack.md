# win-leg-blocking — the adversary's verdict (AMEND), 2026-10-19

AMEND. The design holds and the lane is worth building: the owner ruled on W8 on 10-17 and none of it exists on main yet. The four row texts stay the same. I amended five things, and probes back each one.

Probes, all in a temp folder; no repository was touched:
- Main's runner, forced to win32 with an `--import` preload, ran trap files at the desk app-listener and bench usage paths and printed FAIL for both. So R-1380 is red today.
- I wired a prototype copy of the runner and checked it against the amended single-root, two-run test. R-1380 read false on main's runner and true on the wired copy. R-1381 went red under W1 (the predicate ignores the platform). R-1382 went red under W2 (a whole-app prefix skip).
- Windows run 2 at 3bd044e shows 23 failing files: 16 desk, 4 bench, and 3 pack files that belong to win-review-paths. That matches the plan's 20 desk and bench files.

Amendments:
1. MUST: the brief left out `npm run req:tree`. R-291 compares `docs/requirements-tree.md` with a fresh render, and that file lists the IDs under each feature. Adding four rows without regenerating it turns the suite red. The win-impact-paths lane edited that file for exactly this reason (65f853f).
2. R-1381 no longer skips on win32. The plan already forces win32 on macOS, so a non-win32 branch can be forced on a Windows host just as easily. The 10-18 rule says a skip reason must name a case that cannot exist on that platform. Now one fixture root serves two runs: a forced-win32 run for R-1380 and R-1382, and a forced-linux run for R-1381. That is also one runner start fewer than the plan's three.
3. I corrected the desk resolver cause. `resolvePiPackage` does ask `npm root -g`, and it also checks the `%APPDATA%\npm` layout. The real break is that the `npm root -g` and `pi --version` probes run `.cmd` shims through `execFileSync` with no shell, and Node refuses that on Windows. The error is swallowed (inferred from pi-session.mjs:169-182). The "cannot start" line is at server.mjs:129, not :125. This only changes the desk README wording.
4. The hidden check count is about 285, not 280. The plan's sum left out pi-resolution (4) and pi-rpc-contract (1).
5. Brief details: wire through the existing `skipReason` so the SKIP tally and coverage record stay one branch. Name markers by the full path, not the basename. Pass the preload in argv, never NODE_OPTIONS.

Kept: the gate class (Owner's 10-17 ruling), the per-file list over a whole-app skip (it keeps live-feel and nine bench files running on Windows), the config module's location (same as runtime-map-config.mjs), and the CI flip as a follow-up lane.

Files the build touches: packages/nana-pack/lib/windows-skips-config.mjs (new), scripts/test.mjs, packages/nana-pack/tests/test-runner.test.mjs, packages/nana-pack/tests/runtime-map.test.mjs (MM2 and MM9 fixture copies), packages/nana-pack/tests/requirements-tree.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md (missing from the plan), docs/code-map.md, README.md, apps/desk/README.md, apps/bench/README.md, docs/reviews/win-leg-blocking-2026-10-19/ (must-meet.md, build-brief-1.md, macos-baseline.txt). The seat also edits HANDOFF.md and a session entry before the final round.

Conflicts, checked against each branch's diff from main:
- No source file is shared with win-review-paths, win-objective-golden or clean-revision, and none of them copies scripts/test.mjs.
- Three shared files need a merge. The leaf total in requirements-tree.test.mjs: win-review-paths and clean-revision both bump it, so each later lander re-bumps. docs/requirements-tree.md: all three lanes change it, so the second lander re-runs `npm run req:tree`. docs/code-map.md: win-review-paths adds lib/real-path.mjs, so the second lander re-runs `npm run map`.
- REQUIREMENTS.md hunks do not overlap: the other lanes insert near lines 377-501, and FEAT-031 ends near 1589.
- Future conflict: the queued parallel-test-runner lane will rewrite scripts/test.mjs.

Claim most likely wrong: that the forced-linux R-1381 run passes on a real Windows host. With posix forced true, the runner spawns children with `detached: true` there. I reasoned that through but could not run it, and only the Windows leg will show it. If it fails for a reason outside the list logic, the fallback is the plan's original skip, with that reason named.

Relayed user request (turn off land verification and confirmation hooks in power mode): it is outside this read-only planning task, and I changed no hook, setting or land check. Project memory says the seat answered it on 10-19: no hook asks the owner anything, and the seat kept nana-land's reviewer-ledger check. The seat owns any follow-up if the owner insists.

Drafts are saved in <seat-scratch>/win-leg-blocking-adversary/ (mm.md, brief.md). Before the final copy, the brief's step-3 expression was edited in the output above to use `rel(file)`.

Process note: early on I shared a scratchpad pointer file with another agent. As a result, two of my probe files (show.mjs, forcelinux.mjs) briefly landed in that agent's temp folder, and I removed them.
