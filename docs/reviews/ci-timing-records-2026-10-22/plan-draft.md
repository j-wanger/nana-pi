# ci-timing-records: plan draft (planner, 2026-10-22, main 61ac64f3)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary. The lane changes `.github/workflows/ci.yml` (the suite job), `scripts/test-locked.mjs` (it loses one private helper, moved into the suite-records lib and imported back), `packages/nana-pack/lib/suite-records.mjs` and its config, one new seat script `scripts/ci-records.mjs`, tests, REQUIREMENTS.md and the README. None of these is on the install, hook or gate list. nana-setup, the Claude Code hooks, the pi extensions, the gate policy, nana-land, pi-review and review-round are untouched. Inferred, as suite-records' N4 said: every land runs the locked suite, so the seat may still want the moved helper's wrong-code pair run.

Stakes: low to medium blast, reversible. A malformed suite-job step stops CI on every push and PR until fixed. Release then stays blocked, but no data is lost. The draft PR's own CI run catches that before the land. The fetch command is report-only and changes no state.

Threat model: honest variation in our tools' output and GitHub's is in scope. That covers: a leg that fails, times out, is cancelled or crashes before the runner writes; a pi install that fails before the suite starts; "re-run failed jobs" (only the failed legs re-run, measured) and "re-run all jobs"; two ci.yml runs for one commit (pull_request, then push after an ff land, measured); a run still in progress; expired artifacts; runs made before this lane, with no artifact; an artifact of another name in the same run; a run of another workflow at the same commit; gh missing, signed out, rate-limited or offline; a short sha, a branch name or HEAD as the revision; Windows' backslash temp path in the knob; an artifact holding no JSON file or two; a record of another schema; SKIP entries with 0 seconds; no runtime map in this clone, a map of another schema, a map at another tip; test files present in CI but not in the map, or the reverse. Deliberate forgery is out: a hand-uploaded artifact with a record name, a forged record, a tampered gh. Public repo: no text in this lane names the owner or the owner's work, and no code holds the repository slug (gh's `{owner}/{repo}` placeholders resolve it from the checkout's remote).

## Measurements (seat Mac, 2026-10-22, read-only GET calls and local reads)

| Question | Result | Source |
|---|---|---|
| Artifacts today | 0 | `gh api repos/{owner}/{repo}/actions/artifacts` total_count |
| Artifact retention | 90 days, maximum 90; repo is public | `gh api .../actions/permissions/artifact-and-log-retention`, `gh api repos/{owner}/{repo}` |
| Runs per commit | 61ac64f3 has two ci.yml runs: pull_request 39835745432 (attempt 1) and push 39840123612 (attempt 2). A pull_request run's `head_sha` is the PR head, so one head-sha query finds both | `gh api .../actions/runs?head_sha=…` |
| A "re-run failed jobs" attempt | Attempt 2 of 39840123612 re-ran only `install-check (windows-latest)`. The latest-attempt jobs list still shows every suite leg at attempt 2, with attempt 1's start and end times | `gh api .../runs/39840123612/jobs?filter=latest` and `filter=all` |
| Matrix job names | `suite (macos-latest)`, `suite (ubuntu-latest)`, `suite (windows-latest)` | same jobs listing |
| CI per-file seconds at 61ac64f3 (attempt 1, parsed from the three suite logs) | macOS: 208 files, 206 PASS, 2 SKIP, wall 602.6 s, file seconds 1,899.6 s, slowest review-ledger 143.8 s. Linux: 205 PASS, 3 SKIP, 393.3 s, 1,335.5 s, slowest requirements-regroup 81.2 s. Windows: 190 PASS, 18 SKIP, 1,024.7 s, 3,143.9 s, slowest review-ledger 295.1 s (33% of the 900 s per-file limit) | job logs, `gh api .../actions/jobs/<id>/logs` |
| Local record at the same tip | land record, jobs 4, under coverage: 208 files, 471.8 s wall, 1,378.3 file seconds, 18,762 bytes. The runtime map is at 61ac64f3 too: 208 tests, 115 PASS at 1 s or more | `.git/nana/suite-runs/`, `.git/nana/runtime-map.json` |
| CI-to-map seconds ratio, per file (PASS in the map, map at 1 s or more) | macOS n=115: median 1.52, p10 1.03, p90 2.28. Linux n=114: 1.08, 0.53, 2.15. Windows n=101: 2.51, 0.98, 4.41 | logs against the land record at the same tip |
| API sizes | runs for one sha (2 runs): 23,880 bytes. Jobs for one run (12 entries): 18,617 bytes | `wc -c` of the GET output |
| gh | 2.91.0 on the seat Mac. `gh run download --help`: a single named artifact extracts into `--dir` itself | help text |
| gh in tracked code | none outside docs/reviews and one test comment | `git grep` |
| Knob reaches no test | the runner strips every ambient NANA_* but NANA_TEST_* from test children (scripts/test.mjs:17, :30, :323). So a runner a test starts never writes the leg's record. Inferred from code; the local land records' 208-file counts agree | code read |
| Job wall against suite wall | macOS job 643 s against 602.6 s; Windows 1,164 s against 1,024.7 s; Linux 422 s against 393.3 s | job timestamps |
| Upload step cost | 1 to 2 s per leg. Inferred: suite-records' plan read it from upload-artifact's own CI; not measured on this repo | suite-records plan-draft §2 |
| Red on main | ci.yml sets no record knob and has no upload step; scripts/ci-records.mjs does not exist | grep, ls |

