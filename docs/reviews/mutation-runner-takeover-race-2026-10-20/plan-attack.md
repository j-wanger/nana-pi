# mutation-runner-takeover-race — plan attack (one adversary)

Verdict: AMEND

GO, amended. Probes ran in a temp copy of main 773de493's runner lib with a temp HOME, and the folder has been removed.

What held:
- **R-2170 is red today.** Two child waiters, with B paused before its first unlink of the lock, recorded `B found A` for both the dead-pid and the old-unreadable lock. That happened 3 runs out of 3. The after-read schedule is green today.
- **The breaker design works.** A breaker prototype passed R-2170 in 5 runs out of 5. Its wrong-code versions behaved as the plan says:
  - W2 (no re-check) is red only in the after-read dead-pid case.
  - W3 (plain-overwrite breaker) is red in the before-unlink case.
  - W4 is red on R-2171: the waiter stopped at fake 30000 ms and printed the R-1779 line.
  - W5, W6 and W7 are red on R-2172.
- **The class is right.** Ordinary: the mutation runner is not nana-land, pi-review, review-round, review-ledger or pi-watchdog. Precedent: win-lock and win-prune were both ordinary.
- **Nothing simpler works.**
  - Rename-to-unique, inode compare and verify-after-publish all keep a two-step gap.
  - Parent-only takeover would break R-1777 and R-1778.

What I changed:
1. **R-2172 is now a per-call fault sweep.** The plan's first-call-per-path faults missed W8 (I probed it). In W8 the breaker is kept when the separate re-read under it hits a transient error. The first lock read is the main-loop judgement, so the re-read never gets the first-call fault. The sweep records a fault-free takeover's read, stat, link and unlink calls, then faults each call alone with each code. It also covers the old-unreadable kind.
   - It caught W5, W6, W7 and W8.
   - Today's code passes all 45 cases, and the prototype passes all 63 cases in 0.36 s.
2. **R-2171's row is narrowed to "just before it removes".** That is the only kill point the test reaches.
3. **R-2170's ok condition now requires A's signal before B is released.** Without it, a slow Windows runner could let today's code pass because the schedule was never reached.
4. **Fake clocks must start at Date.now().** My first sweep used a clock starting at 0. It judged an old unreadable lock fresh, so each case ran to the wait limit and the sweep stalled.
5. **A Known-limits claim was wrong and is corrected.** R-1778's check already takes over a dead-pid lock and an old-unreadable lock in-process on every leg, Windows included. What is new on Windows is two live processes taking over one dead lock (R-2170).
6. **Brief additions.**
   - W8 added.
   - The test file defines its own import-line helper, because the existing one is not exported.
   - The dead pid 2147483647 is named once.
   - Don't assert the child's signal name, because Windows reports an exit code.
   - Release the breaker before any wait or throw.

Value, honestly: the race needs a dead shard plus a stall of microseconds, and today it fails loudly as a missing pair. The lane earns its keep because R-1776, an implemented row, is known to be broken in this case, and R-2170 closes the Windows takeover gap HANDOFF records.

Files the build will touch:
- packages/nana-pack/lib/mutation-runner.mjs
- packages/nana-pack/lib/mutation-runner-config.mjs
- packages/nana-pack/tests/mutation-runner-takeover.test.mjs (new)
- packages/nana-pack/README.md
- REQUIREMENTS.md (FEAT-031 table, after R-1960)
- docs/code-map.md and docs/requirements-tree.md (regenerated)
- docs/reviews/mutation-runner-takeover-race-2026-10-20/ (written by the seat)

Conflicts:
- **mutation-runner-lock-overlap.** No file conflict; it edits only tests/mutation-runner.test.mjs, which this lane must not touch. Its R-1776 check will run this lane's new lock code, so merge main before the final review if it lands first. No wait is needed.
- **realpath-strict-fallback.** Overlap is unknown, because no plan exists yet. If it moves this file's realpathSync.native calls (realContainment and resetScratch), the hunks fall outside the lock region and should merge cleanly.
- **handoff-cap-surrogate.** None.
- **Land chain and other in-flight lanes** (install-cli-pins, pack-config-agent-dir-pins, win-lock-fix-command, handoff-pins, pi-launch-followups, notify-lifecycle-pins, post-edit-timeout-name). None.
- **REQUIREMENTS.md.** No in-flight lane adds FEAT-031 rows.

Most likely wrong: that a dead breaker can reopen the race only after a second kill (a waiter killed holding the breaker) plus a second dead lock and a stall. The single-kill schedules are probed closed; this one is only reasoned.
