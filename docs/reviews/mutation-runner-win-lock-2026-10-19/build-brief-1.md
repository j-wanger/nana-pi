# Build brief 1 · mutation-runner-win-lock (urgent fix; a pi gpt-5.6-sol builder)

Feature: FEAT-031 · Run checks reliably and without contaminating work (the seat mutation runner). Class: ordinary (a seat tool). Urgent fix: it ships alone; hardening later. Rows: R-1960 to R-1969 only. Follow packages/nana-pack/prompts/builder-preamble.md. Work in this worktree on feat/mutation-runner-win-lock (from main d4423eff). Single test files only; do not push; do not edit HANDOFF.md or docs/sessions/.

## What is wrong (CI evidence; verify against the code, do not trust)
mutation-runner-win-prune (landed 32d6aa8b) added a cross-process worktree-operation lock (`withWorktreeOperationLock`, `publishWorktreeLock`, `removeWorktreeLockIfOwned` in packages/nana-pack/lib/mutation-runner.mjs). Its contention check R-1776 (`mutation runner: contending child processes observe complete lock ownership and never overlap their critical sections`, mutation-runner.test.mjs) passed on Windows at f5851dc1 and at 32d6aa8b, then failed on the Windows leg in three runs in a row on tips that only add unrelated lanes (CI jobs 118401295563, 118402900334, 118407188958; the decoded failure records are below). So main's Windows leg, which blocks release, now fails about half the time on this one check.

- Run A: acquired 2264 of 2400; overlapText "6:292" (an overlap was recorded); 6 of 8 workers and the observer SIGKILLed by the test's limit; lockLeft true; markerLeft true.
- Run B: acquired 2400 of 2400; overlapText ""; 1 worker and the observer SIGKILLed; lockLeft true; markerLeft true.
- Run C: acquired 2107; all 8 workers and the observer SIGKILLed; lockLeft true; markerLeft true.

Reading: workers hang until the test kills them, and the lock (and the critical-section marker) stay on disk. One run also saw an overlap. Hypotheses to test, not facts: (1) on Windows a release `unlinkSync` of a file another process has open leaves it delete-pending; a later `linkSync` onto that name or a read of it fails with EPERM, so waiters spin; (2) a release that keeps hitting EPERM gives up after 30 s and leaves a lock naming a live pid, so every waiter waits its full 30 s limit and the test's own limit kills them; (3) the overlap may come from a holder treated as dead (pid check), from the stale-removal path's read-compare-unlink not being atomic on Windows, or from the marker a SIGKILLed worker left — decide which from the code and the record. The test's observer process may itself hold the lock file open.

## Outcome
The lock is mutually exclusive and live on Windows: no overlap, every worker finishes, and a release never leaves the lock behind while its owner is alive. R-1776's check keeps its strength (8 children, 2,400 acquisitions, zero overlap, complete ownership) — do NOT weaken, shorten or skip it; you may add diagnostics to its failure record (which worker held the lock last, release retries, reported lines).

## Tests first
- One new check per cause you fix, red on today's code on macOS through the injection hooks the lock already takes (`options.linkSync`, `readFileSync`, `unlinkSync`, `statSync`, `now`, `wait`, `report`): e.g. a release whose unlink meets delete-pending EPERM N times then succeeds must release (not leave the lock); a waiter must not enter while the holder's file is delete-pending. Name each check and its row (R-1960 ...), EARS form, one shall each.
- If you change any sealed value, its pin check names its row.

## Done
`node packages/nana-pack/tests/mutation-runner.test.mjs` green three runs in a row on macOS; each new check red on today's code (show it); trace, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green. The seat then runs the file 12 times on Windows CI; the lane lands only if all 12 pass.

## Report (≤ 10 lines)
VERDICT; commit; the cause you found and the evidence; the fix; new checks with red-before evidence; wrong-code tries; what you could not prove without Windows.
