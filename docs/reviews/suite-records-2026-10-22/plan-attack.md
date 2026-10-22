# Plan attack: suite-records (main 08c33d94; runtime-map-live plan ae4d9359)

Probe: `git archive` copy of main in scratch `prep/sr2-adv/`; a two-file runner fixture in `prep/sr2-adv-fx/` (own git repo, temp HOME); a read-only scan of pi session files since 10-17 (`prep/sr2-adv-m/runs.mjs`). No suite run; nothing written to main or any worktree.

## MUST

**M1. The new closing lines push the runner's verdict out of the window builders read.** The runner ends with a blank line, the totals line and the failed list. The plan appends up to eight lines: baseline, three classes and up to five slower files. Measured in builder sessions since 10-17: 78 locked runs; 38 read whole, 16 through `tail`, 24 into a file. The tail sizes were 3, 5 or 8 lines in 10 of 18 reads. With the plan's output, `tail -n 5` shows only record lines, without the totals or the failed list. Fix: at most two record lines. The last line repeats the runner's PASS/FAIL counts and the failed names, then gives the classes. Slower files go on the line before it, capped. New row R-2553.

**M2. A record write can turn a passing run red; no row catches it.** The runner's coverage write is not guarded. Probe: one passing file, `NANA_COVERAGE_DIR` under a plain file. The runner printed PASS, threw ENOTDIR and exited 1. Copy that pattern for the record knob and every unwritable knob path fails a passing land. R-2552 tests only the locked suite with a fake runner, which never fails to write, so that build passes all eight rows. The same holds for setup before the run: if creating the knob's temp path, or a git call, throws inside test-locked's `try`, the catch sets exit 1 and the suite never runs. Fix: the runner writes inside try/catch, after its exit code is fixed, and prints one line on failure. The locked suite does no record work before the run that can throw. R-2552 gains a real-runner case (knob under a plain file; exit 0 stays 0, 1 stays 1) and an unwritable-temp case (the suite still runs).

**M3. The baseline rule picks the wrong record, and R-2548 passes the wrong pick.** "The newest earlier record whose tip is the merge base or an ancestor" ranks by time, not by distance. Seven worktrees exist; three sit at main ancestors (measured). A later run in a worktree left at an older main commit beats the land record at the merge base. Builders' runs before their first commit (tip on main, usually dirty) beat it too. So does a hand measure, which runtime-map-live also stamps with a land tip. R-2548's cases put the parent record older than the merge-base one, so a newest-ancestor build passes. Fix: a baseline must be clean (M5). Rank candidates by `rev-list` position first (nearest tip), then land records ahead of others, then newest. R-2548 gains two cases: a record at the parent newer than the merge-base record, and a dirty record at the merge base newer than the land record. Both must lose.

**M4. A land that passed through runtime-map-live's rerun stores a failing baseline.** D5 there: the coverage run fails file F, a plain run of F passes, and the land passes. The plan stores the coverage run's labels ("its plain rerun ... not stored"), with exit 1. Every later lane on that tip that fails F reads "failing at the baseline too". That reads as old breakage. The truth is that F failed only under coverage and passed alone. That is the one land case where the class matters. Fix: the land record carries the locked suite's final exit code. Each rerun file keeps both labels (coverage FAIL, plain PASS). R-2549 gets its own class for that case, "failed only under coverage at the baseline", checked before "failing at the baseline". New case in R-2546 and R-2549.

**M5. "Clean" ignores untracked files.** Probe: an untracked failing test in the fixture. `git diff --name-only HEAD` counts 0, and the runner collects and fails that file. Both building worktrees hold 2 untracked files each now (measured). A new test or module a builder has not added yet makes a "clean" run. Then R-2549 calls a file flaky across two different trees. Fix: dirty = the count from `git status --porcelain`, which includes untracked files but not ignored ones. R-2549 gets a case: two dirty-0 runs at one tip, one with an untracked file, never flaky.

**M6. Most stored records have no reader.** After M3 and M5, a dirty record is neither a baseline nor flaky evidence. Builders run full suites mid-edit, so most of their records are dirty. That is inferred: 2 of 2 building worktrees are dirty now. The plan keeps 300 of them and reads none, which is the orphan the ruling targets. The draft's "the per-lane slower list sums to the trend" names no command. Fix (default `lane-total`): one clause on the last record line, "this lane: N full runs, M min", summed over records whose tip is in merge-base..HEAD plus this run. It needs the same `rev-list`. The builder reads it, and the seat reads it at the land through the land prefix. It is the audit's 30% builder-time timer. Option `clean-only`: store only clean and land runs. New row R-2554.

## SHOULD

