Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane ci-timing-records. Class: ordinary. Builder: pi-worker (small lane). Build session 4: two test gaps in `ci-records.test.mjs`.

Work in the lane worktree on feat/ci-timing-records. Change only `packages/nana-pack/tests/ci-records.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows, the workflow, the README or any code under `lib/` or `scripts/`.

Finding F3 (the seat's wrong-code pairs at 8c72ab36, `seat-mutate-output-8c72ab36.txt`): pair p13 survived. It drops the start-time half of the left-no-record check, so a leg is called missing whenever its job attempt is newer than its newest record. R-2637's fixture already holds that case: run 40's macos-latest job is attempt 2 but started at 00:30, before its attempt-1 record was made at 01:30. That is a leg GitHub copied into a re-run without running it again. Under the mutant the command prints `run 40 macos-latest: attempt 2 left no record`, but the test only checks that `macos-latest: no record` is absent, so it stays green.

Finding F4 (seat read of build 3): the fake gh's download branch compares `--repo` with the literal `j-wanger/nana-pi`. `ci-records` reads the repository from the checkout's origin, so a fork or a clone with another github.com origin fails R-2634 and every other download case. The test should expect the repository the checkout's own origin names.

Precedent:
- packages/nana-pack/tests/ci-records.test.mjs — R-2637's existing absence check for `macos-latest: no record`; widen that same check.
- packages/nana-pack/lib/land-ci.mjs — `githubRepoOf`, which `ci-records.mjs` imports to turn the origin URL into the owner and repository; the test derives its expected value the same way, by importing it over the same `git remote get-url origin` read.

1. In R-2637, assert that the output names no problem for run 40's macos-latest leg at all: no line containing `run 40 macos-latest:`. Keep the existing assertions.
2. In the fake gh, compare `--repo` with the repository the checkout's origin names, read once at the top of the test and passed to the fake through its state. Remove the literal.
3. Keep every title, `// req:` marker, case and assertion's meaning. Hand-check once that p13's mutant (`if (attempt > newest.identity.attempt)` in place of the two-part condition in `ci-records.mjs`) turns R-2637 red; revert it, say so in the report, and do not commit it.
4. Run the file on the branch and in a detached scratch worktree of this branch under the scratchpad (HOME, TMPDIR, TEMP and TMP pointed at temp folders); then `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/ci-timing-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: R-2637 turns red under p13's mutant, the fake reads the repository from the checkout, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the file's results on the branch and detached; the hand check of p13; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
