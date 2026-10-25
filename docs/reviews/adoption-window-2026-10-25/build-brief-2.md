Feature: FEAT-014 · Create or adopt a project workspace. Lane adoption-window. Class: hook. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/adoption-window, on top of the commit that adds this brief. Session 1 left its work uncommitted in the worktree: the window read, the config module, the README sentence, three rows and their checks. Keep that work and finish it. The spec is still `docs/reviews/adoption-window-2026-10-25/must-meet.md`; build brief 1's do-not-edit list, task and checks still hold.

Session 1 stopped because `adoption-reader.test.mjs` timed out while building the R-2851 and R-2852 fixtures. Its fixture loops are quadratic:
- R-2851 rejoins the whole `prefix` array and measures it on every push, then appends to `journal` one line at a time and measures it again.
- R-2852 prepends `undated` to a 4 MiB string about half a million times.

Precedent:
- packages/nana-pack/tests/adoption-reader.test.mjs — session 1's R-2850 fixture, which builds once per padding guess, and the file's `run()` and `repo()` helpers.
- packages/nana-pack/lib/adoption.mjs — session 1's `readTail`, the in-module extraction the must-meet names.

No private helper moves to a shared module.

The task:
1. Rebuild the R-2851 and R-2852 fixtures in linear time. Make each filler line one fixed ASCII byte length. Compute line counts and offsets by arithmetic, then build each journal with one `join`. Do not call `Buffer.byteLength` inside a loop. Keep each fixture's stated shape: in R-2851, the cap starts inside the straddling `ts`-last line, and the first whole line after it is the marker; in R-2852, the read reaches the old dated line after undated lines.
2. Keep each fixture's assertion that its own geometry holds. Then the test fails, rather than passes, if a retuned cap breaks the layout.
3. The whole of adoption-reader.test.mjs must finish in under 20 seconds on this machine. Say its time in your report.
4. Finish build brief 1's task: the red cases by hand, the rows `implemented`, the README, the map regenerated, and the checks.

Checks before your one commit: adoption-reader.test.mjs alone, with its time; adoption-producer.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/adoption-window-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the three rows and the seal pass; the reader test runs in under 20 seconds; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; the reader test's time; each red case's hand check; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
