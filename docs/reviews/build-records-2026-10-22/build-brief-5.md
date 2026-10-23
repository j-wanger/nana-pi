Feature: FEAT-006 · Launch builders with execution limits. Lane build-records, row R-2599's test only. Class: ordinary. Builder: pi-worker (small lane). Build session 5: R-2599 on Windows.

Work in the lane worktree on feat/build-records. Change only `packages/nana-pack/tests/build-records.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/` or `bin/`.

Finding F5 (draft PR CI at 52ae45fd, Windows suite leg; the earlier run crashed before reaching this file): R-2599 fails; the file's other five checks pass. pi-worker behaves as the row says: each blocked case starts pi, keeps its exit code and prints one `pi-worker: build record: not kept: <path>: <error>` line. Two assertions are too narrow for Windows.
- With a file where the `nana` folder should be, Windows reports `ENOENT` on the open, where POSIX reports `EEXIST` or `ENOTDIR`. The start case accepts only `/EEXIST|ENOTDIR/`. The end case's `EISDIR` holds on Windows too.
- Each case checks `line.includes(LEDGER)`, where `LEDGER` is built from `os.tmpdir()`. On the Windows runner that is the 8.3 short form `C:\Users\RUNNER~1\…`, while pi-worker prints the git common folder's long form `C:\Users\runneradmin\…`.

Precedent:
- packages/nana-pack/tests/adoption-reader.test.mjs — line 21: the fixture base passed through `fs.realpathSync.native` before any path is compared.
- packages/nana-pack/tests/build-records.test.mjs — the short-path case build 3 added under R-2598, which already reads Windows paths both ways.

1. In R-2599's start case, accept `ENOENT` as well on win32 only, beside `EEXIST` and `ENOTDIR`. Keep `EISDIR` for the end case.
2. Compare each line against the ledger path in the form pi-worker prints: the real path of the ledger's folder (`fs.realpathSync.native` on the existing parent, joined with the file name), and accept the raw `LEDGER` too. Do not loosen anything else.
3. Keep R-2599's title, its `// req:` marker and every other case and assertion unchanged.
4. Try the wrong version: compare against `LEDGER` alone and accept only `EEXIST|ENOTDIR`. On this Mac it stays green, which is the point of the finding; say so. Then restore.
5. Run the file, then once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/build-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: R-2599's check accepts the error codes and path form Windows gives, the file ends 0 on macOS, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
