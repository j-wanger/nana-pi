Feature: FEAT-002 · Resume decisions and next actions. Lane session-start-frontier, row R-2611's test only. Class: hook. Builder: pi-worker (small lane). Build session 2: the Windows path in R-2611's check.

Work in the lane worktree on feat/session-start-frontier. Change only `packages/nana-pack/tests/frontier-summary.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/`, `bin/` or `extensions/`.

Finding F2 (draft PR CI, Windows suite leg, tip 8d87c948): R-2611 fails; it is the leg's only failure. All three cases print the right line, for example `FRONTIER UNAVAILABLE: a directory (C:\Users\runneradmin\AppData\Local\Temp\nana-test-…\frontier-dir-…\HANDOFF.md).` The check then asks whether that line includes `promptPath(path.join(root, "HANDOFF.md"))`. There `root` comes from `os.tmpdir()`, which on the runner is the 8.3 short form `C:\Users\RUNNER~1\…`. The producer prints the real path, because `canonicalCwd` uses `fs.realpathSync.native`, so the two never match. macOS passes by chance: the expected `/var/folders/…` is a substring of the printed `/private/var/folders/…`.

Precedent:
- packages/nana-pack/tests/adoption-reader.test.mjs — line 21: the fixture base passed through `fs.realpathSync.native` before any path is compared.
- packages/nana-pack/lib/adoption.mjs — `canonicalCwd`, the form the producer prints.

1. In R-2611's case only, build the expected path from `fs.realpathSync.native(root)`, so the check compares the path the producer prints on every platform. Keep the check's title, its `// req:` marker and every other assertion unchanged.
2. Run the file, then run it once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters).
3. Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/session-start-frontier-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: R-2611's check expects the path the producer prints on every platform, the file ends 0 on macOS, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
