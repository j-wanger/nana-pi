# ci-timing-records · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Spend line: the current priority (macOS and Windows working) through the owner's 2026-10-22 slate of open audit items. CI keeps no per-file seconds today (FEAT-031's known bug "CI and other machines keep none"); HANDOFF's count of first-try Windows failures is done by hand from logs. First use: the attempt-numbered records answer that count directly.

Class: ordinary (`.github/workflows/ci.yml`'s suite job, `scripts/test-locked.mjs` losing one private helper, the suite-records lib and config, a new pack lib and a thin seat script, the R-1530 helper in ci-workflow.test.mjs narrowed, tests, rows, README). Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the larger builder. Depends on land-reads-ci: this lane starts after it lands and imports its GitHub origin parser and gh runner. Stakes: low to medium blast, reversible. A malformed suite-job step stops CI on every push and PR until fixed; the draft PR's own run catches that. The reader is report-only.

Threat model: honest variation in our tools' output and GitHub's: a leg that fails, times out, is cancelled, is still running or crashes before the runner writes; a pi install that fails before the suite; "re-run failed jobs" and "re-run all jobs"; two CI runs for one commit (pull_request, then push); expired artifacts; runs before this lane; an artifact of another name; a run of another workflow at the same commit; gh missing, signed out (exit 4), rate-limited, offline, or printing a JSON error body on stdout with a non-zero exit; one run's listing failing while another prints; a short sha, a branch name or HEAD as the revision; Windows' backslash temp path; an artifact holding no JSON file or two; a record of another schema; SKIP entries with 0 seconds; a temp cleanup that fails with EBUSY on Windows. Deliberate forgery is out: a hand-uploaded artifact, a forged record, a tampered gh. Public repo: no owner name, nothing about the owner's work, and no repository slug in code (owner and repo come from origin through the shared parser).

The planner's draft (`plan-draft.md`) holds the measurements; the adversary's attack (`plan-attack.md`, M 4, S 12, N 12) changed the plan as the decisions below say. Where they disagree with this file, this file wins.

## Precedent

Precedent:
- scripts/test.mjs — the record knob write (R-2546); CI only sets `NANA_SUITE_RECORD_FILE`. SKIP entries carry 0 seconds; a self-test mismatch is an unnamed failure with no FAIL count.
- scripts/test-locked.mjs — `readRunRecord`; MOVE it into suite-records.mjs and import it back with its three messages unchanged (R-2553).
- packages/nana-pack/lib/suite-records.mjs — `defaultGit`, `gitText`, `numberText`, `finalFiles` (export it), the PASS and FAIL counts in `suiteRecordLines` (extract one `recordCounts(record)` both call), and the slower list's text form.
- packages/nana-pack/lib/suite-records-config.mjs — the home for the new names with provenance; it keeps importing only land-config.mjs (R-2553's fixture copies five config files).
- packages/nana-pack/lib/land-ci.mjs — land-reads-ci's `GITHUB_REMOTE`, `githubRepoOf` and its runs handling; the gh call form `gh api --hostname github.com repos/<owner>/<repo>/…` (GH_HOST overrides placeholders, measured).
- packages/nana-pack/bin/nana-land.mjs — land-reads-ci's exported gh runner factory with its time limit and output bound; imported, not copied.
- packages/nana-pack/lib/release-status.mjs — a read-only reader with an injected runner, where each missing input becomes a line, never a throw.
- scripts/requirements-moved.mjs — the seat-run script shape: `main(argv, git)` and the direct-invocation guard.
- .github/workflows/ci.yml — the suite job's env with a chosen comment above each key, the two `npm test` steps and their arguments, the `${{ env.NANA_CI_JOBS }}` form, and release `needs`.
- packages/nana-pack/tests/ci-workflow.test.mjs — the suite-job slice, R-2557's one-home and chosen-comment check, R-2556's scan of every `npm test` step, R-1313's regex (the Windows step's `if:` directly under `run:`), and R-1530's `continue-on-error` helper, narrowed here.
- packages/nana-pack/tests/test-runner.test.mjs — `rootRecord`, `recordedMutation` (one unnamed failure) and `runRecorded`.
- packages/nana-pack/tests/suite-records.test.mjs — `runnerFixture`, the bounded case limit and `tmpDir`.
- packages/nana-pack/tests/land.test.mjs — a JSON command knob as `[process.execPath, fake]`.
- docs/reviews/suite-records-2026-10-22/plan-draft.md — D7: compare CI records with main's, never merge them into the runtime map.

## Seat decisions

- **D1 · Home: FEAT-031** (draft D1; adversary N1). The tree checker reports a deliverable homed under another capability, and FEAT-019 sits under CAP-04, so R-2632 can be a CAP-07 deliverable only in FEAT-031. Its siblings R-616 and R-2547 are there; R-2631 and R-2632 are tested in ci-workflow.test.mjs beside FEAT-019's rows.
- **D2 · A leg keeps the runner's own schema-1 record** (draft D2; adversary N4). Each `npm test` step sets the knob; the record is R-2546's pinned schema. The log is human output (one Windows verbose log held 7,448 lines starting `PASS ` against 190 per-file lines, measured).
- **D3 · Upload: one step per leg that never fails the leg** (draft D3; adversary M4, S8). After the last `npm test` step, `if: ${{ !cancelled() }}`, `actions/upload-artifact@v4`, path `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}`, name `suite-record-${{ matrix.os }}-${{ github.run_attempt }}`, `if-no-files-found` absent (warn), no `retention-days` (the repo's 90 days), and `continue-on-error: true` on this step only. R-1530's helper is narrowed to accept exactly one step-level `continue-on-error: true` inside the `actions/upload-artifact@v4` step and still refuses one anywhere else, so an upload failure costs that leg's record, never release (the suite-records rule: a record problem never changes the suite's result).
- **D4 · Reader in a pack lib, CLI in scripts** (draft D4; adversary M1, S3, S6, S7, N12). `packages/nana-pack/lib/ci-records.mjs` (gh runner, fs and temp root injected) resolves the revision with `git rev-parse --verify --quiet <rev>^{commit}`, reads origin's owner and repo through `githubRepoOf`, and through land-reads-ci's gh runner asks `gh api --hostname github.com repos/<owner>/<repo>/actions/runs?head_sha=<sha>&per_page=100`, keeping runs whose `path` is the CI workflow; per run, `…/runs/<id>/artifacts?per_page=100` (unexpired, record prefix) and `…/runs/<id>/jobs?filter=latest&per_page=100` (suite legs); per artifact, `gh run download <id> --name <name> --dir <its own temp folder>`, read through the moved `readRunRecord`. A gh call fails on any non-zero exit, whatever stdout holds. Legs match artifacts by leg name across attempts. The temp root's removal is wrapped: a failure prints one line naming the folder and the exit code stays. `scripts/ci-records.mjs` is a thin `main(argv, gh)` CLI. The gh command can be replaced through `NANA_CI_RECORDS_GH_COMMAND`, a JSON array, for tests.
- **D5 · Output** (draft D5; adversary S4, S5, N9). For each record, ordered by run id, then leg, then attempt: a totals line (platform and leg, run id, attempt and event, files, PASS, FAIL and SKIP counts with unnamed failures counted as the runner prints them, exit code, wall seconds at N jobs), then the slowest line (five non-SKIP files, slowest first, ties by path, each with its seconds and any non-PASS label). Then one line per leg that is still running, has no record in its run, whose newest attempt started after its newest record was made ("attempt N left no record"), or whose artifact cannot be downloaded or read; and one line per run whose artifact or job listing failed. A closing line gives the record count, the run count, the short sha, and that seconds are hosted-runner seconds under each record's job count. Exit 0 when at least one record printed; otherwise exit 1 after one line naming why.
- **D6 · No runtime-map comparison** (adversary M3). The ratio line, its two tunables, the map read and its quantile routine are dropped; suite-records' D7 already decided not to merge CI seconds into the map, and the slowest line gives real Windows seconds. R-2636 stays unused. The comparison with main's last same-leg record is a later lane.
- **D7 · The reader is a person, recorded honestly** (adversary M2). CAP-07 gains R-2632 with `Made by: R-2632 · CI: .github/workflows/ci.yml, scripts/test.mjs` and `Read by: R-2632 · person: the seat runs scripts/ci-records.mjs by hand; no land step, hook or CI step runs it`. The deliverables count stays at 14 made and read by code, out of one more checked. A later lane can make nana-land print the tip's record lines (owner question, default `later`).
- **D8 · Not in this lane** (draft D7). An automatic comparison with main's last record; nana-land reading the records; log parsing for earlier runs; headroom against the per-file time limit; CI records in the local store.

## Must-meet rows

All in FEAT-031.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2631 | The root CI suite job shall set `NANA_SUITE_RECORD_FILE` to `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}` in the `env` of each `npm test` step, with `NANA_CI_RECORD_NAME` set once, in the job's `env`, under a comment holding the word `chosen`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2631: every CI suite step points the runner's record knob at the leg's temp folder` |
| R-2632 | The root CI suite job shall upload `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}` with `actions/upload-artifact@v4`, after its last `npm test` step, under `if: ${{ !cancelled() }}` and `continue-on-error: true`, with no `if-no-files-found: error`, as an artifact named `CI_ARTIFACT_PREFIX` followed by `${{ matrix.os }}-${{ github.run_attempt }}`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2632: every suite leg uploads its record after the suite, failed or not, named by leg and attempt, without failing the leg` |
| R-2633 | WHEN the test runner writes its record under the arguments ci.yml's `npm test` steps pass, ci-records shall print that record's file, PASS, FAIL and SKIP counts equal to the runner's own totals line. | `packages/nana-pack/tests/ci-records.test.mjs::R-2633: a record the runner writes under CI's arguments reads back in ci-records with the runner's own totals` |
| R-2634 | WHEN ci-records runs for a commit, it shall print one totals line for each unexpired record artifact of each CI-workflow run whose head is that commit, naming the platform, leg, run id, attempt and event, the file, PASS, FAIL and SKIP counts, the exit code, the wall seconds and the job count. | `packages/nana-pack/tests/ci-records.test.mjs::R-2634: ci-records prints one totals line per record artifact of each CI run of the commit` |
| R-2635 | WHEN ci-records prints a record's totals line, it shall follow it with one line listing that record's `SLOWEST_LIST_MAX` slowest non-SKIP files, slowest first, each with its seconds and any non-PASS label. | `packages/nana-pack/tests/ci-records.test.mjs::R-2635: ci-records lists each record's slowest files, slowest first and capped` |
| R-2637 | IF a suite leg in a run's newest attempt is still running, has no record artifact in that run, or started its newest attempt after its newest record was made, or a record artifact cannot be downloaded or read as a schema-1 run record, or a run's artifact or job listing fails, THEN ci-records shall print one line naming that leg, artifact or run and why. | `packages/nana-pack/tests/ci-records.test.mjs::R-2637: ci-records names each suite leg with no readable record and why` |
| R-2638 | ci-records shall exit 0 only when it printed at least one record, and otherwise exit 1 after one line naming the cause: an unresolved revision, a failed gh call, no CI run, or no readable record. | `packages/nana-pack/tests/ci-records.test.mjs::R-2638: ci-records exits 1 with one named line when the revision, gh or every record is missing, and 0 when a record printed` |

Plus one seal test naming R-2632 and R-2634: `packages/nana-pack/tests/ci-records.test.mjs::seal: CI suite records are suite-record- artifacts of .github/workflows/ci.yml runs, and their lines start ci record:`. R-2636 is left unused (D6).

### What each test does, and why it is red on main

The gh fakes run as `[process.execPath, <fake>]` through `NANA_CI_RECORDS_GH_COMMAND` on every platform. Every failing fake exits non-zero and prints a JSON error body on stdout, as real gh does (a 404 prints `{"message":"Not Found",…}` on stdout and `gh: Not Found (HTTP 404)` on stderr, exit 1; signed out exits 4).

- **R-2631.** Slice the suite job; every `- run: npm test` step carries `env:` with the knob after its `if:`; the Windows step's `if:` stays directly under `run:` (R-1313); `NANA_CI_RECORD_NAME` occurs once as a key, in the job env, under a `chosen` comment. Red on main: no knob.
- **R-2632.** Exactly one `uses: actions/upload-artifact@v4` step after the last `npm test` step with `if: ${{ !cancelled() }}`, `continue-on-error: true`, no `if-no-files-found: error`, the name built from the imported prefix, and the knob's path expression. R-1530's narrowed helper still refuses a `continue-on-error` on any other step (a fixture with one on an `npm test` step is refused). Red on main: no upload step.
- **R-2633.** Runs the real runner through `runnerFixture` with the arguments read from ci.yml's two `npm test` lines (`NANA_CI_JOBS` from the job env, `--verbose` for the Windows form), over a fixture with PASS, FAIL and SKIP files and a tracked-file change that gives one unnamed failure; a fake gh serves the record as one artifact; ci-records' counts equal the runner's printed `N files: P PASS, F FAIL, S SKIP` line. Red on main: no ci-records.
- **R-2634.** The fake holds a pull_request run at attempt 1 with macOS, Linux and Windows records; a push run at attempt 2 with Windows `-1` and `-2`; a run of another workflow path at the same sha with a record-named artifact (not printed); an expired record and another-named artifact (skipped); each artifact served with the same file name, so separate folders are needed. The revision as a short sha, then a branch name; the fake answers only the full sha. Exact totals lines and order. Red on main: no command.
- **R-2635.** A record of seven files, two tied, one timed-out FAIL and a SKIP at 0 s: five listed, slowest first, ties by path, the FAIL with its label, never the SKIP; the count imported. Red: no command.
- **R-2637.** The measured re-run shape: all three legs at attempt 2 in the latest jobs list, only Windows re-ran; artifacts macOS `-1`, Windows `-1` and `-2`, Linux none with its job `failure`: one line names Linux and its conclusion, macOS not called missing. A leg `in_progress`: named as still running. A leg whose attempt 2 started after its only record: "attempt 2 left no record". A download where gh exits 1 (first stderr line named), garbage JSON, a schema-2 record, a folder with two JSON files, and the jobs call failing for one run while another prints with exit 0. An injected removal that throws EBUSY: one line naming the folder, exit code unchanged. Red: no command.
- **R-2638.** The real CLI: an unresolvable revision; a gh command that does not exist (ENOENT); gh exiting 4 signed out; gh exiting 1 with a JSON error body; no runs; a run in progress with no artifact: each exits 1 with one cause line. One record: exit 0. Red: no command.

Existing tests made false (listed edits): R-1530's helper narrowed (D3). R-597, R-996, R-1031, R-1313, R-2556, R-2557, R-2558 and R-2577 keep matching with the new `env:` after `if:`; R-2553's cases stay green with the moved `readRunRecord`.

## Tunables (`packages/nana-pack/lib/suite-records-config.mjs` unless noted)

- `NANA_CI_RECORD_NAME` `nana-suite-record.json` in ci.yml's suite-job env — chosen: a name in the leg's temp folder, outside the checkout. Pinned by R-2631.
- `CI_ARTIFACT_PREFIX` `suite-record-` — contract (R-2632, R-2634). Sealed.
- `CI_WORKFLOW_RUN_PATH` `.github/workflows/ci.yml` — contract: GitHub's run `path` (measured). Not `CI_WORKFLOW_PATH`, which ci-workflow.test.mjs already reads as an override. Sealed.
- `CI_SUITE_JOB` `suite` — contract: ci.yml's job id; legs are named `suite (<os>)` (measured).
- `CI_RECORD_LINE_PREFIX` `ci record:` — contract (R-2634 to R-2638), in `RECORD_LINE_PREFIX`'s shape. Sealed.
- `SLOWEST_LIST_MAX` 5 — chosen: `SLOWER_LIST_MAX`'s cap; the top five Windows files at 61ac64f3 run from 295 s to 154 s.
- `GH_PAGE_SIZE` 100 — measured: `per_page=150` returns 100 (2026-10-22).
- `GH_OUTPUT_MAX_BYTES` 4 MiB — chosen: 23,880 bytes for two runs and 18,617 for twelve jobs measured, so 100 runs is about 1.2 MB, above Node's 1 MiB default.
- `GH_COMMAND_ENV` `NANA_CI_RECORDS_GH_COMMAND` — contract (R-2638), in `NANA_SUITE_TEST_COMMAND`'s shape.
- The default revision `HEAD` — chosen.
- The gh host and runner — land-reads-ci's names, imported.

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. Upload with the default `if` (R-2632).
2. Name without `github.run_attempt` (R-2632).
3. Upload path not the knob path (R-2632).
4. `if-no-files-found: error` (R-2632).
5. Knob on the non-Windows step only (R-2631).
6. `continue-on-error` moved onto an `npm test` step (R-1530 via R-2632's helper case).
7. No workflow-path filter, or expired and other-named artifacts read (R-2634).
8. Only the newest attempt per leg kept (R-2634).
9. Every artifact downloaded into one folder (R-2634).
10. The revision passed unresolved (R-2634).
11. Unnamed failures left out of FAIL (R-2633).
12. Slowest list ascending, uncapped or holding a SKIP (R-2635).
13. Legs matched to artifacts by attempt (R-2637).
14. A running leg reported as missing (R-2637).
15. gh's status ignored, or only status 1 treated as failure (R-2638).

## Known limits (the seat writes them to docs/known-bugs/FEAT-031.md before the final round)

- A pull_request run tests GitHub's merge of the head into main at run time; the record names the event, not the merged tree.
- Runs before this lane have no record; their per-file seconds stay only in logs that expire after 90 days.
- Records expire with the repo's 90-day artifact retention.
- CI seconds are hosted-runner seconds under four files at once; one record is one sample.
- The seat runs ci-records by hand; no land step, hook or CI step reads the records (D7).
- An upload failure leaves that leg without a record; the reader names it.
- A runner crash before its record write leaves no record; the reader names the leg with its job conclusion.
- At most 100 runs per commit and 100 artifacts or jobs per run, with no paging.
- The record holds no per-file time limit, so headroom against `NANA_TEST_TIMEOUT_MS` is read by eye.
- ci-records needs gh, signed in; its tests use a fake gh on every system, and a real gh has run only on macOS.
- Artifacts' `created_at` and the cross-attempt artifact listing are inferred from GitHub's schema until the seat's re-run step confirms them.
- CI records never enter the local store or the runtime map.
- The suite-records line "CI and other machines keep none" now holds for other machines only.

## Docs that change

- README.md, the suite-records paragraph: each CI leg uploads the same runner record, and `node scripts/ci-records.mjs [<rev>]` prints each leg's totals and slowest files; Dependencies: ci-records shells out to gh, signed in, tested with a fake and with a real gh on macOS only.
- REQUIREMENTS.md: seven rows in FEAT-031; CAP-07's deliverable lines for R-2632 (D7); R-616's stale person line ("nothing keeps the seconds") names R-2547 and R-2632 instead.
- docs/known-bugs/FEAT-031.md: the known limits above.
- The suite-records-config.mjs header gains the new names; docs/code-map.md and docs/requirements-tree.md regenerated.

## Seat steps

- Start after land-reads-ci lands; cut the worktree from that main.
- Build with the larger builder; the build brief carries a Precedent section and passes brief-check.
- The fifteen pairs on the build tip.
- Draft PR; once its CI finishes, `node scripts/ci-records.mjs <PR head>` from the worktree must print three records (macOS, Linux, Windows). Then re-run the Linux leg (`gh run rerun <id> --job <job id>`) and confirm its `-1` and `-2` records print and the copied legs are not called missing. Put both outputs in the lane folder.
- One final reviewer from another model family on the exact tip, with `requirements-moved.mjs` output.
- Cross-lane: any open lane editing ci.yml or test-locked.mjs merges main after this one lands.

## Owner questions (defaults taken; none blocks)

- nana-land prints the tip's CI record lines at each land, making the records read by code: `later` (a land-tool lane).
- A comparison line against main's last same-leg record: `later`.
