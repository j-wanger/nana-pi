# windows-first-try-2 — plan (revision 2)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-setup/tests/hooks-win32-exec.test.mjs,packages/nana-setup/tests/knowledge-state.mjs,packages/nana-pack/tests/objective-golden.test.mjs,packages/nana-pack/tests/objective-hook-retry.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-013.md,docs/known-bugs/FEAT-031.md,docs/requirements-tree.md,code-map.config.json,docs/code-map.md`): `ordinary`. These files classify differently: `packages/nana-knowledge/lib/db.ts` and `build.ts` print `hook`, and `packages/nana-setup/lib/hook-producer.mjs` prints `install`. This lane edits none of them; mutations of them stay uncommitted.

Revision 2 takes every MUST and SHOULD in `plan-attack.md`. It also takes the seat's decision of 2026-11-02 on attack MUST 2: "take (a), split. Keep this lane ordinary: the objective-golden fix (with the either-marker retry and R-760 / 15 s limits from the attack), R-1713 diagnostics only, and a FEAT-013 known-bug line for the missing busy timeout." The seat plans the busy-timeout hook lane from the Mac.

## Purpose

Issue #213, continued. The seat's words (2026-11-02): "lane `windows-first-try-2` … the next candidates on your ranked list — hooks-win32-exec (5, 2 on 11-01), objective-golden (4), worker-lane (6) … test-only fixes unless a test proves a product bug."

This is a fix. It restores the FEAT-031 contract that a check judges behaviour, not machine load, for the objective golden corpus's hook-versus-pi checks. For R-1713 it adds the evidence a future failure needs; it does not claim the R-1713 flake fixed.

### Evidence

