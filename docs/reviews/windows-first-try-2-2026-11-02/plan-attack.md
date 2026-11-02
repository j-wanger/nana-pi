# windows-first-try-2 — plan attack (adversary, revision 1)

Five MUST findings and seven SHOULD findings. The adversary ran its probes on the reference laptop (Node v22.22.2, base 0bd1df89). Its probe scripts are outside git. Each probe is described well enough below to rerun.

## MUST

**1. The WAL mechanism does not fit the hook, and "explains all 5" is not shown.**
The seat's probe holds a reader opened with `readOnly: true` (`wal-probe.mjs:22`). The hook does not open that way: it calls `openDb(paths.db, {})`, a read-write connection (`lib/hook.ts:180`, `lib/db.ts:115`). The adversary reran `wal-probe.mjs` with the reader opened read-write and holding the same read transaction. Result: `{"readerHoldsTxn":true,"mode":"rw",...,"mtimeMovedWhileReaderOpen":false,"walBytes":4152,"builtAtAdvanced":true,"mtimeMovedAfterReaderClosed":true}`. When the last read-write connection closes, SQLite checkpoints the WAL. So whichever of the hook and the build closes last moves `index.db`'s modified time, in milliseconds. That cannot explain "not rebuilt within 20 s". A faithful loop also ran 25 times with no failure: stale index, the real `nana-knowledge hook`, then a poll of the modified time and `built_at`.
Run 40062423521 also differs from the others. The hook took 2444 ms and printed no pull block (`ci-fail-lines.txt`), so the first half of the R-1713 check failed too. O1 cannot fix that run. If the hook's 1500 ms deadline fired before `ensureFreshIndex` (`bin/nana-knowledge.ts:98`, `lib/hook.ts:175`), no build was ever started.
Fix: drop the claim that the mechanism is reproduced and explains all 5. State the cause as unproven, and rest the lane on finding 2's evidence.