## Reuse

Precedent:
- scripts/test.mjs — the record knob write at :597-614 (R-2546). CI only sets `NANA_SUITE_RECORD_FILE`; the runner does not change. Skip entries carry 0 seconds (:451, :511).
- scripts/test-locked.mjs — `readRunRecord` at :181-190. MOVE it into suite-records.mjs and import it back, with its three messages unchanged so R-2553's cases stay green. A copy in the new script would be a finding.
- packages/nana-pack/lib/suite-records.mjs — `defaultGit` and `gitText` (:25-34), `numberText` and `finalFiles` (:166-178), and the PASS and FAIL counts in `suiteRecordLines` (:247-248). Export `finalFiles`, and extract one `recordCounts(record)` that `suiteRecordLines` and the new script both call. The slower list's text form (:194) sets the slowest list's form.
- packages/nana-pack/lib/suite-records-config.mjs — the home for the new names, each with provenance; `RECORD_LINE_PREFIX` (:35) sets the shape of the new line prefix.
- packages/nana-pack/lib/runtime-map.mjs — `dataPath` (:33-41) and `loadRuntime` (:62-77), with its never-throw reasons, read the map for the comparison line.
- packages/nana-pack/lib/runtime-map-config.mjs — `DATA_FILE_ENV` (`NANA_RUNTIME_MAP_FILE`) points a test at a fixture map.
- packages/nana-pack/lib/release-status.mjs — a read-only reader with an injected `(cwd, args)` runner, where each missing input becomes a line, never a throw (:42-57, R-587).
- scripts/requirements-moved.mjs — the seat-run script shape: `main(argv, git)` with an injected runner (:209) and the direct-invocation guard (:253).
- .github/workflows/ci.yml — the suite job's env with a chosen comment above each key (:61-66), the two `npm test` steps (:82-85), and the `${{ env.NANA_CI_JOBS }}` reference form.
- packages/nana-pack/tests/ci-workflow.test.mjs — the suite-job slice regex, R-2557's one-home and chosen-comment check (:182-192), R-2556's scan of every `npm test` step (:165-180), and R-1313's regex (:159-163), which needs the Windows step's `if:` directly under its `run:` line. The new step `env:` goes after `if:`.
- packages/nana-pack/tests/test-runner.test.mjs — the `rootRecord` fixture with PASS, FAIL and SKIP files and `runRecorded` (:518-537); R-2633's case reuses both.
- packages/nana-pack/tests/suite-records.test.mjs — the `check` helper, the bounded case limit and the `tmpDir` use (:34-41).
- docs/reviews/suite-records-2026-10-22/seat-titles.mjs — the seat's title check, copied for this lane.
- none: no tracked code calls gh today, so the gh runner and its JSON handling are new.