`ci-fail-lines.txt` in this folder holds the verbatim FAIL lines the seat pulled for 15 runs. The ranked list they come from is `ci-windows-failures.tsv` on the windows-first-try branch (draft PR #315).

| File | Runs | Read |
|---|---|---|
| hooks-win32-exec | 5 | **R-1713 failed in all 5.** Four runs failed only the rebuild half: "rebuilt when the command returned: false; rebuilt deadline later" after a 20 s wait. One run, 40062423521, printed no pull block either, after a 2444 ms hook run. The other lines (R-1960, R-2023, R-2728, GP4) appear once each, on older code. **Diagnostics here (M1); product fix in a separate hook lane.** |
| objective-golden | 4 | Hook-vs-pi BYTE-IDENTICAL failures on a different case each time, including main (39896736166). Run 40893032466 shows "OBJECTIVE UNAVAILABLE: producer failed (…)". In run 40271405749, only BYTE-IDENTICAL failed and the case's own objective-text check passed, so the extra text was probably the frontier marker (inferred). **Fixed here (M2).** |
| worker-lane | 6 | R-2883 (sampler) twice; "wall-clock ceiling kills the worker process group" twice; one R-2619 on main; one branch with a broken brief parser. Next candidates, not in this lane. |

### R-1713: what is and is not known

- **Ruled out (attack MUST 1):** a WAL checkpoint blocked by a reader. `wal-probe.txt` shows it only for a read-only reader. The hook opens the index read-write (`packages/nana-knowledge/lib/hook.ts:180`), and the last read-write connection to close checkpoints at once. A faithful loop passed 25 of 25. `wal-probe.txt` stays as a record of what was ruled out.
- **Shown, a product bug (attack MUST 2):** `openDb` (`packages/nana-knowledge/lib/db.ts:112-120`) sets no busy timeout, and node:sqlite's default is 0. A real `nana-knowledge build` started while another process opened, read and closed read-write connections exited 1 with "Error: database is locked" at `db.ts:120`. That happened in 3 of 15 builds (adversary), 2 of 8 on the seat's re-run, and 1 of 20 with read-only readers. Its detached stdio hides the error (`hook.ts:60-64`). A failed build leaves `built_at` and the modified time unchanged. That fits "never rebuilt in 20 s". On CI it is inferred, not reproduced.
- Run 40062423521 also missed the pull block. The hook's 1500 ms budget may have fired before `ensureFreshIndex` (`bin/nana-knowledge.ts:98`, `hook.ts:175`), so no build started (inferred).

### objective-golden mechanism

The installed objective hook runs two producers under one 4000 ms deadline (`packages/nana-setup/claude/hooks/nana-objective.mjs:17-18`, `packages/nana-setup/lib/hook-producer.mjs:28`).
- The objective producer may use up to `HOOK_PRODUCER_TIMEOUT_MS` = 2500 (`hook-producer.mjs:23`, contract R-2672).
- The frontier producer gets what is left. When nothing is left, it prints its marker without running (`hook-producer.mjs:58-61`, :38).

So under load the hook prints one of three load shapes:
- the objective marker;
- the objective marker followed by the frontier marker;
- the real objective block followed by the frontier marker.

Each is correct product behaviour under load, and each fails byte-identity with pi. No golden case can legitimately print frontier output, because every BYTE-IDENTICAL check would then fail. So a frontier marker in that file is always a load signal.

## Assumptions

- A1: both markers come from their defining modules: `hookProducerConfig("objective", repoRoot).marker(cli)` (`hook-producer.mjs:50`), and `FRONTIER_TAG` and `FRONTIER_UNAVAILABLE` (`packages/nana-pack/lib/frontier-summary-config.mjs:10`, :16). The hook computes its repo root from its symlink-resolved path (`nana-objective.mjs:16`), so the test builds the objective marker from `fs.realpathSync` of the repo root.
- A2: `golden()` runs the hook from the working tree (`objective-golden.test.mjs:33`). An uncommitted mutation of `hook-producer.mjs` therefore reaches it. `hooks-win32-exec.test.mjs` installs from a detached worktree of HEAD (`:59`, :63, :110), so an uncommitted product edit does not reach it.
- A3: neither check's subject changes. R-1713 still means the stale-index hook prints the pull block and a background build rebuilds the index. The golden corpus still means hook and pi print byte-identical blocks for the same state.

## Open choices

- O1: R-1713 diagnostics, without changing its pass condition.
  - A new test helper, `packages/nana-setup/tests/knowledge-state.mjs`, exports one function. It describes a knowledge home: `index.db` modified time, WAL bytes, `build.lock` present and its age, and `built_at`. It reads `built_at` through a read-only `node:sqlite` connection opened with a busy timeout, and reports a busy error as `busy` (attack SHOULD 6).
  - The R-1713 block reads this state once before the hook, as the baseline (attack MUST 3), and once when its wait ends. It never reads it while polling; the poll stays on the modified time and the lock.
  - The check's detail adds both states. The pass condition, `REBUILD_DEADLINE_MS` and the title are unchanged.
- O2: the golden retry.
  - A new test helper, `packages/nana-pack/tests/objective-hook-retry.mjs`, exports two functions:
    - `isLoadMarker(stdout, markers)`: true when stdout holds a line starting with the objective marker's `OBJECTIVE UNAVAILABLE: producer failed (` text, or a `FRONTIER_TAG` line followed by a line starting with `FRONTIER_UNAVAILABLE producer failed (`;
    - `runWithRetry(runOnce, { cap, isLoad })`, which returns the last result and the retry count.
  - `golden()` uses them with a named cap of 2 retries, and refreshes the lock before every attempt.
  - The T17 lock-refresh cases (R-760, `objective-golden.test.mjs:1094-1109`) pass a cap of 0, so their exact refresh counts stay. The plan says so here; a load failure there remains a residual.
  - The retry count goes into the BYTE-IDENTICAL detail. The last run must be byte-identical.
- O3: case limits. Every `withCaseLimit(…, 15000)` call that wraps `golden()` (`:1356`, :1378, :1398) gets the limit plus the retry budget, from named constants (attack SHOULD 8).
- O4: the CLAUDE_PROJECT_DIR control (`objective-golden.test.mjs:676-678`) currently passes on any `OBJECTIVE UNAVAILABLE`. It then requires `file not found`, so the load marker cannot pass it (attack SHOULD 12a). This is the one other check the lane edits.

## Questions for the owner

None.

## Threat model

In scope: honest variation in machine and load. That covers:
- hosted Windows runners in a four-job pool, and the reference laptop;
- slow node start-up;
- a producer that misses its deadline;
- SQLite lock contention between the hook and its background build.

A check must still fail when its behaviour is broken: no rebuild, a hook that fails on every try, or hook and pi printing different blocks for the same state.

Out of scope: deliberate forgery, such as a hook that prints the load marker to dodge a comparison.

Residuals:
- **Product, a FEAT-013 known-bug line:** `openDb` sets no busy timeout. A background knowledge build that opens while the hook's connection closes fails with "database is locked" and leaves no trace. The index stays stale until a later prompt starts another build. The fix is in `db.ts` and makes a lane `hook`; the seat plans it from the Mac. FEAT-013 line 202's cause becomes "inferred, not reproduced on CI".
- R-1713 keeps failing on CI until that product fix lands. This lane only makes the next failure say why.
- A hook that misses its deadline 3 times in a row on one golden case still fails. So does a T17 case under load.
- worker-lane's R-2883 and wall-clock-ceiling checks stay for a later lane.

## Precedent

- `docs/reviews/windows-local-suite-2026-11-01/plan.md` — the last landed test-only Windows reliability lane: evidence first, assertions kept, a mutated run proving the check still fails. The windows-first-try plan (PR #315) follows the same shape, but it is not on main yet.
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs` — `rebuilt` and `waitForRebuilt` (29-41) and the R-1713 block (237-247).
- `packages/nana-knowledge/lib/db.ts` — `openDb` (112-120), the read-only open that `knowledge-state.mjs` copies, plus a busy timeout. Read only.
- `packages/nana-knowledge/lib/build.ts` — `setMeta(db, "built_at", …)` (421). Read only.
- `packages/nana-pack/tests/objective-golden.test.mjs` — `runHook` (121-133), `golden` (150-172), `withCaseLimit` uses (1356, 1378, 1398), the T17 cases (1094-1109), and the control at 676-678.
- `packages/nana-setup/lib/hook-producer.mjs` — `hookProducerConfig` (50) and the markers (33, 38). Imported, unchanged.
- `packages/nana-pack/lib/frontier-summary-config.mjs` — `FRONTIER_TAG` and `FRONTIER_UNAVAILABLE`. Imported, unchanged.
- `packages/nana-pack/tests/land-fixtures.mjs` and `packages/nana-pack/tests/review-ledger-fixture.mjs` — shared test helpers with the six-tag header, the form both new helpers follow.

## Outside precedent

- SQLite locking documentation (public domain), "busy_timeout" and "WAL concurrency": **borrow** only the facts that a connection with a zero busy timeout fails at once on a lock, and that closing the last connection checkpoints. No code is taken.

## Must-meet

Rows R-3540 and R-3541 go in the FEAT-031 table in `REQUIREMENTS.md` first. Each is tagged on its check by appending to that check's existing req line. FEAT-013 gains the busy-timeout line, and its line 202 is updated. (The seat records the profile-store-guards timing line in land-test-split's notes, not here.) Every check not named here stays byte-identical.

- **M1 · R-3540** — WHEN the R-1713 check fails, its detail shall name the knowledge home's state before the hook and when its wait ended: `index.db` modified time, WAL bytes, `build.lock` presence and age, and `built_at`. Its pass condition is unchanged. Proves: the next CI failure tells a failed build (unchanged `built_at`) from an unseen one. Pins:
  - the check passes on the reference laptop, alone and in the full suite;
  - a lane-folder script (`m1-state.mjs`) drives `knowledge-state.mjs` over three real homes: a completed build, a build that failed with "database is locked" (forced by holding an exclusive lock while the build opens), and a held `build.lock`. Each description shows the difference. Recorded (`m1-state-win32.txt`).
- **M2 · R-3541** — The objective golden corpus shall rerun the hook, up to 2 more times, when its stdout holds either producer's load marker. It shall compare the last run byte for byte, and report the retry count. T17 cases do not retry. Proves: a producer slow under load no longer fails byte-identity, and a hook that keeps failing, or prints a different block, still fails. Pins:
  - the file passes on the reference laptop, alone and in the full suite;
  - **mutation:** in an uncommitted copy, `HOOK_PRODUCER_TIMEOUT_MS` in `hook-producer.mjs` is set to 1. Every retrying golden case FAILs BYTE-IDENTICAL with retry count 2, and the T17 cases fail with 0. Recorded (`m2-mutation-win32.txt`), and the file restored;
  - **one-off:** a lane-folder script (`m2-retry.mjs`) drives `runWithRetry` with a stub that returns each of the three load shapes once, then the real block. Each passes with 1 retry. A stub returning a different real block fails. Recorded (`m2-retry-win32.txt`);
  - every check title is unchanged.
- **M3 (evidence)** — The locked full suite passes on the reference laptop apart from the known no-Python and no-uv failures.

Expected changes (a forecast, not a limit):
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs` and the new `knowledge-state.mjs`;
- `packages/nana-pack/tests/objective-golden.test.mjs` and the new `objective-hook-retry.mjs`;
- `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/known-bugs/FEAT-013.md`, and the code map if the helpers need entries.