**2. A likelier cause is demonstrated, and it is a product bug that O1 cannot hide.**
`openDb` sets no busy timeout. node:sqlite's default is 0. The adversary started a real `nana-knowledge build` while a second process opened, read and closed read-write connections, as the hook does once. In 3 of 15 builds, the build exited 1 with `Error: database is locked` at `db.exec("PRAGMA journal_mode=WAL; ...")` (`lib/db.ts:120`). In those builds `built_at` did not advance and the modified time did not move. A closing read-write connection takes an exclusive lock to checkpoint. A build that opens at that moment gets SQLITE_BUSY, and its detached stdio hides the error (`lib/hook.ts:60-64`). On a loaded runner, the hook's close and the build's open meet easily: the build is spawned before the hook queries and closes. That fits "never rebuilt in 20 s". Under this cause, R-1713 is right to fail: the background build really did not rebuild. A `built_at` oracle still fails, so M1's "a rebuild hidden by a failed checkpoint passes" does not fix this cause.
Fix: choose one of two paths, and say which. (a) Fix the product with a busy timeout in `openDb`. `scripts/lane-class.mjs` prints `hook: packages/nana-knowledge/lib/db.ts` for that file, so the lane becomes a hook lane with that ladder. (b) Stay ordinary and diagnostic-only. Keep the mtime oracle, add `built_at`, WAL bytes and lock state to the detail (the plan's detail is good), and record the busy-timeout bug as a FEAT-013 known-bug line. Then the lane does not claim the flake is fixed.

**3. O1 as written passes with no background build.**
O1 counts a rebuild when "`built_at` is newer than the stale point". The stale point is `staleMtimeMs`, two hours ago (`hooks-win32-exec.test.mjs:238-240`). The test makes the index stale by rewinding the file's modified time only. `built_at` still holds the time of the KH1 build at line 222, a few seconds earlier, and that is newer than the stale point. So the new oracle is true before the hook runs at all.
Fix: read `built_at` before the hook runs, and count a rebuild only when it changes from that baseline. Alternatively, count it only when `built_at` exceeds the hook's start time. Name the baseline in the detail.

**4. The M1 mutation never reaches the code under test.**
The file installs and runs the hooks from `git worktree add --detach <tmp> HEAD` (`hooks-win32-exec.test.mjs:59`, `:63`, `:110`). An uncommitted edit to `packages/nana-knowledge/lib/hook.ts` in the lane worktree is not in HEAD, so the installed hook still spawns the build. The check would pass, and the run would be read as "the mutation was caught" or "survived" for the wrong reason. With finding 3's oracle, it passes either way.
Fix: commit the mutation on a throwaway branch or detached commit, and run the file from there. Or apply the mutation inside the temp worktree through a test-only environment seam. Record the commit or the seam in `m1-wal-win32.txt`. The same applies to the mechanism run: it must target the temp worktree's knowledge home, which is named by `process.pid` and lives only during the run.

**5. O2's "stdout is exactly the marker" misses the shape that load produces, and M2's own mutation would show it.**
The installed hook runs two producers under one 4000 ms deadline (`claude/hooks/nana-objective.mjs:17-18`, `hook-producer.mjs:28`, `:60`). When the objective producer uses its 2500 ms, the frontier producer gets the remaining time on the same clock, at most about 1.5 s minus start-up. When no time is left, it prints `[nana:frontier]\nFRONTIER UNAVAILABLE: producer failed (…)` without running (`hook-producer.mjs:58-61`, `:38`). Load therefore often gives the objective marker followed by the frontier marker, which is not an exact match. With `HOOK_PRODUCER_TIMEOUT_MS = 1`, both producers fail every time. So the planned M2 run shows 0 retries, not "after 2 retries".
Run 40271405749 also points at the frontier. Only "cap boundary: … 3-byte sequence: BYTE-IDENTICAL" failed. That case's own "refused" check, which reads the objective text (`objective-golden.test.mjs:583-585`), passed. So the objective text was right and something else was appended, probably the frontier marker (inferred). A frontier-only failure is a third shape that O2 never retries.
Fix: retry when the hook's stdout holds either load marker. The first is a line starting `OBJECTIVE UNAVAILABLE: producer failed (`. The second is a `[nana:frontier]` line followed by `FRONTIER UNAVAILABLE: producer failed (`. Build both from the defining modules: `hookProducerConfig` from `hook-producer.mjs`, and `FRONTIER_TAG` and `FRONTIER_UNAVAILABLE` from `frontier-summary-config.mjs`. No golden case may print frontier output, because every BYTE-IDENTICAL check would fail. So the frontier marker is always a load signal there. The last run must still be byte-identical. Rewrite R-3541 and M2's pins to match.

## SHOULD

**6. O1's per-poll reader can break the build it is watching.**
The adversary reran the churn probe with `readOnly: true` readers. 1 of 20 builds exited 1 with the same `database is locked` at `db.ts:120`. A read-only connection that is open when the build closes also stops the build's close-time checkpoint, so the mtime half of the oracle can fail because of the test.
Fix: take the baseline `built_at` before the hook. Keep the 50 ms poll on the modified time and the lock only. Read `built_at` once, when the mtime poll reaches its deadline and `build.lock` is absent. Open that read with a busy timeout, and treat a busy error as "not yet". node:sqlite is unflagged on CI's `node-version: 22` (`.github/workflows/ci.yml:38`), so the import itself is fine.

**7. The retry breaks the T17 lock-refresh cases.**
`golden` calls `refreshLock("hook")` once (`:151`). The T17 checks pin exactly 2 refreshes per case (`:1105`, `:1109`, R-760). Without a refresh before each retry, the "fresh" lock folder, which must stay under 10 s old (`:1094`), can age past 10 s over three hook runs of up to about 4 s each. The label then changes. With a refresh before each retry, the count becomes 3 and R-760 fails.
Fix: refresh before every attempt, and make the R-760 counts expect 2 plus the retries. Or exclude the T17 cases from retrying, and say so.

**8. Retries can exceed `withCaseLimit`'s 15 s.**
`golden` runs inside `withCaseLimit(..., 15000)` at `:1374-1381` and in other cases. Three hook runs under load can take 12 to 15 s. The expired timer rejects at the next await.
Fix: raise the limit by the retry budget for wrapped cases, or count retries inside the limit and fail with the retry count.

**9. M2's "test-local hook stub" needs a seam that the plan does not name.**
`runHook` always spawns the symlinked real hook (`:123`). Name the seam, for example a hook-path parameter used only by the reproduction script. Or move the one-off reproduction to a lane-folder script that drives the shared retry helper.

**10. The FEAT-013 residual line describes the wrong product bug.**
A read-write connection's close heals the WAL (finding 1), so "every later prompt then starts another build" happens only when the last connection to close is read-only. Fix: record instead that `openDb` has no busy timeout, so a background build can lose to a closing hook connection and fail with no trace (finding 2). Name the db.ts fix as a hook lane. Update FEAT-013 line 202's cause to "inferred, not reproduced on CI".

**11. The precedent and evidence paths are not on this branch.**
`docs/reviews/windows-first-try-2026-11-02/` (plan.md, plan-attack.md, ci-windows-failures.tsv) is not in this worktree at 0bd1df89. It exists only in the sibling worktree `windows-first-try`. pi-worker checks Precedent paths. Fix: cite the paths as they will exist on main, merge that lane first, or copy the needed rows into this folder.

**12. Smaller points.**
(a) The CLAUDE_PROJECT_DIR control at `:676-678` passes on any `OBJECTIVE UNAVAILABLE`, including the producer-failed marker. It can pass without testing anything under load. Require `file not found` there. (b) Build the objective marker from `hookProducerConfig("objective", fs.realpathSync(repoRoot))`, because the hook computes its repo root from its symlink-resolved path (`nana-objective.mjs:16`). (c) Lane class: the planned file list prints `ordinary`. `db.ts` and `build.ts` print `hook`, and `hook-producer.mjs` prints `install`. So the M2 mutation copy must stay uncommitted, as planned. Rows R-3540 and R-3541 are free, and test-setting rows have precedent (R-3451, R-3454).
