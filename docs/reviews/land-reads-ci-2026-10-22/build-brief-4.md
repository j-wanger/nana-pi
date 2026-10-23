Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-reads-ci, row R-2589's test only. Class: gate. Builder: pi-worker (small lane). Build session 4: the Windows branch of build 3's child PATH.

Work in the lane worktree on feat/land-reads-ci. Change only `packages/nana-pack/tests/land.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/` or `bin/`.

Finding F4 (the seat's read of build 3, 9501dcc2): on win32 the child's PATH is a folder holding only `node.cmd` and `git.cmd` shims. nana-land starts git with `spawnSync("git", …)` and no shell. On Windows, Node resolves a bare command name through PATH by trying `.com` and `.exe` only, never `.cmd`, so every git call in the child fails to start. The land would then refuse on git, not with "cannot start gh from PATH", and R-2589 would fail on the Windows leg, where it passed before build 3. The child needs no node on PATH either: it is started by `process.execPath`, and the suite command names `process.execPath` too.

Precedent:
- packages/nana-pack/tests/land.test.mjs — build 3's isolated bin and its `ghResolves` check; and the child case's PATH before build 3, node's folder plus git's folder.
- packages/nana-pack/bin/nana-land.mjs — `gitDefault`, which spawns git with no shell.

1. On win32, set the child's PATH to git's folder alone (the folder `where.exe git` names, which holds `git.exe`), with no shim. Keep build 3's `ghResolves` check over that PATH and its SKIP line when gh resolves there. Keep the POSIX branch as build 3 wrote it.
2. Keep R-2589's title, its `// req:` marker and every other case and assertion unchanged.
3. Run the file, then once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/land-reads-ci-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: on win32 the child finds git.exe and no gh, the POSIX branch is unchanged, the file ends 0 on macOS, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
