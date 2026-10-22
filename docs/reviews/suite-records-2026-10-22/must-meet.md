# suite-records · must-meet (seat and plan adversary, 2026-10-22)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (the runner, the locked suite, a new library and its config, tests, the ledger, the README; no install, hook, gate or land-tool file). Ladder: one final reviewer from another model family, the seat's wrong-code pairs first, and the Windows CI leg on a draft PR. Threat model: honest variation in scope — two worktrees running at once, Ctrl-C, SIGTERM or SIGHUP, `--jobs=2` or `--verbose` read as filters (FEAT-031's known bug), a checkout with no main branch or no git, a detached, dirty or untracked-file HEAD, a lane that merged main, Windows rename and delete errors when pruning, an older schema, leftover temp files, a full disk, an unwritable knob path, and a land whose coverage run failed and whose plain rerun passed; deliberate forgery out (hand-edited records, a hand-set `NANA_LAND_TIP`, a knob pointed at another clone's store).

Ruling: the owner, 2026-10-22, top priority — a produced artifact is a feature to maintain, and the timers on each step and test should come from the runs made many times a day, not from hand commands. Inputs: the planner's draft (`plan-draft.md`) and the adversary's attack (`plan-attack.md`) at main 08c33d94, with runtime-map-live landed first (its land tip, land note prefix and rerun path).

## What changes for the user

Every unfiltered locked suite run keeps one record of each file's label, cause and seconds. The same run reads the store back and says, in its last two lines, which earlier run it compares with, which failures are new, which failed before, which failed only under coverage, which passed in another clean run at this tip, which files got much slower, and how many full runs and minutes this lane has spent. Lands make the baselines; builders' runs read them; the seat reads them at the land through the land note prefix. A record problem never changes the suite's exit code.

## Seat decisions (not the owner's call; each is reversible)

- **D1 Scope: `suite`.** The runner's record and the locked suite's reader. CI records (FEAT-019) and build and review cost (FEAT-035) are next lanes.
- **D2 Land line: `subsume`.** The land's own record carries the land tip and trigger `land`; main's reflog has the land time. No nana-land change; no tally line (one refuses every admission, measured).
- **D3 Who writes: `knob`.** The runner writes only when `NANA_SUITE_RECORD_FILE` names a file, inside a try/catch after its exit code is fixed (adversary M2). The locked suite sets the knob for unfiltered runs only, and does nothing before the run that can throw.
- **D4 Store: `files`.** One JSON file per run in `<git common dir>/nana/suite-runs/`, colon-free UTC stamp (adversary S4), store and prune inside the lock, before release, skipped on a stop signal (S7).
- **D5 Reader: `compare`.** The locked suite's closing record lines. A session-start notice waits for the audit's hook queue; report confirmation of a FAIL is FEAT-039's lane.
- **D6 Baseline: nearest clean (adversary M3).** Candidates are clean records whose tip is the run's merge base with `refs/heads/main` or an ancestor of it. Rank by distance from the merge base first, then land records ahead of others, then newest.
- **D7 Clean means `git status --porcelain` is empty (M5).** Untracked files count; ignored files do not.
- **D8 A land through the rerun (M4).** The record carries the locked suite's final exit code; each rerun file keeps its coverage label and its plain label.
- **D9 Lane total: `lane-total` (M6).** The last record line counts stored full runs whose tip is in the merge base to HEAD range, this run included, with their summed minutes. That is the reader for builders' dirty records.
- **D10 Filtered reruns: `limit` (S2).** A one-file rerun after a time-limit failure stores nothing; recorded as a known limit.
- **D11 CI four at a time: `separate` (N3).** Its own small lane.

## Must-meet rows