- **S1. Record each failure's cause.** Keep `timed out`, `exit N`, `signal` or `no passing check` per FAIL; the runner already computes `why`. Two lands failed on time-outs alone (FEAT-031 known bug, land suite under load). Classes then print "timed out", which tells the seat to rerun the file alone (seat rule).
- **S2. The seat rule's flake check is never stored.** A time-limit failure is rerun alone, which is a filtered run. R-2547 stores nothing for filtered runs, so the flaky class cannot see the evidence it most needs. Options: `limit` (a known limit) or `partial` (store one-file runs, used only by R-2549, with their own cap; filtered runs take no lock). Default: `limit`.
- **S3. Some failures name no file.** The runner adds a failure for "tracked repository files changed by tests" and for a self-test mismatch. Neither names a file. Exit 1 with no failing file leaves the classes empty. The record's failed list names them, and R-2545 adds a case: a test that edits a tracked file gives a record with exit 1 and that entry.
- **S4. Make file names safe on Windows.** `<UTC stamp>` must have no colon (for example `20261022T030405123Z`). R-2546 runs on the Windows leg, so an ISO stamp would turn that leg red, and the Windows leg blocks release.
- **S5. A land record cannot be told from a hand measure.** Both set `NANA_LAND_TIP` (runtime-map-live D8). So a record cannot count lands, which weakens D2 `subsume`. Fix: the locked suite's measure path stores `trigger: "measure"`. That needs no nana-land change. A land is then trigger `land` with its tip on main. The reflog gives the time, as D2 says.
- **S6. Add the knob-unset case to R-2545.** It should check that no record is written anywhere. Without it, a build that always writes (D3 `always`) passes every row. Every runner a test starts would then write.
- **S7. Store and prune inside the lock.** Do it before `releaseLock()`. On a signal, the lock is released from `termination.then`, so the store code must check `signalExitCode` first.

## NOTE

- N1. Slower-list noise is low (measured). Builder full-run pairs since 10-19, at different tips, at 10 s and 1.5×: 1 hit in 13 pairs that had every per-file line, and 0 in 23 with a looser parse. The thresholds hold.
- N2. The land's per-file labels and seconds will exist twice: in the runtime map and in the land record. Both come from one coverage run, so they cannot disagree. Building the record from that run's own records avoids a second clock.
- N3. CI four at a time: keep D9 `separate`. The Windows step runs `--verbose`. At more than one job, output appears per file, not live (FEAT-031 known bug). Hosted runners have about 3 cores on macOS and 4 on Windows (inferred, not measured here). The small lane should measure jobs 2 and 4 on both.
- N4. Class: ordinary under the AGENTS list. Every land's verdict still passes through this path. The wrong-code pairs for M2 and R-2552 cost little and are the ones to run.
- N5. The Windows skip-lines check reads only eight files (FEAT-031 known bug). So a silent Windows drop in the new `suite-records.test.mjs` goes unflagged. Give each Windows-only skip its own line anyway.
- N6. The no-baseline text should say "merge main" when main has moved past the merge base. "The next land records one" never helps a lane cut from an older main.
- N7. A runner crash (FEAT-031: EBUSY after 154 of 200 files) leaves no record, though it is the run most worth keeping. The no-record line names it. A stored stub would have no reader, so record it as a known limit.
- N8. test-locked.test.mjs makes about 12 unfiltered locked runs with cwd at the real checkout. Its fakes write no record, so the real store stays untouched. A new test whose fake writes a record must use a fixture repo, and R-2546's test asserts that the real store's count did not change.
- N9. Agreed: D1 `suite`, D2 `subsume` (with S5), D4 `files`, D7 `defer`, D8 `next`, D9 `separate`. An upload in CI alone would be an orphan.

## AMENDED rows I would accept (R-2545 to R-2554)

| Row | Change from the draft |
|---|---|
| R-2545 | As drafted, plus a knob-unset case (no record anywhere; S6) and a test that edits a tracked file (record exit 1, entry named; S3). Each FAIL carries its cause (S1). |
| R-2546 | Dirty count from `git status --porcelain` (M5). Colon-free stamp (S4). A land that went through a rerun stores the final exit and both labels for each rerun file (M4). `trigger` set (S5). Asserts the real store is unchanged (N8). |
| R-2547 | As drafted. |
| R-2548 | Candidates must be clean. Rank by nearest tip, then land records, then newest. Adds cases: a newer record at the parent and a newer dirty record at the merge base, both rejected (M3). |
| R-2549 | Adds the coverage-only class, checked before "failing at the baseline" (M4), the untracked case (M5), and the cause on each class entry (S1). |
| R-2550 | As drafted. |
| R-2551 | As drafted. |
| R-2552 | Adds a real-runner write failure and an unwritable temp folder. Each keeps the suite's own exit code, and the suite still runs (M2). |
| R-2553 | WHEN the locked suite stores a run record, it shall print at most two record lines, the last restating the runner's PASS and FAIL counts and failed names (M1). Test: `tail -n 2` of the output holds both counts and every failed name. |
| R-2554 | WHEN the locked suite stores a run record, its last record line shall name the count and summed minutes of stored full runs whose tip is in the merge base to HEAD range, this run included (M6). Test: three lane records and one off-lane record give a count of 4 with this run. |

Suggested wrong-code pairs: newest-ancestor baseline (M3); unguarded runner write (M2); `git diff` dirty count (M5); coverage labels kept at a passing land (M4); the slower list printed after the verdict line (M1).