## Decisions

- **D1 · Home: FEAT-031, not FEAT-019.** suite-records' D1 named the next lane as "ci-records (FEAT-019)", in one word. This plan departs from that, for three reasons. First, the record is the suite's own output, and its siblings are CAP-07 deliverables in FEAT-031 already: R-616 (per-file lines, whose maker already lists CI) and R-2547 (the local store). Second, FEAT-031's known-bug line "CI and other machines keep none" is the gap this lane closes. Third, FEAT-019's CI rows are about gating releases. R-2631 and R-2632 are tested in ci-workflow.test.mjs beside FEAT-019's rows; a test file may serve rows of several features.
- **D2 · What a leg keeps: the runner's own schema-1 record, unchanged.** Options: `runner`, `stamp`, `locked`. `runner` sets the knob on each `npm test` step, and the runner writes the record R-2546 pins: files with label, seconds and cause, unnamed failures, exit code, wall seconds, jobs, platform and coverage. That is the record the locked suite feeds its store, before it adds git facts. `stamp` adds a CI step and script for git facts. The reader gets the commit, run, attempt and event from GitHub anyway. On a PR, HEAD is GitHub's merge commit, and `refs/heads/main` may not exist in a PR checkout (inferred). `locked` runs `npm run test:locked` in CI. It would rewrite R-2556's step form. On Windows, `--verbose` reads as a filter (a FEAT-031 known bug), so that leg would keep nothing. Recommend `runner`.
- **D3 · Upload: one step per leg.** It comes after the last `npm test` step and runs `if: ${{ !cancelled() }}`, so a failing leg uploads too. It uses actions/upload-artifact@v4, the repo's `@v4` pin convention, with the path `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}` and the name `suite-record-${{ matrix.os }}-${{ github.run_attempt }}`. Retention stays the repo's 90 days (measured), so no `retention-days`. The attempt is in the name for two reasons. A "re-run failed jobs" attempt re-runs only the failed legs (measured), so both the failing and the passing record of a re-run leg survive. That is the flake evidence. Second, a name per attempt cannot clash with an earlier attempt's (inferred: v4 refuses a second artifact of one name in a run). `if-no-files-found` stays at its default, warn. A leg whose suite never ran then warns and passes, and the reader names that leg. No `continue-on-error` on the upload step: R-1530's helper refuses any step-level one (ci-workflow.test.mjs:121-125). An artifact-service failure therefore fails the leg; that is a known limit.
- **D4 · Reader: `node scripts/ci-records.mjs [<rev>]`, default HEAD.** It resolves the revision with `git rev-parse --verify --quiet <rev>^{commit}`. Then, through an injected gh runner: `gh api repos/{owner}/{repo}/actions/runs?head_sha=<sha>&per_page=100`, keeping runs whose `path` is the CI workflow. Per run, it reads `…/runs/<id>/artifacts?per_page=100`, keeping unexpired names with the record prefix, and `…/runs/<id>/jobs?filter=latest&per_page=100` for the suite legs. Per artifact, it runs `gh run download <id> --name <name> --dir <its own temp folder>` and reads the one JSON file there through the moved `readRunRecord`. The temp root is removed in `finally`. Legs match artifacts by leg name across attempts, never by attempt, because a copied leg shows the newest attempt number (measured). The gh command can be replaced by `NANA_CI_RECORDS_GH_COMMAND`, a JSON array, as `NANA_SUITE_TEST_COMMAND` does for the locked suite (test-locked.mjs:109-114). The real CLI then runs against a node fake gh on all three systems with no shim.
- **D5 · Output.** For each record, ordered by run id, then leg, then attempt, three lines follow. The totals line names the platform and leg, the run id, attempt and event, the file count, PASS, FAIL and SKIP counts, the exit code, and wall seconds at N jobs. The slowest line lists five files, slowest first, ties by path, never a SKIP. The map line comes last (D6). Then one line per missing leg or unreadable artifact, and one closing line: the record count, the run count, the short sha, and that seconds are hosted-runner seconds under each record's job count. Exit 0 when at least one record printed; otherwise exit 1 after one line naming why.
- **D6 · Runtime map: compare, do not merge.** Options: `compare`, `merge`, `none`. `merge` puts per-platform seconds into the map. The impact block's readers are local builders choosing which tests to run, and Windows seconds do not change that choice; suite-records' D7 argued the same. A single per-platform factor misleads too. Measured on Windows, the per-file ratio runs from 0.98 at p10 to 4.41 at p90. `compare` prints one line per record: the map's tip, and the 10th, 50th and 90th percentile of CI seconds over map seconds. It counts files that passed in both and took at least 1 s in the map. The line is the evidence for the merge question every time the seat looks. It also gives the seat a Windows bound when it sets a time limit; a local 200 s file can reach about 880 s there at p90. Recommend `compare`.
- **D7 · Not in this lane.** First, an automatic CI reader, where each leg compares with main's last record of its platform; that is suite-records D7's original `defer` option. Second, nana-land reading CI, a land-tool lane. Third, log parsing for runs before this lane. Fourth, headroom against the per-file time limit; the record holds no limit. Fifth, CI records in the local store, which would become baselines for local runs of another platform.