R-2546 to R-2555 (R-2522 to R-2545 are taken by runtime-map-live, deliverable-fields and its lane B). The draft and the attack number these rows R-2545 to R-2554; each moves up by one here. R-2546 is in `packages/nana-pack/tests/test-runner.test.mjs`; the rest are in a new `packages/nana-pack/tests/suite-records.test.mjs` with a fixture repo and a linked worktree, a fake suite through `NANA_SUITE_TEST_COMMAND` that writes a record to the knob path, and a temp lock.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2546 | WHILE `NANA_SUITE_RECORD_FILE` names a file, WHEN every collected file has run, the test runner shall write one run record there with each file's path, label, seconds and failure cause, each failure that names no file, the exit code, wall seconds, job count, platform and whether the coverage knob was set. | `packages/nana-pack/tests/test-runner.test.mjs::R-2546: with the record knob set, the runner writes one run record with every file's label, seconds and cause, each unnamed failure, the exit code, wall seconds, job count, platform and coverage` |
| R-2547 | WHEN an unfiltered locked run ends without a stop signal, the locked suite shall store its run record with HEAD, HEAD's merge base with `refs/heads/main`, the `git status --porcelain` entry count, the trigger, the final exit code and any land tip as one new file under the git common directory's `nana/suite-runs/`, keeping only the newest `SUITE_RECORDS_KEEP`. | `packages/nana-pack/tests/suite-records.test.mjs::R-2547: an unfiltered locked run stores one record naming HEAD, the main merge base, the dirty count, the trigger, the final exit code and the land tip under the git common directory, and keeps only the newest records` |
| R-2548 | IF a locked run is filtered, `--jobs=2` included, or ends on SIGINT, SIGTERM or SIGHUP, THEN the locked suite shall set no record knob and store no record. | `packages/nana-pack/tests/suite-records.test.mjs::R-2548: filtered and stopped locked runs store no record` |
| R-2549 | WHEN the locked suite stores a run record, its first record line shall name the clean stored record nearest the run's main merge base among the merge base and its ancestors, preferring a land record and then the newest at equal distance, with its tip, age in whole hours, coverage flag and both runs' wall seconds, or say that no baseline exists and what records one. | `packages/nana-pack/tests/suite-records.test.mjs::R-2549: a locked run names the nearest clean baseline record, land first, or says none exists and what records one` |
| R-2550 | WHEN a locked run with a baseline has failing files, the locked suite shall put each in exactly one class with its cause, checked in this order: passing in another stored record at this tip with both runs clean, failed only under coverage at the baseline, failing at the baseline too, or new. | `packages/nana-pack/tests/suite-records.test.mjs::R-2550: a locked run sorts each failing file into passing in another clean run at this tip, failed only under coverage at the baseline, failing at the baseline too, or new` |
| R-2551 | WHERE a run and its baseline ran the same job count, the locked suite shall list on its first record line, largest growth first and at most `SLOWER_LIST_MAX`, each file at least `SLOWER_MIN_SECONDS` slower and `SLOWER_MIN_RATIO` times slower than at the baseline. | `packages/nana-pack/tests/suite-records.test.mjs::R-2551: a locked run lists files slower than the baseline by the declared margins, largest first, and none when job counts differ` |
| R-2552 | WHILE `NANA_LAND_TIP` names the checkout's HEAD, the locked suite shall print each record line with the land note prefix. | `packages/nana-pack/tests/suite-records.test.mjs::R-2552: a land's locked run prints its record lines with the land note prefix` |
| R-2553 | IF the run record is missing, unreadable or cannot be written or stored, THEN the locked suite shall run the suite, exit with the suite's own code and print one record line naming why. | `packages/nana-pack/tests/suite-records.test.mjs::R-2553: a missing, unreadable, unwritable or unstorable record keeps the locked run's exit code and names why` |
| R-2554 | WHEN the locked suite stores a run record, it shall print at most two record lines, the last restating the runner's PASS and FAIL counts and every failed name. | `packages/nana-pack/tests/suite-records.test.mjs::R-2554: a locked run prints at most two record lines and the last restates the PASS and FAIL counts and every failed name` |
| R-2555 | WHEN the locked suite stores a run record, its last record line shall name the count and summed minutes of stored full runs whose tip is in the merge base to HEAD range, this run included. | `packages/nana-pack/tests/suite-records.test.mjs::R-2555: a locked run names this lane's stored full-run count and minutes` |

### What each test does, and why it is red on main

