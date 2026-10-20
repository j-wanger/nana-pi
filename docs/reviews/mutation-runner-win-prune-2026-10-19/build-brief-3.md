# Brief 3: mutation-runner-win-prune

Feature: FEAT-031 (the seat mutation runner). Same worktree and branch (tip f864d4d0, which merges win-path-commands' reviewed tip). Class: ordinary. The final reviewer's round 1 (Opus) sent the lane back; its findings, verified by the reviewer's probes:

## MUST 1 — R-1775's check passes with the feature removed
With both call sites changed so neither takes the lock (the `git worktree add` in `runOneShard` and the body of `removeScratchWorktree`), `mutation-runner.test.mjs` still passes 34/34. The check drives `withWorktreeOperationLock` in two child processes with a fake operation; no worktree add, removal or retry runs inside it. Make R-1775's check exercise the RUNNER: for example run a shard in shard mode with the test setting `SEAT_MUTATE_SHARD`, `SEAT_MUTATE_SCRATCH` and `SEAT_MUTATE_WORKTREE_LOCK` (or whatever the runner reads), hold the lock file with a live pid that releases after a known delay, and assert (from `GIT_TRACE`, or an equivalent the runner records) that `worktree add` started only after the release; repeat for the removal at the shard's end. Deterministic, no timing race in the assertion. Wrong code to show red: each call site skipping the lock, separately.

## MUST 2 — the lock is not mutually exclusive (`lib/mutation-runner.mjs` about lines 132-150)
`writeFileSync(lockPath, …, { flag: "wx" })` creates an empty file, then writes the pid. A waiter reading in that gap fails `JSON.parse`, gets holder null, treats the lock as stale, deletes the live holder's lock and takes it; the first holder's `finally` then deletes the second's lock (cascade). Second race: two waiters both see a dead holder; the first deletes and recreates, the second deletes the new one. Reviewer's probe: 8 processes x 300 acquisitions with an exclusive marker inside the critical section → 63 of 2,400 overlapped; 3 processes → 8 and 24 of 900.
Fix: make the lock appear complete in one step (write the pid to a temp file in the same folder and `linkSync` it to the lock path; EEXIST means held), and remove a stale lock only if it still holds the exact content this waiter read (re-read, compare, then unlink; or rename-to-claim). An unreadable lock counts as held unless its age passes a sealed limit (provenance `chosen`). The holder's release removes the lock only if it still holds its own content.
Add a check that reproduces the reviewer's probe shape deterministically enough to be red on f864d4d0: several child processes contending, an exclusive marker inside the critical section, zero overlaps asserted. Name its row: extend R-1775 or add one row in this lane's block (R-1776 to R-1779).

## SHOULD (fix in this build)
- S1: R-1775 says "in one lane repository", but the lock lives in one run's parts folder. Narrow the row text to one run (shards of one runner run), unless you move the lock into the repository's common git folder; say which and why.
- S2: T1 runs `for (const shards of [1, CFG.WORKTREE_REMOVE_RETRIES])`, so retuning the retries changes R-1770's shard count. Give the three-shard case its own named value.
- S3: in `finish()`, a throw from the lock other than EEXIST is swallowed by `catch { /* ignore */ }`, so cleanup is skipped silently. Record one line naming the failure instead (the existing leftover-naming path is fine).

## Done
- `node packages/nana-pack/tests/mutation-runner.test.mjs` green three runs in a row; show each MUST's wrong code red (both call sites skipping the lock; the old non-atomic write; the old unconditional stale delete).
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green. Single files only; do NOT run the full suite; do NOT push; do not edit HANDOFF.md or docs/sessions/ (the seat updates them).

## Report (≤10 lines)
VERDICT; commit; the lock change; each new or changed check with red-before evidence; the row edits; the wrong-code tries.
