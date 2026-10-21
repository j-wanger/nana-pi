# knowledge-index-recover — build brief 4

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/knowledge-index-recover`, on top of the current tip e5ccdadc (build 3 plus the seat's notes). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. `import { tmpDir } from "./tmp-dir.mjs";` on its own line in any new test file; never call mkdtempSync.

## Why
Round 2 on e5ccdadc: the final reviewer said LAND; the land reviewer sent it back with one MUST. `assertRecoveryDeleteSafe` takes the write lock, then rolls back and closes before `buildLocked({ rebuild: true })` deletes. A connection that takes the write lock in that gap, commits, and starts another write has its file deleted under it (reproduced by the land reviewer with a scheduling probe on macOS; committed rows lost). The final reviewer judged the gap immaterial, since only builds write index.db and builds hold the build lock; the land reviewer judged it in scope. Closing the gap on macOS and Linux is cheap, so close it there.

## Do, nothing else
1. **Off Windows:** the recovery deletes index.db, `-wal` and `-shm` while its own handle still holds the write lock from `BEGIN IMMEDIATE` (zero busy timeout, as now). Order: take the lock; delete the three files; roll back and close that handle; only then let the rebuild create the new index. Closing after the new files exist could let SQLite's close remove the new `-wal` by path, so never close after the rebuild opens. A busy or locked failure while taking the lock still keeps the index and fails the build, as R-2403 needs now.
2. **On Windows:** keep build 3's order (lock, roll back, close, then delete). Windows refuses to delete a file another process holds open, so a writer that opens the index in the gap makes the delete fail and the build fail, keeping the index. Say so in a code comment.
3. Keep `--rebuild` with no recovery, the broken-sources keep, the lost build lock and every other path as they are. Keep R-2403's row text.
4. **Regression:** widen R-2403's check with a writer that arrives after the lock check. Use a test-only injected hook at the module boundary (for example an optional `onRecoveryLocked` callback in `build()`'s options, or an equivalent seam), never a sleep or timing race. The hook runs between taking the lock and the delete, opens a second connection and tries `BEGIN IMMEDIATE` and an insert. Off Windows the check passes only when that attempt fails as busy or locked, the build then recovers, and no committed row of the second connection is lost (it never committed). On Windows, skip that one case with a named skip line, because there the lock is released before the delete by design.
5. Show the new case red on build 3's `build.ts` (the writer's commit succeeds, then its file is deleted) and green on yours.
6. Run alone: `npm test -- packages/nana-knowledge/tests/recover.test.mjs` and the knowledge test files for sources, incremental build, unreadable root and hook; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
7. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the new case red on build 3 and green now; the order you used off Windows and on Windows.