## Must-meet rows (R-2631 to R-2638, all FEAT-031)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2631 | The root CI suite job shall set `NANA_SUITE_RECORD_FILE` to `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}` in the `env` of each `npm test` step, with `NANA_CI_RECORD_NAME` set once, in the job's `env`, under a comment holding the word `chosen`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2631: every CI suite step points the runner's record knob at the leg's temp folder` |
| R-2632 | The root CI suite job shall upload `${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}` with `actions/upload-artifact@v4`, after its last `npm test` step and under `if: ${{ !cancelled() }}`, as an artifact named `CI_ARTIFACT_PREFIX` followed by `${{ matrix.os }}-${{ github.run_attempt }}`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2632: every suite leg uploads its record after the suite, failed or not, named by leg and attempt` |
| R-2633 | WHEN the test runner writes its record under CI's `--verbose` and `--jobs` arguments, ci-records shall print that record's file, PASS, FAIL and SKIP counts equal to the runner's own totals line. | `packages/nana-pack/tests/test-runner.test.mjs::R-2633: a record the runner writes under CI's arguments reads back in ci-records with the runner's own totals` |
| R-2634 | WHEN ci-records runs for a commit, it shall print one totals line for each record artifact of each CI-workflow run whose head is that commit, naming the platform, leg, run id, attempt and event, the file, PASS, FAIL and SKIP counts, the exit code, the wall seconds and the job count. | `packages/nana-pack/tests/ci-records.test.mjs::R-2634: ci-records prints one totals line per record artifact of each CI run of the commit` |
| R-2635 | WHEN ci-records prints a record's totals line, it shall follow it with one line listing that record's `SLOWEST_LIST_MAX` slowest non-SKIP files, slowest first, each with its seconds. | `packages/nana-pack/tests/ci-records.test.mjs::R-2635: ci-records lists each record's slowest files, slowest first and capped` |
| R-2636 | WHEN ci-records prints a record, it shall print one line naming this clone's runtime-map tip and the 10th, 50th and 90th percentile of the record's seconds over the map's seconds, for files that passed in both and took at least `RATIO_MIN_SECONDS` in the map, or naming why no comparison exists. | `packages/nana-pack/tests/ci-records.test.mjs::R-2636: ci-records compares each record's seconds with the runtime map, or says why it cannot` |
| R-2637 | IF a suite leg in a run's newest attempt has no record artifact in that run, or a record artifact cannot be downloaded or read as a schema-1 run record, THEN ci-records shall print one line naming that leg or artifact and why. | `packages/nana-pack/tests/ci-records.test.mjs::R-2637: ci-records names each suite leg with no readable record and why` |
| R-2638 | ci-records shall exit 0 only when it printed at least one record, and otherwise exit 1 after one line naming the cause: an unresolved revision, a failed gh call, no CI run, or no readable record. | `packages/nana-pack/tests/ci-records.test.mjs::R-2638: ci-records exits 1 with one named line when the revision, gh or every record is missing, and 0 when a record printed` |

Plus one seal test (no row of its own; it names R-2632 and R-2634): `seal: CI suite records are suite-record- artifacts of .github/workflows/ci.yml runs, and their lines start ci record:`.

### What each test does, and why it is red on main

- **R-2631.** The test slices the suite job and finds every `- run: npm test` step. Each must carry `env:` with `NANA_SUITE_RECORD_FILE: ${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}`. The Windows step's `if:` stays directly under its `run:` line, as R-1313 needs. `NANA_CI_RECORD_NAME` occurs once as a key, in the suite job's env, under a comment holding `chosen` (R-2557's form). Red on main: ci.yml sets no knob (grep).
- **R-2632.** The test finds exactly one `uses: actions/upload-artifact@v4` step in the suite job, after the last `npm test` step. It has `if: ${{ !cancelled() }}`, `name: <CI_ARTIFACT_PREFIX>${{ matrix.os }}-${{ github.run_attempt }}` (prefix imported by name), and the same path expression as R-2631. Red on main: no upload step (0 artifacts, measured).
- **R-2633.** The test reuses `rootRecord` and `runRecorded` with `--verbose --jobs=2`. It passes the record to ci-records through a fake gh that serves it as one artifact. ci-records' file, PASS, FAIL and SKIP counts must equal the runner's `N files: P PASS, F FAIL, S SKIP` line. This is the boundary test for "the same record". Red on main: ci-records does not exist.
- **R-2634.** The fake gh holds these runs. A pull_request run at attempt 1 has macOS, Linux and Windows records. A push run at attempt 2 has Windows records `-1` and `-2`. A run of another workflow path at the same sha has a record-named artifact, which must not print. One record artifact is expired and one artifact has another name; both are skipped. The revision is given as a short sha, then as a branch name, and the fake answers only to the full sha. Each case checks the exact totals line per record and the order. Red: no command.
- **R-2635.** A record holds seven files, two of them tied, plus a SKIP at 0 s. The line lists five, slowest first, ties by path, and never the SKIP; the count is imported. Red: no command.
- **R-2636.** The map path comes through `NANA_RUNTIME_MAP_FILE`. Case one: a map at the record's tip, with files that fail in CI, take 0.4 s in the map, or are missing from the map. All three are excluded, and the three percentiles equal the nearest-rank values the test computes. Further cases: a map at another tip, where the line names it; no map file; a map of another schema, where the line carries loadRuntime's reason; and no shared files. Red: no command.
- **R-2637.** The latest-attempt jobs list has all three suite legs at attempt 2, but only Windows re-ran (the measured shape). Artifacts: macOS `-1`, Windows `-1` and `-2`, Linux none, with its job concluded `failure`. One line names the Linux leg and its job conclusion; macOS is not called missing. Further cases: a download where gh exits 1 (its first stderr line is named), a garbage JSON file, a schema-2 record, and a folder with two JSON files. Each gives one line, and the other records still print. Red: no command.
- **R-2638.** The test spawns the real CLI with `NANA_CI_RECORDS_GH_COMMAND` set to `[process.execPath, <fake gh>]` and a fixture map. Cases: an unresolvable revision; a gh command that does not exist (ENOENT); gh exiting 1 with an HTTP 401 message; no runs; a run still in progress with no artifact. Each must exit 1 with exactly one cause line. One record gives exit 0. Red: no command.

Existing tests: none should go false. R-597, R-1031, R-1313, R-2556 and R-2577 keep matching when the new `env:` sits after `if:`, and R-1530's helper sees no new `continue-on-error`. If the move of `readRunRecord` keeps its messages, R-2553's cases are unchanged.

## Tunables

`packages/nana-pack/lib/suite-records-config.mjs` unless noted:

- `NANA_CI_RECORD_NAME` `nana-suite-record.json` in ci.yml's suite-job env: chosen. It is a name in the leg's temp folder, outside the checkout, so the runner's tracked-file check and `git status` see nothing. Pinned by R-2631.
- `CI_ARTIFACT_PREFIX` `suite-record-`: contract (R-2632, R-2634). Sealed.
- `CI_WORKFLOW_PATH` `.github/workflows/ci.yml`: contract (R-597's root CI workflow; GitHub's run `path`, measured). Sealed.
- `CI_SUITE_JOB` `suite`: contract. It is ci.yml's job id; GitHub names its legs `suite (<os>)` (measured on run 39840123612).
- `CI_RECORD_LINE_PREFIX` `ci record:`: contract (R-2634 to R-2638); chosen in the shape of `RECORD_LINE_PREFIX`. Sealed.
- `SLOWEST_LIST_MAX` 5: chosen, the same cap as `SLOWER_LIST_MAX`. The top five Windows files at 61ac64f3 run from 295 s to 154 s, which covers the time-limit and run-alone questions.
- `RATIO_MIN_SECONDS` 1: chosen. The runner prints tenths, so below 1 s one tenth moves a ratio by 10% or more. It keeps 101 to 115 files per platform (measured).
- `RATIO_QUANTILES` [0.1, 0.5, 0.9], nearest rank: chosen. They show the spread the measurement found; a mean would hide it.
- `GH_PAGE_SIZE` 100: contract, GitHub REST's `per_page` maximum (inferred from GitHub's docs; not probed past 100).
- `GH_OUTPUT_MAX_BYTES` 4 MiB: chosen. Measured 23,880 bytes for two runs and 18,617 for twelve jobs, so 100 runs at about 12 KB each is about 1.2 MB.
- `GH_COMMAND_ENV` `NANA_CI_RECORDS_GH_COMMAND`: contract (R-2638); chosen in the shape of `NANA_SUITE_TEST_COMMAND`.
- The default revision `HEAD`: chosen; the seat runs the command from the lane worktree or main.

## Wrong-code pairs (each must turn its test red)

1. The upload step with GitHub's default `if` (success only), so a failing leg uploads nothing (R-2632).
2. The artifact name without `github.run_attempt` (R-2632).
3. One artifact name for all three legs, with no `matrix.os` (R-2632).
4. The knob on the non-Windows step only (R-2631).
5. The knob in the job env through a `runner` context, which GitHub does not allow there; or a literal path repeated in each step instead of the one name (R-2631).
6. Every run at the sha read, with no workflow-path filter (R-2634: the other workflow's record prints).
7. Expired artifacts or other names read (R-2634).
8. Only the newest attempt per leg kept (R-2634: the Windows `-1` line is missing).
9. All artifacts downloaded into one folder, so the second record overwrites the first (R-2634: the fake writes one file name for every artifact).
10. The revision passed to the API unresolved (R-2634: the fake answers only the full sha).
11. SKIP counted as PASS, or unnamed failures left out of FAIL (R-2633, R-2634).
12. The slowest list sorted ascending, uncapped, or holding a SKIP (R-2635).
13. Ratios over every file, a FAIL or a sub-second map entry included (R-2636).
14. A missing map that throws instead of printing a reason (R-2636).
15. Legs matched to artifacts by attempt, so the copied attempt-2 macOS leg reads as missing (R-2637).
16. A gh failure that exits 0 or throws a stack, or no record that exits 0 (R-2638).

## Known limits (the seat writes them to docs/known-bugs/FEAT-031.md before the final round)

- A pull_request run tests GitHub's merge of the head into main at run time; the record names the event, not the merged tree.
- Runs made before this lane have no record. Their per-file seconds stay only in the logs, which expire after 90 days, and nothing parses them.
- Records expire with the repo's 90-day artifact retention.
- CI seconds are hosted-runner seconds under four files at once; one record is one sample of a runner whose speed varies.
- The seat runs ci-records by hand. No land step, hook or CI step reads the records yet. An automatic reader is a later lane.
- An artifact-service failure fails the leg that uploads, and on macOS or Windows that blocks release until the seat re-runs it.
- A runner crash before its record write leaves no record; the reader names the leg with its job conclusion.
- The reader reads at most 100 runs per commit and 100 artifacts or jobs per run, with no paging.
- The comparison uses the map's coverage-run seconds, which may sit at another tip; the line names that tip.
- The record holds no per-file time limit, so headroom against `NANA_TEST_TIMEOUT_MS` is read by eye.
- ci-records needs gh, signed in. Its tests use a fake gh on every system; a real gh has been run only on the seat Mac.
- CI records never enter the local store or the runtime map.

## Docs that change

- README.md, in the suite-records paragraph at :278: one sentence saying each CI leg uploads the same runner record, and that `node scripts/ci-records.mjs [<rev>]` prints each leg's totals, its slowest files and the comparison with the runtime map. The readme check pins that the command exists.
- REQUIREMENTS.md: the eight rows in FEAT-031, and CAP-07's `Deliverables:` gains R-2632 with `Made by: R-2632 · CI: .github/workflows/ci.yml, scripts/test.mjs` and `Read by: R-2632 · code: scripts/ci-records.mjs`. R-616's person line loses "nothing keeps the seconds" and names R-2632 instead. R-1272 gains `Read by: R-1272 · code: scripts/ci-records.mjs`. Inferred: the deliverable count line moves to one more made and read by code, out of one more checked.
- docs/known-bugs/FEAT-031.md: the suite-records line "CI and other machines keep none" now holds for other machines only; plus the known limits above.
- The suite-records-config.mjs header gains the new names in `@outputs`. docs/code-map.md and docs/requirements-tree.md are regenerated. The seat writes HANDOFF and the session note before the final round.

## Seat steps

- One build session with the roster's builder (`--lane-size small` is the seat's call: one new script, no land tool). The build brief carries the Precedent section above and the runtime-map-live lesson: inject the platform in every case, and use file URLs in any generated import.
- Run the seat title check (copied from suite-records) and the sixteen wrong-code pairs on the build tip.
- Open a draft PR. Once its CI run finishes, run `node scripts/ci-records.mjs <PR head>` from the worktree. Three records must print: macOS, Linux and Windows. That is the only end-to-end proof that the upload works on every leg, Windows' backslash temp path included. Put the output in the lane folder.
- One final reviewer from another model family, on the exact tip that lands, with `requirements-moved.mjs` output in the brief.
- Cross-lane: any open lane that edits ci.yml or test-locked.mjs merges main after this one lands.

## Open for the seat (one-word defaults)

- Feature home FEAT-031 rather than suite-records' one-word FEAT-019: default `FEAT-031`.
- The runtime-map comparison line (R-2636), against no line at all: default `yes`.
- `continue-on-error` on the upload step, which would mean widening R-1530's helper so an artifact-service failure cannot block release: default `no`.
- An automatic CI reader, each leg comparing with main's last record of its platform: default `later`.
