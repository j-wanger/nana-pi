# Review round 3 — knowledge-index-recover, 2026-10-20 (Claude Opus 5.5, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Round 2 reviewed `e5ccdadc`. The final reviewer said LAND: only builds write index.db, builds hold the build lock, and the index is derived from its sources, so it judged the gap between the lock check and the delete immaterial. The land reviewer sent it back with one MUST: a writer that takes the write lock after the check closes its handle, commits, and starts another write has its file deleted under it (reproduced with a scheduling probe on macOS). Its SHOULD: the Landed line's "never deletes a write-locked index" overclaimed. This is the last round the cap allows.

This round reviews only what changed since round 2: `git diff e5ccdadc..HEAD` on `feat/knowledge-index-recover`.

- `99b50507`: `build-brief-4.md`.
- `5f3567ef` (build 4): off Windows, `assertRecoveryDeleteSafe` deletes index.db, -wal and -shm while its own `BEGIN IMMEDIATE` is held, then rolls back and closes; only then does the rebuild open and create the new index. On Windows it keeps build 3's order (lock, roll back, close, delete), because an open handle blocks the delete there. A test-only `onRecoveryLocked` hook in `build()`'s options runs between taking the lock and the delete. R-2403 gains a second check: a writer arriving in that window fails as busy, and the damaged index then recovers. That check is skipped on Windows by design. R-2403's row text is unchanged.
- `c1051aa3` merges main `954b8726` (the win-hook-variant-loop land: doctor's Windows hook rows; no knowledge file). Review the merge as `git show --remerge-diff c1051aa3`. The seat's merge helper resolved HANDOFF and the session file, keeping both sides' lines, and regenerated the tree and code map.
- The seat's pairs on 5f3567ef: PAIRS-PENDING. B17 puts the POSIX delete back after the close (build 3's order). B4, the retry without rebuild, is declared equivalent: the recovery now deletes the files itself on every platform before the retry opens.
- The notes commit after it: HANDOFF and the session entry record round 2 and build 4. The Landed line now says what build 4 makes true; the gap line now covers Windows only; two new residuals from the final reviewer's notes. CI-PENDING.

Threat model and lane class as rounds 1 and 2: honest variation in our tools' output, the owner's files and other processes on the machine is in scope; deliberate forgery is out. Install, hook or gate lane: both seats' knowledge hooks start the build this lane changes.

Check: (1) round 2's MUST is closed off Windows: no writer can commit to the file a recovery deletes while the recovery runs; (2) the Windows order is honestly described, and its remaining gap is not a material problem under the threat model, or say why it is; (3) the new order adds no false failure and leaves no stray handle or file (healthy build, `--rebuild`, broken-sources keep, lost build lock, Windows); (4) the merge keeps both sides' behaviour; (5) HANDOFF and the session entry are true; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
