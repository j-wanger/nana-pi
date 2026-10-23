Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane ci-timing-records. Class: ordinary. Builder: pi-worker (small lane). Build session 3: the record download names the run.

Work in the lane worktree on feat/ci-timing-records. Change only `packages/nana-pack/lib/ci-records.mjs` and `packages/nana-pack/tests/ci-records.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows, the workflow or the README.

Finding F2 (the seat ran `node scripts/ci-records.mjs 56def663` against this branch's pull-request CI run): every download failed, and the command printed `ci record: no readable record for 56def663`. Each problem line read like this one: `artifact suite-record-macos-latest-1 from run 39892540334: download failed: error fetching artifacts: HTTP 404: Not Found (https://api.github.com/repos/<owner>/<repo>/actions/runs/12475890665/artifacts?per_page=100)`. `ci-records.mjs` passes the artifact id as `gh run download`'s first argument, and gh reads that argument as a run id. Real gh downloads the record when given the run id: `gh run download 39892540334 --repo <owner>/<repo> --name suite-record-macos-latest-1 --dir <folder>` wrote `nana-suite-record.json` and exited 0. The test's fake gh keys its downloads by the artifact id, so the test passes the wrong call.

Precedent:
- packages/nana-pack/lib/land-ci.mjs — its rerun remedy names the run id and `--repo ${repository.owner}/${repository.repo}`; give the download the same repository the API calls in `ci-records.mjs` already use.
- packages/nana-pack/tests/ci-records.test.mjs — its fake gh's `api` branch, which refuses an endpoint shape real gh would not answer; make the `run download` branch as strict.

1. In `ci-records.mjs`, call `gh run download <run id> --repo <owner>/<repo> --name <artifact name> --dir <folder>`, with the run id of the run whose artifact list named the artifact and the repository the API calls use. Keep the per-artifact folder, every problem line's wording and the exit codes.
2. In the test's fake gh, treat `run download`'s first argument as a run id, as gh does. Answer only when that run is in the state's runs, `--repo` names the fixture repository, and `--name` names an artifact of that run; otherwise answer as gh does for a missing run or artifact (exit 1, a `Not Found` message). Re-key the fixtures' downloads by run id and artifact name. With the old call (artifact id first), R-2634 must fail. Check that by hand once and say so in the report; do not commit that check.
3. Keep every title, `// req:` marker, case and assertion's meaning. R-2638's bad-download case must still print its download-failed line.
4. Run the file; run it again in a detached scratch worktree of this branch under the scratchpad (HOME, TMPDIR, TEMP and TMP pointed at temp folders); then `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/ci-timing-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: the command downloads each record by its run id, the fake gh refuses the old call, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the file's results on the branch and detached; the hand check of the old call; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
