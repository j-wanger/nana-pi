# knowledge-index-recover — build brief 3

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/knowledge-index-recover`, on top of the current tip 93b32712 (the seat's notes; the last code commit is 870b4eee). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main. `import { tmpDir } from "./tmp-dir.mjs";` on its own line in any new test file; never call mkdtempSync.

## Why
Round 1 on 93b32712: the final reviewer said LAND; the land reviewer sent it back with one MUST, which the seat reproduced on the tip.

**MUST — recovery deletes a write-locked damaged index.** A page check that fails with damage before the build writes leads `build()` to the rebuild, which deletes index.db and its sidecars without checking another connection's write lock. The build lock excludes other builds, not other SQLite writers. Reproduction (temporary home): build an index; commit a meta sentinel; overwrite the docs table's root page; open a second connection, `BEGIN IMMEDIATE`, insert a meta row; call `build()` while that transaction stays open. The tip's build succeeds and reports recovery; index.db's inode changes; a fresh handle no longer reads the committed sentinel. R-2403 says the build shall fail and keep every committed row when another connection holds a write lock; its check covers only an undamaged index.

## Do, nothing else
1. Before recovery deletes anything, take the index's write lock itself with no wait (for example a fresh connection with `busy_timeout` 0 and `BEGIN IMMEDIATE`). If that fails as busy or locked, keep index.db and its sidecars untouched and fail the build the way R-2403's undamaged case fails. Only a damage error while taking the lock, or holding the lock, lets the delete go ahead. Release the lock and close the handle before the delete on Windows if the delete needs it, and say in the report which order you chose and why.
2. Keep every other path as it is: a healthy build, `build --rebuild` with no other writer, the broken-sources keep (R-2407), the lost build lock (R-2404), and the Windows closes.
3. Widen R-2403's check, not a new row: add the combined case (damaged docs page plus a writer holding `BEGIN IMMEDIATE`) beside the undamaged one. It passes only when the build fails, index.db's inode and bytes are unchanged, and a fresh handle reads the committed sentinel after the writer rolls back. Keep R-2403's row text; it already covers both.
4. Run alone: `npm test -- packages/nana-knowledge/tests/recover.test.mjs` and the knowledge test files for sources, incremental build, unreadable root and hook; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
5. Show the new R-2403 case red with build.ts from 870b4eee and green on yours.
6. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the combined case red on 870b4eee and green now; the lock-then-delete order on Windows.
