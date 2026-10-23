Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane ci-timing-records, row R-2634's test only. Class: ordinary. Builder: pi-worker (small lane). Build session 2: R-2634's revision in a detached checkout.

Work in the lane worktree on feat/ci-timing-records. Change only `packages/nana-pack/tests/ci-records.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/` or `scripts/`.

Finding F1 (the seat's pairs baseline at 56def663): R-2634 fails in a detached checkout. The test reads `BRANCH` with `git branch --show-current`, which prints nothing when HEAD is detached, and then runs ci-records with that empty revision: `ci record: revision  does not resolve to a commit: exit 1`. The seat's pair runner tests in a detached scratch worktree, and GitHub's pull-request checkout is detached too, so every CI suite leg would fail the same way. On a branch the case passes.

Precedent:
- packages/nana-pack/tests/ci-records.test.mjs — its `SHA` and `SHORT_SHA` lines, which resolve in any checkout.
- scripts/requirements-moved.mjs — `--base main` style symbolic revisions resolved through git, as ci-records resolves its own.

1. Give R-2634's symbolic-revision case a revision that resolves in every checkout, detached or not: `HEAD`. Keep the short-sha case. If you keep a branch-name case, run it only when `git branch --show-current` prints a name, and print one SKIP line naming why when it does not.
2. Keep R-2634's title, its `// req:` marker and every other case and assertion unchanged.
3. Run the file on the branch; then in a detached scratch worktree of this branch under the scratchpad (`git worktree add --detach <folder> HEAD`, run the file there with HOME, TMPDIR, TEMP and TMP pointed at temp folders, then `git worktree remove --force <folder>`). Both must pass. Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/ci-timing-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: R-2634 passes on a branch and in a detached checkout, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
