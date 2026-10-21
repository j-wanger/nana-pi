# Review round 3 — knowledge-index-recover, 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Round 2 reviewed `e5ccdadc`. The final reviewer said LAND: only builds write index.db, builds hold the build lock, and the index is derived from its sources, so it judged the gap between the lock check and the delete immaterial. The land reviewer sent it back with one MUST: a writer that takes the write lock after the check closes its handle, commits, and starts another write has its file deleted under it (reproduced with a scheduling probe on macOS). Its SHOULD: the Landed line's "never deletes a write-locked index" overclaimed. This is the last round the cap allows.

This round reviews only what changed since round 2: `git diff e5ccdadc..HEAD` on `feat/knowledge-index-recover`.

- `99b50507`: `build-brief-4.md`.
- `5f3567ef` (build 4): off Windows, `assertRecoveryDeleteSafe` deletes index.db, -wal and -shm while its own `BEGIN IMMEDIATE` is held, then rolls back and closes; only then does the rebuild open and create the new index. On Windows it keeps build 3's order (lock, roll back, close, delete), because an open handle blocks the delete there. A test-only `onRecoveryLocked` hook in `build()`'s options runs between taking the lock and the delete. R-2403 gains a second check: a writer arriving in that window fails as busy, and the damaged index then recovers. That check is skipped on Windows by design. R-2403's row text is unchanged.
- `c1051aa3` merges main `954b8726` (the win-hook-variant-loop land: doctor's Windows hook rows; no knowledge file). Review the merge as `git show --remerge-diff c1051aa3`. The seat's merge helper resolved HANDOFF and the session file, keeping both sides' lines, and regenerated the tree and code map.
- `0a75820a`: the seat's pairs on 5f3567ef, 28 of 31 red. B17 (build 3's order put back off Windows) survived, because the test hook ran right after the lock was taken, before that order would release it; the commit also carries the round-2 notes and `build-brief-5.md`.
- `5a6972bf` (build 5, test seam only): `onRecoveryLocked` now runs immediately before the delete, in both orders.
- The seat's pairs on 5a6972bf: 29 of 31 red (`seat-mutate-output-5a6972bf.txt`). B17 is red on R-2403's late-writer check. B9 survives as before. B4, the retry without rebuild, is declared equivalent: the recovery now deletes the files itself on every platform before the retry opens.
- The notes commit after it: HANDOFF and the session entry record round 2 and build 4. The Landed line now says what build 4 makes true; the gap line now covers Windows only; two new residuals from the final reviewer's notes. CI run 39521999905 at 5a6972bf (build 5 with the merge of main 954b8726): macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,055 checks pass, 36 skip); Ubuntu 196 PASS, 0 FAIL, 3 SKIP (7,994 pass, 56 skip); Windows 180 PASS, 1 FAIL, 18 SKIP (6,982 pass, 1 fail, 115 skip). The Windows failure is `pi-launch-limits.test.mjs`'s R-2022, a timing check this lane does not touch: that run took 6.7 s against its bound. It passed on main's run at 954b8726 and in every earlier Windows log the seat holds; the seat started a re-run of the failed Windows job. On Windows recover.test.mjs passes 10 and skips R-2403's late-writer check by design. The install check passes on macOS and Windows. The Windows leg's log is ci-windows-5a6972bf.log in this folder.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 5a6972bf):

```
tree movement 954b872..5a6972b: 10 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2400 new (implemented)
  R-2401 new (implemented)
  R-2402 new (implemented)
  R-2403 new (implemented)
  R-2404 new (implemented)
  R-2405 new (implemented)
  R-2406 new (implemented)
  R-2407 new (implemented)
  R-2408 new (implemented)
  R-2409 new (implemented)
```

Threat model and lane class as rounds 1 and 2: honest variation in our tools' output, the owner's files and other processes on the machine is in scope; deliberate forgery is out. Install, hook or gate lane: both seats' knowledge hooks start the build this lane changes.

Check: (1) round 2's MUST is closed off Windows: no writer can commit to the file a recovery deletes while the recovery runs; (2) the Windows order is honestly described, and its remaining gap is not a material problem under the threat model, or say why it is; (3) the new order adds no false failure and leaves no stray handle or file (healthy build, `--rebuild`, broken-sources keep, lost build lock, Windows); (4) the merge keeps both sides' behaviour; (5) HANDOFF and the session entry are true; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
