Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-records. Class: land tool. Builder: pi-worker (small lane). Build session 4.

Work in the lane worktree on feat/land-records, on top of the commit that adds this brief. Both reviewers accepted 1e77de81, but the pull request's Windows suite leg failed R-2813 there (run 40148405918). On Windows, a land whose `<common>/nana` is a file printed `...land-records.jsonl: ENOENT: ENOENT: no such file or directory...`, while the test accepts only `ENOTDIR` or `EEXIST`. Everything else that check asserts before that line passed on Windows: exit code 0, the merge, the byte-for-byte earlier output and one record line. The check stopped at that assertion, so its later cases never ran on Windows. This is a test-only fix.

Precedent:
- packages/nana-pack/tests/land-records.test.mjs — the R-2813 check (its `blocked`, `refused`, `swapped` and `capped` cases), from session 1.

No private helper moves to a shared module.

The task:
1. In the R-2813 check, the two error assertions name an error code the platform chooses. Make each accept any Node error code after the ledger path, matching `land-records\.jsonl: E[A-Z]+: `, for the `blocked` case and the `swapped` case. Keep every other assertion in the check exactly as it is.
2. Change no product file, no other test and no row.

Try by hand: in nana-land.mjs, drop the error text from the `not kept:` lines (print the path only), see R-2813 turn red under the new pattern, restore; say so in your report. Do not commit the wrong code.

Checks before your one commit: land-records.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/land-records-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: both assertions accept any error code after the ledger path, nothing else changed, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; the hand check; the full suite's summary line; map, readme, trace, tree and seat-check status.