- **R-2546.** A pass, a fail and a skip file, at `--jobs=1` and `--jobs=2`; the record matches the printed lines; each FAIL carries its cause (`timed out`, `exit N`, `signal`, `no passing check`). A test that edits a tracked file gives exit 1 and that unnamed failure in the record (S3). With the knob unset, no record anywhere (S6). Red: the knob is ignored (measured).
- **R-2547.** Run from the linked worktree with one modified and one untracked file and the store pre-filled to the cap; read from the main checkout: the dirty count is 2, the trigger is `run`, the file name has no colon. A land case through runtime-map-live's rerun path (fake coverage run fails one file, plain rerun passes) stores the final exit 0 and both labels for that file (M4). A measure-path case stores trigger `measure` (S5). The real store's file count is unchanged (N8). Red: no store.
- **R-2548.** Path filter, `--jobs=2`, a stop mid-run; the store is compared byte for byte and the fake logs its knob. Green on main; a build that keeps them turns it red.
- **R-2549.** Records at the merge base (land), at its parent and newer (loses), at the merge base and dirty and newer (loses), a land and a run record at one tip (land wins), at a newer tip off main (skipped). A repo with no main says none, never a git error. The no-baseline text says "merge main" when main has moved past the merge base, otherwise that the next land records one (N6). Red: no line.
- **R-2550.** Each class once; a dirty run whose file is never called flaky; two clean-by-diff runs, one with an untracked file, never flaky (M5); a baseline whose file failed under coverage and passed in the plain rerun gives the coverage-only class (M4). Red: no lines.
- **R-2551.** +12 s at 2×, +9 s at 3×, +15 s at 1.3×, six that qualify (five listed, largest first), and jobs 1 against 4 (none). Red: absent.
- **R-2552.** A tip that is HEAD (prefixed) and one that is not (plain). With runtime-map-live's R-2530, the land's success output shows the lines. Red: absent.
- **R-2553.** No record, garbage, the store path is a plain file, not a git checkout, an unwritable knob temp folder (the suite still runs); each with suite exit 0 and 1. A real-runner case: the knob under a plain file, runner exit 0 stays 0 and 1 stays 1 (M2). Red: no line; the real runner throws ENOTDIR and exits 1 (measured with the coverage knob's pattern).
- **R-2554.** `tail -n 2` of a passing run's and a failing run's output holds both counts and every failed name; the slower list sits on the first record line (M1). Red: no lines.
- **R-2555.** Three lane records and one off-lane record give a count of 4 with this run and the summed minutes. Red: no line.

## Tunables (new `packages/nana-pack/lib/suite-records-config.mjs`)

- `RECORD_FILE_ENV` "NANA_SUITE_RECORD_FILE" — contract (R-2546, R-2548); NANA_ prefix so R-618's scrub keeps it from test files.
- `RECORD_SCHEMA` 1 — contract (R-2546, R-2547); a reader skips other schemas.
- `STORE_SUBPATH` "nana/suite-runs" — contract (R-2547), chosen to sit beside the runtime map.
- `SUITE_RECORDS_KEEP` 300 — chosen: about nine days at the audit's rate of about 270 full runs in eight days (inferred), about 5 MB; sealed by R-2547.
- `SLOWER_MIN_SECONDS` 10 — chosen, above the 4.1 s largest per-file swing over three runs; `SLOWER_MIN_RATIO` 1.5 — chosen, above coverage's 1.27 on a CPU-heavy file; `SLOWER_LIST_MAX` 5 — chosen; the slower-list noise held at 1 in 13 pairs (attack N1).
- `RECORD_LINE_PREFIX` "suite record:" — contract (R-2549 to R-2555). File name `<YYYYMMDDTHHMMSSmmmZ>_<full tip>_<pid>.json` — chosen; sorts by time, finds tips without parsing, legal on Windows.
- `RECORD_TRIGGERS` ["land", "measure", "run"] — contract (R-2547).
- Imported by name from runtime-map-live: `LAND_TIP_ENV`, `HAND_MEASURE_ENV` (the hand measure's marker, which gives the `measure` trigger), `LAND_NOTE_PREFIX`, `MAIN_REF`.

## Known limits (carried to FEAT-031's known-bug file)

- Records stay in this clone; CI and other machines keep none here.
- A plain `npm test`, a filtered run and a one-file rerun after a time-limit failure keep none (D10).
- Seconds are parallel seconds under load; a covered land baseline makes CPU-heavy files read up to about 27% fast in a builder's plain run.
- Records hold no file hashes, so flaky means two clean runs at one tip.
- A land refused after its suite leaves a record at a tip main never reaches; only runs built on that tip use it.
- A baseline older than 300 runs reads as none.
- A commit made during a run is not seen; the record names the starting HEAD.
- A runner crash leaves no record (N7).
- Runs made before a lane's first commit count to no lane (D9).

## Seat steps

- Two build sessions with the larger builder, on a branch cut after runtime-map-live lands. (1) R-2546, R-2547, R-2548, R-2553, the config, R-1270's text gaining "per-file coverage" before "record". (2) R-2549 to R-2552, R-2554, R-2555, the README's suite paragraph, CAP-07's deliverable lines (`Made by: R-2547 · suite: scripts/test-locked.mjs, scripts/test.mjs` and `Read by: R-2549 · code: scripts/test-locked.mjs`), map and tree. Between them the seat reads the record build 1's own full locked run left.
- Wrong-code pairs: the newest ancestor as baseline (M3); an unguarded runner write (M2); a `git diff` dirty count (M5); coverage labels kept at a passing land (M4); the slower list after the verdict line (M1); store a filtered run; call a dirty run flaky; compare across job counts; drop the land prefix; count an off-lane record in the lane total.
- A draft PR runs the Windows leg. Next lanes: ci-jobs (D11), ci-records (FEAT-019), lane-costs (FEAT-035), report confirmation of a FAIL from records (FEAT-039).
