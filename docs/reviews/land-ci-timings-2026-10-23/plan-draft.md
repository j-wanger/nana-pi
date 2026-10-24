# land-ci-timings: plan draft (planner, 2026-10-23, main c273b4de)

Feature: FEAT-008 · Integrate and clean up reviewed changes (checked: REQUIREMENTS.md:724, purpose "Check merge prerequisites, integrate only changes every reviewer accepted, and remove only safe completed worktrees"). One row, R-2753, has its home in FEAT-031 beside R-2546, because it changes the test runner's record (Open question 4).

Why: the owner picked "Land keeps CI timings (Recommended)" on 2026-10-23, under the current priority: every artifact made automatically by a run that already happens, read by code that acts on it, and showing its age. Appetite clause 3 names "suite and CI timings kept". Today the CI suite records (R-2632) are made by CI, read by a person who runs `scripts/ci-records.mjs` by hand (REQUIREMENTS.md:2010), and lost after GitHub's 90-day artifact retention (FEAT-031 known bugs :83, :85). This lane merges three slate inputs into one land-tool lane:
- the slate's land-reads-ci-records: after the CI read passes and the merge is verified, nana-land reads the tip's CI records;
- the critic's ci-records-kept: each record is stored under `<git common dir>/nana/ci-runs/` through the suite-records writer, in its own folder so the local baseline never mixes platforms;
- the skeptic's required action: a print-only read is a person reader, so the land judges every file against its per-file limit and notes each file over a set share.

This reverses the default of HANDOFF's optional ask "Two planned-lane defaults" (HANDOFF.md:27, "nana-land does not print the CI timing records yet. Default: both stand"). The owner's pick decides that half; the lane removes it from the ask and the seat's report says so. The copier drift-line half stays.

Spend: the current priority (artifact work, review 11-06) and its appetite clause 3; the critic's wave-1 slot 3 under power mode (four building, two planning).

Class: install, hook or gate, by AGENTS.md's letter ("the land and review tools (`nana-land`, ...)"). The lane changes `nana-land`. It touches no nana-setup file and no hook, so the local macOS install check does not apply (precedent: land-reads-ci's plan said the same). Ladder: the roster's final reviewer, the land reviewer (a seat-land file only if the roster prints `land: seat`), the seat's wrong-code pairs, one independent check, and the mutation runner after any seat change to code or tests.

Builder: the larger builder. Every land on every machine runs this code after its merge.

Stakes: medium blast, reversible. Every CI-checked land runs the new step after its merge. If the step's own catch holds, a bug cannot refuse, delay the merge or undo a land. The worst real harm is a post-merge `refused:` line: main has moved, but the seat reads a failed land and may not push, or may try again (R-2755 pins it). A hanging gh delays the land's report by at most the read budget (60 s). Disk: up to about 78 MB under the clone's git folder at the chosen retention (inferred from measured record sizes).

Threat model: honest variation in our tools' output and GitHub's is in scope. That covers: a tip with one pull-request run, or with a push run too; re-run attempts that leave two records for one leg (measured at c273b4de: macOS attempt 1 FAIL, attempt 2 PASS); the Linux leg's continue-on-error failures; an expired or missing artifact; a failed download; a record of another schema, or one with no per-file limit; gh missing, signed out, offline, rate-limited or timing out; a gh call that hangs; a store folder that is unwritable, a file in the folder's place, a leftover temporary file, EBUSY on a Windows prune; a relative or absolute git common directory, Windows drive-letter paths; an artifact creation time that does not parse; the reader or writer throwing. Deliberate forgery is out: a forged or hand-uploaded artifact, a hand-written file in the store, a tampered gh first on PATH. Public repo: no text in this lane names the owner or the owner's work; examples use `example/fixture`.

## Measurements (seat Mac, gh 2.91.0, git 2.50.1, node 22.22.2, 2026-10-23; read-only gh calls; downloads only into <scratch>)

| Question | Result | How |
|---|---|---|
| Newest CI runs on main | 12 push runs 2026-10-23 03:45Z to 21:33Z; 10 success, 2 failure (8ebcc308, 16c902c2). c273b4de's push run 40027687691 took 21.3 min. Measured | `gh run list --workflow ci.yml --branch main --limit 12` |
| Newest pull-request runs | 12 runs; c273b4de's run 40022762631 at attempt 2 success; 291f8a14 and 08e99dbf failure; park-honestly's run in progress. Measured | `gh run list --event pull_request --limit 12` |
| Runs a land sees | At land time only the tip's pull-request run exists; the push run starts with the land's push (land-reads-ci plan, 40 lands). Measured there, re-confirmed: every land tip below has exactly one pull-request run | push runs' head SHAs against PR runs |
| readCiRecords time, one-run tip (what a land reads) | 3.07 s, 3.08 s (42855f81), 3.74 s (f766d880); 3 records, 6 gh calls each. Measured | `<scratch>/time-read.mjs`: a `git archive` copy of main's reader with main's `ghDefault`, temp root in <scratch>, cwd the main checkout (read-only git calls) |
| readCiRecords time, two-run tip | 8.63 s (c273b4de, 7 records, 12 calls); 8.57 s (b2e594c3, 6 records, 11 calls). Measured | same |
| Per gh call | runs 0.35 to 0.54 s; artifacts 0.24 to 0.28 s; jobs 0.54 to 1.73 s; download 0.57 to 2.38 s, most about 0.65 s. Measured | same |
| Cleanup | The reader's temp root was empty after all five runs. Measured | `ls <scratch>/tmp` |
| Records available | 110 unexpired `suite-record-*` artifacts, 2026-10-23T03:05Z to 2026-10-24T00:44Z; all downloaded. Measured | `gh api .../actions/artifacts` pages 1 and 2, `gh run download` into <scratch>/arts |
| Record size | 18,667 to 19,513 bytes, median 19,376; artifact zip about 2.7 KB. Measured | file sizes |
| Per-file limit on CI | 900 s: ci.yml:77 sets `NANA_TEST_TIMEOUT_MS: "900000"`, so `TIMEOUT_MS` (scripts/test.mjs:89) is 900 s on every CI leg. The 300 s value is only the runner's default. Measured from code | ci.yml, test.mjs |
| Slowest file per leg (36 or 37 records each) | Windows: median 337.8 s, max 464.7 s (templates-update.test.mjs, run 39915299704, 51.6% of 900 s); land.test.mjs max 363.7 s (40.4%) and slowest in 30 of 36 records. macOS: median 141.3 s, max 204.0 s (land.test.mjs, 22.7%). Linux: median 80.5 s, max 87.3 s (product-report.test.mjs, 9.7%). Measured | `<scratch>/analyze.py` over every record's final files |
| Against the 300 s default | Windows land.test.mjs median 337.8 s is 113% of 300 s. At half of 300 s, 50 of 110 records would print 242 notes. Measured | same |
| Worst single-run spike | Largest max-over-median per file (files with median 30 s or more, 10 records or more): Windows 1.73 (templates-update, 268.3 s median to 464.7 s), Windows p90 1.68; macOS 1.60; Linux 1.12. Measured | same |
| Windows runner variance | land.test.mjs ranges 184 to 364 s within one day; fast-runner legs run 700 to 960 s wall, slow ones about 1,100 s. No growth trend is visible in 21 hours. Measured, trend inferred | same, by time |
| Land tips with records | 9 (5c47155f, e9a4280c, dbb98cbb, 09181956, 00617983, 8c24e357, f2b27357, b2e594c3, c273b4de); 3 records per land for 7, 4 for 2 (3.22 average). Measured | PR-run records whose head SHA has a push run on main |
| Land notes per share of the 900 s limit, those 9 lands | 1/3 (300 s): 7 of 9 lands, 9 notes, all land.test.mjs on Windows. 0.40 (360 s): 1 of 9 (dbb98cbb, 361.1 s). 0.45 and 0.50: 0 of 9. Over all 110 records at 0.50: 1 note (409ce615, a lane commit that did not land as tip). Measured | same |
| Land rate | 196 push runs on main from 2026-10-08 to 2026-10-23: 12.3 a day on average; 2 to 14 a day outside power mode, 50 and 59 on 10-19 and 10-20. Measured | `gh run list --event push --limit 200` |
| Local store and git folder | `.git` 167 MB; `.git/nana/suite-runs` 83 files, 1.6 MB. Measured | `du`, `ls` (read-only) |
| Local land records (seat Mac, coverage, 4 jobs) | review-ledger.test.mjs 150 to 161 s, about 52% of the local 300 s default; land.test.mjs 101 to 165 s. Measured | last 10 land-trigger records |
| Red on main | nana-land.mjs never names readCiRecords or ci-records (grep count 0); storeSuiteRecord has no store-folder option; the runner's record has no per-file limit. Measured | grep |

Two corrections to the slate's inputs (both measured from code):
- The skeptic wrote that readCiRecords calls `runGh(cwd, args)` with no env option. It passes `{ env: process.env }` (ci-records.mjs:46). The effect is the same: nana-land's colour-safe environment reaches those calls only if the wrapped runner replaces the env it is given.
- The skeptic named `TIMEOUT_MS` as 5 minutes. On CI it is 15 minutes (ci.yml:77). Judged against 5 minutes, land.test.mjs on Windows would note on every land. So the land judges each file against the limit its own record ran under, and the runner records that limit (R-2753). This also closes FEAT-031's known bug "the record holds no per-file time limit" (:89).

## Precedent

Precedent:
- packages/nana-pack/bin/nana-land.mjs — `ghEnvironment` (:23-28) wraps every records call; `ghDefault` (:30-32) gains a per-call `timeoutMs` option, default unchanged; the CI read and `judgeRuns` (:144-162) decide whether records are read; the ledger lock ends with the merge (:167-189); the post-merge checks and containment (:190-193) and the never-refusing release-status read (:194-196) are the model for the new step's place and its own catch; land notes and the success text (:34-36, :197-199); the one `refused:` catch (:200) that the new step must never reach.
- packages/nana-pack/lib/ci-records.mjs — `readCiRecords` (:95-181) is called with the tip's full SHA and nana-land's wrapped runner. It returns the parsed records (`printed`, :121, :147) beside `code` and `records`; nothing else changes. `ghResult` (:44-57) shows why the wrapper must replace the env.
- packages/nana-pack/lib/suite-records.mjs — `suiteRecordsDir` (:37-41), `storeSuiteRecord` (:75-103) and `readSuiteRecords` (:114-129) gain a store-folder option, default `STORE_SUBPATH`; `storeSuiteRecord` gains a name-suffix option, default the process id. `finalFiles` (:182-190) feeds the new pure `slowFiles(record, share)`, which sits beside `recordCounts` (:193-201). `baselineOf` (:157-164) never sees CI records, because they live in another folder.
- packages/nana-pack/lib/suite-records-config.mjs — `STORE_SUBPATH` (:20) and `SUITE_RECORDS_KEEP` (:23) set the form of `CI_STORE_SUBPATH` and `CI_RECORDS_KEEP`; `SLOWER_MIN_RATIO` (:29) is the neighbour for `CI_SLOW_SHARE`; `SLOWEST_LIST_MAX` (:53) caps the notes per record, reused.
- packages/nana-pack/lib/land-config.mjs — `CI_READ_TIMEOUT_MS` (:27) stays the per-call cap and sets the form of `CI_RECORDS_BUDGET_MS`; `LAND_NOTE_PREFIX` (:43) and `TIP_DIGITS` (:55) reused.
- packages/nana-pack/lib/land-ci.mjs and packages/nana-pack/lib/release-status.mjs — the header form for the one new lib, `packages/nana-pack/lib/land-ci-records.mjs` (read, keep and judge one landed tip's CI records); release-status's never-throw reader with an injected runner (:42-57, R-587) is the model for its failure lines.
- scripts/test-locked.mjs — `finishSuiteRecord` (:181-198): a record stored at land, spread over the runner's record with git facts added, whose failures become lines and never change the verdict.
- scripts/test.mjs — the record write (:614-631) gains `fileTimeoutMs: TIMEOUT_MS` (:89); `fx?.timeoutMs ?? TIMEOUT_MS` (:483, :541) shows collected files run under `TIMEOUT_MS`.
- scripts/ci-records.mjs — the one existing caller (:36-38); unchanged, it ignores the returned records.
- packages/nana-pack/tests/land.test.mjs — `workflowRun` and `runList` (:78-79), `ciFixture` and `executeCi` (:80-99), the lock stub's event log (:169), R-2591's env assertion with preset `CLICOLOR_FORCE` and `GH_FORCE_TTY` (:690-707).
- packages/nana-pack/tests/ci-records.test.mjs — the fake gh state shape for runs, artifacts, jobs and downloads (:50-80); records need `path: ".github/workflows/ci.yml"` on each run, or the reader finds no run.
- packages/nana-pack/tests/test-runner.test.mjs — the record-knob case and `recordsMatchOutput` (:521-608) for R-2753.
- packages/nana-pack/tests/suite-records.test.mjs — the store and retention cases for the new options.
- scripts/deliverables.mjs (:31, :130) and scripts/product-report.mjs (:211, :242-257) — where the machine-local artifact name and its age live today; report-at-land's prototype widens `RUNTIME_MAP_ARTIFACT` into `MACHINE_LOCAL_ARTIFACTS` with an age reader over `readSuiteRecords` (<scratch>/report-at-land/prototype.diff).
- docs/reviews/land-reads-ci-2026-10-22/, docs/reviews/suite-records-2026-10-22/, docs/reviews/runtime-map-live-2026-10-22/, docs/reviews/ci-timing-records-2026-10-22/ — the precedent lanes: the CI read, the store and writer, a record written at each land, and the reader.

Private helper moves:
- suite-records.mjs's private `numberText` (:178-180) is exported; the new lib's note text imports it. ci-records.mjs keeps its older copy (:28), recorded as one known-bug line, not moved here.
- Recommended, Open question 3: land.test.mjs's fixture helpers (`git`, `repo`, `commit`, `tree`, `recordReview`, `reviewTip`, `gitRunner`, `workflowRun`, `runList`, `ciFixture`, `ensureCiReview`, `executeCi`; :33-99) move to a shared test module, `packages/nana-pack/tests/land-fixtures.mjs`, imported back. The lane's tests then go in a new file, so land.test.mjs does not grow. It is the slowest Windows file, at 35 to 40% of its limit (measured).
- `ghEnvironment` stays private: nana-land is its only caller.

## Design

- **D1 · When and where.** The read runs only when CI applied and its read passed (`ciLines` set). It runs after the merge, the post-merge checks, the containment check and the release-status read, before the success text. The review-ledger lock was released when the merge ended (nana-land.mjs:189), so a slow download can neither hold the lock nor delay the merge. Where CI does not apply, nothing changes: R-2590's existing test already asserts no gh call there.
- **D2 · The read.** nana-land calls a new lib function, `keepLandCiRecords({ main, tip, runGh, now, budgetMs, keep, share })`. The lib calls `readCiRecords([tip], { cwd: main, runGh: wrapped, writeLine })` and collects the reader's lines. At land time that is one pull-request run: about 3 to 4 s and 6 or 7 gh calls (measured).
- **D3 · The wrapped gh runner.** nana-land passes `(cwd, args, options) => runGh(cwd, args, { env: ghEnvironment(process.env), timeoutMs: options.timeoutMs })`. It replaces the `process.env` the reader passes. The lib adds the budget. The budget clock starts at the first records call. Each call gets the smaller of `CI_READ_TIMEOUT_MS` and the time left. Once the budget is spent, the lib answers each further call with an `ETIMEDOUT` error naming the budget, and starts no gh. The reader then reports the remaining runs and legs as lines and ends quickly, so the whole step is bounded by about the budget plus one cleanup.
- **D4 · The store.** Each record the reader parsed is stored with `storeSuiteRecord(stored, { root: main, subpath: CI_STORE_SUBPATH, now: () => new Date(artifact.created_at), suffix: \`${run.id}-${leg}-${attempt}\`, keep: CI_RECORDS_KEEP })`. The stored object is the runner's record plus `tip` (full SHA), `recordedAt` (the artifact's creation time) and `ci: { run, attempt, leg, event, artifact }`. Its name is `<artifact time stamp>_<tip>_<run>-<leg>-<attempt>.json`, so one artifact always maps to one name. A second land of the same tip replaces the file instead of adding one. The folder is `<git common dir>/nana/ci-runs/`, shared by every worktree of the clone, beside suite-runs and the runtime map. It is never the suite-runs folder, so `baselineOf` and the local slower list never compare a CI leg with a local run. The prune keeps the newest `CI_RECORDS_KEEP` by name, which sorts by artifact time. One line follows the reader's lines: `ci record: kept <n> of <m> records`.
- **D5 · The slow-file action.** For each record read, `slowFiles(record, CI_SLOW_SHARE)` returns the final non-SKIP files whose seconds reach the share of `record.fileTimeoutMs / 1000`, slowest first, at most `SLOWEST_LIST_MAX`. nana-land prints one land note for each: `[nana-land] note: slow CI file: <path> took <s>s on <platform> <leg> run <id> attempt <n>, <pct>% of its <limit>s limit`. A record with no valid `fileTimeoutMs` is not judged. Every tip after this lane carries the field, because nana-land lands only fast-forwards from main (known limit). Measured effect at 0.5: no note on the last 9 lands. The nearest file is land.test.mjs on Windows, at 35 to 40%. A file over half its limit is one measured worst spike (1.73 times) from 87% of it.
- **D6 · Is anything stronger warranted? No, a land note is the right strength.** Refusing is wrong for three reasons. The step runs after the merge, so a refusal would be a false report. The owner's rule says a records failure never refuses. And a single hosted run varies up to 1.73 times per file and about 2 times across runners (measured), so a refusal would make lands flaky. Writing a known-bug line, moving a file to the run-alone list or raising a limit automatically would write after a land, against the 2026-10-10 and 2026-10-11 rulings. The note is the code's judgement: which file, on which leg, how close to failing. Its action is the same class as R-2550's: test-locked classes failures against the baseline, and a person fixes them. That the deliverable checker counts this as a code reader is inferred from R-2547's precedent; the skeptic named exactly this action as the fix.
- **D7 · What prints.** In the success text, after the `ci:` lines and before `push command:`, come the reader's lines (two per record, any problem lines, its closing line) and the kept line. Slow-file notes and failure notes join the land notes at the top. The reader's lines are kept because they are the only place a re-run flake shows at land: c273b4de's macOS attempt 1 failed and attempt 2 passed (measured).
- **D8 · Failure handling.** Every failure becomes exactly one land note starting `[nana-land] note: CI records`, and the land still exits 0 with main at the tip. When the reader returns code 1 (no record, gh failed, timed out or could not start), the note carries the reader's closing line: `CI records not read: <reason>`. When storing fails (mkdir or write error, an unparseable artifact time, a prune error), the note reads `CI records not kept: <reason>`; the reader's lines and the slow notes still print. A throw anywhere in the step is caught in nana-land around the call and becomes `CI records failed: <message>`. It never reaches the `refused:` catch at :200. No path refuses, delays the merge, or changes main.
- **D9 · The runner records its limit.** scripts/test.mjs writes `fileTimeoutMs: TIMEOUT_MS` into its record (R-2753). Schema stays 1, because readers ignore unknown fields (readRunRecord checks only schema and files). Local records gain the field too, so a later local headroom reader needs no runner change.
- **D10 · report-at-land and the `ci-runs` name.** R-2632's new maker line names the store as its artifact (`· ci-runs`), which is how R-2632 gets a stored age. The deliverables check treats an artifact part as a tracked path unless it is a machine-local name (deliverables.mjs:130). So this lane needs `ci-runs` in report-at-land's frozen set (`MACHINE_LOCAL_ARTIFACTS`), plus the store in that lane's age reader (`readSuiteRecords({ root, subpath: CI_STORE_SUBPATH })`). Order: the second lane to land adds the name. Default (Open question 2): report-at-land lands first, as the critic's chain root, and this lane adds the name, the store and the artifact part after merging main. If this lane lands first, its maker line carries no artifact part, and report-at-land adds `ci-runs` with the age. Both lanes edit REQUIREMENTS.md and HANDOFF, so the later lander merges main and takes a confirmation round either way.
- **D11 · This lane's own land.** The seat lands it with the worktree's own nana-land.mjs. The first real read is then this lane's own pull-request run, whose records carry the new limit field. Expected: three records kept, no slow note, a read of about 3 to 4 s. The seat records the real figures in the land report.

## Dropped

- Printing only, the slate's original: a person reader (skeptic).
- Refusing or failing a land on a slow file: D6.
- Automatic edits after a land (known-bug line, run-alone list, limit): D6 and the rulings.
- Reading records before the merge or inside the ledger lock: it would delay the merge and hold the lock.
- Judging against the runner's 300 s default or a copied 900 s constant: the first notes every land (measured), the second is a second home for ci.yml's value.
- Merging CI seconds into the runtime map: ci-timing-records' D6 (compare, do not merge) still holds.
- Keeping the post-land push run on main: no land reads it. It tests the same tree when origin main was the tip's ancestor (known limit).
- Keeping records from the hand script: one writer, the land.
- A local headroom note in test-locked (review-ledger at about 52% of the local 300 s, measured): a later lane on R-2547's reader. This lane's runner field makes it a small one.
- Age-based retention: count keeps the shared writer's prune unchanged.
- A trend reader over the store: no code acts on the history yet. The store's age shows through report-at-land.

## Must-meet rows (EARS, one shall each) and tests

IDs R-2750 to R-2756, each checked unused on 2026-10-23 across the main checkout, every worktree under ~/nana-pi-wt and the planning scratch folder (grep, excluding .git and node_modules). R-2757 to R-2759 stay unused. R-2720 to R-2749 are reserved for other lanes.

All land rows' tests use one fixture builder over `ciFixture` with an injected `runGh` stub. The stub answers the CI read's first call with a green run list carrying `path: ".github/workflows/ci.yml"`. It answers records calls from a state table in ci-records.test.mjs's shape: runs, artifacts, jobs, and downloads that write a record file into `--dir`. It logs every call with its args, options and the moment, relative to lock and suite events. Each test asserts code 0, main at the tip and `push command:` present unless it says otherwise.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2750 | WHEN CI applies to a land and the land's containment check has passed, nana-land shall read the source tip's CI suite records through the CI-record reader, after the review-ledger lock is released, with every gh call in the land's colour-safe gh environment, and print each line the reader returns in its success output. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2750: after the merge and outside the ledger lock, the land reads the tip's CI records in its gh environment and prints the reader's lines` |
| R-2751 | WHEN nana-land reads a CI suite record, it shall store that record, with the source tip, run id, attempt, leg, event and artifact creation time added, in the `CI_STORE_SUBPATH` store under the clone's git common directory, under a name that one artifact always maps to, and never in the local suite-record store. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2751: each CI record read at a land is kept once in the clone's ci-runs store with its tip, run, attempt, leg, event and time, never among local suite records` |
| R-2752 | WHEN nana-land stores a CI suite record, the CI record store shall keep only the newest `CI_RECORDS_KEEP` records by artifact creation time. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2752: the ci-runs store keeps only the newest CI_RECORDS_KEEP records` |
| R-2753 | WHILE `NANA_SUITE_RECORD_FILE` names a file, the test runner's run record shall carry the per-file time limit, in milliseconds, that it applied to each collected file. | `packages/nana-pack/tests/test-runner.test.mjs::R-2753: the run record names the per-file time limit the runner applied` |
| R-2754 | IF a CI suite record that nana-land reads lists a non-SKIP file whose seconds reach `CI_SLOW_SHARE` of that record's per-file time limit, THEN nana-land shall print one land note naming the file, its seconds, the record's platform, leg, run id and attempt, and its share of the limit, at most `SLOWEST_LIST_MAX` notes per record, slowest first. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2754: a land notes each CI file at or above its share of the record's own per-file limit, slowest first and capped` |
| R-2755 | IF the CI-record read or its storing fails, because the reader finds no record, gh fails, times out or cannot start, the store cannot be written, or the step throws, THEN nana-land shall print exactly one land note naming the cause and still report the land with exit 0. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2755: a CI-record failure after the merge is one land note and the land still succeeds` |
| R-2756 | WHILE nana-land reads a landed tip's CI records, it shall start no gh call once `CI_RECORDS_BUDGET_MS` has passed since the read's first gh call, and give each call it starts at most the budget's remainder as its time limit. | `packages/nana-pack/tests/land-ci-records.test.mjs::R-2756: the CI-record read starts no gh call past its budget and shortens each call to the time left` |

Plus one seal test, with no row of its own, naming R-2751, R-2752, R-2754 and R-2756: `seal: CI records are kept in nana/ci-runs up to 4000, files are noted at half their limit, and the read stops after 60 seconds`.

The file names assume Open question 3's default (split). With `keep`, every land test goes in land.test.mjs under the same titles.

### What each test does, and why it is red on main

Main's nana-land never reads CI records (grep count 0). Main's `storeSuiteRecord` has no folder option, and main's runner record has no limit field.

- **R-2750.** A green land whose records state holds three legs. The lock stub logs `lock-enter` and `lock-exit`. The gh stub logs each call and, on each records call, reads `refs/heads/main` in the fixture's main. Assertions: the first call (the CI read) comes before the suite. Every later call comes after the last `lock-exit`, and finds main already at the tip. `process.env` is preset with `CLICOLOR_FORCE=1` and `GH_FORCE_TTY=1`, restored in `finally`. Every records call's env then deep-equals R-2591's expected env (`CLICOLOR_FORCE` "0", no `GH_FORCE_TTY`) and is not `process.env`. The output holds each record's `ci record:` totals and slowest lines and the reader's closing line, after the `ci:` line and before `push command:`. Red on main: one gh call only, no `ci record:` line.
- **R-2751.** The same land. The store folder, `git rev-parse --git-common-dir` from the feature worktree joined with `nana/ci-runs`, holds exactly three JSON files. Each parses as schema 1 with `tip` equal to the full tip and `recordedAt` equal to its artifact's `created_at`. Each has `ci.run`, `ci.attempt`, `ci.leg`, `ci.event` and `ci.artifact` equal to the fake's values, and the runner record's files unchanged. Each file name starts with the colon-free stamp of the artifact time. `readSuiteRecords({ root: main })`, the local store, returns nothing new. Then a second `keepLandCiRecords` call for the same tip and state still leaves three files. Red on main: no folder.
- **R-2752.** First, a land into a store seeded with 301 tiny valid records with older stamps. After the land, 304 files remain; a prune to `SUITE_RECORDS_KEEP` (300) would leave 300. Second, a direct `storeSuiteRecord` case with `subpath: CI_STORE_SUBPATH` and `keep: 2`, storing three records whose artifact times are out of order. The two newest by time remain. Red on main: no folder option, and the land seeds stay at 301.
- **R-2753.** The existing record-knob fixture runs with `NANA_TEST_TIMEOUT_MS` set to a fixture value. The record's `fileTimeoutMs` equals `Number` of that value for both the serial and parallel runs. Red on main: field absent.
- **R-2754.** Fake records name `fileTimeoutMs: 200000` (a 200 s limit, not CI's 900 s), so a fixed default fails the test. One record holds files at 99.9 s (no note), exactly 100 s (note: the boundary is "reach"), 150 s and 199 s (notes), a SKIP file at 0 s, and a FAIL `timed out` file at 200 s (note). Notes come slowest first. A second record has seven files over the share; exactly `SLOWEST_LIST_MAX` notes print, the slowest. A third record has no `fileTimeoutMs`; it prints no slow note. Each note names the path, seconds, platform, leg, run id, attempt and the percentage. Red on main: no note.
- **R-2755.** Five lands, each asserting exit 0, main at the tip, `push command:` present, no `refused:`, and exactly one line starting `[nana-land] note: CI records`. (a) The records runs call answers exit 1 with an error line; the CI read's identical first call is answered green, so the stub answers by phase. (b) Every download answers 404; the note names the reader's "no readable record". (c) A regular file sits where `nana/ci-runs` belongs; the note says "not kept", and the reader's lines still print. (d) The stub throws on every records call. (e) `runLand` is given a `keepLandCiRecords` that throws; the note names its message. Red on main: no note.
- **R-2756.** `runLand` takes an injected clock. Each records call advances it 25,000 ms against a 60,000 ms budget passed in for the case. Exactly three records calls start, with time limits 30,000, 30,000 and 10,000 ms, read from the stub's `options.timeoutMs`. No fourth call starts. Exactly one note names the budget. A fast case that advances 100 ms per call prints no budget note. Red on main: no records call at all.

Existing tests made false: three assertions count every gh call in a green land, and the records read adds calls after the merge. They are R-2588's "one gh call" (land.test.mjs:614), R-2591's `calls.length === 1` (:697) and R-2590's tip-only `ghCalls === 1` (:686). The builder narrows each one to the calls made before the suite and keeps each row's text and title. The seat checks with `requirements-moved` that no title changed. R-2591's POSIX fake-gh child case keeps passing, but only by coincidence. Its record file keeps the last call's argv, and the reader's runs call has the same argv as the CI read. The builder makes that fake append its records, so the case asserts the first call. Every other land fixture has no origin or a local bare origin, so CI does not apply and its output does not change (inferred; the builder's full suite decides).

## Tunables

- `CI_SLOW_SHARE` 0.5, in suite-records-config.mjs. Chosen 2026-10-23: the measured worst per-file spike over its median is 1.73 times (templates-update.test.mjs on Windows, 268.3 s to 464.7 s, 36 Windows records). A file at half its limit survives that spike at 87% of the limit. Measured effect: no note on the last 9 lands; one note in 110 records. Sealed by the seal test (R-2754).
- `CI_RECORDS_BUDGET_MS` 60,000, in land-config.mjs. Chosen: about 7 times the slowest measured read (8.6 s, two runs, 7 records) and 16 times a one-run read (3.1 to 3.7 s). Sealed (R-2756).
- `CI_RECORDS_KEEP` 4,000, in suite-records-config.mjs. Chosen: about 100 days at the measured mean rate (12.3 lands a day times 3.22 records a land is about 40 a day), past GitHub's 90 days. Size about 78 MB at the measured 19,376-byte median (inferred by multiplying). A burst like 10-19 and 10-20 shortens it to about 23 days. Sealed (R-2752). The owner's call: Open question 1.
- `CI_STORE_SUBPATH` `nana/ci-runs`, in suite-records-config.mjs. Contract (R-2751); chosen beside `STORE_SUBPATH` so local baselines never see a CI leg. Sealed (R-2751).
- Reused unchanged: `CI_READ_TIMEOUT_MS` (per-call cap), `SLOWEST_LIST_MAX` (note cap), `LAND_NOTE_PREFIX`, `TIP_DIGITS`, `CHILD_OUTPUT_MAX_BYTES` (nana-land's gh output bound).

## Wrong-code pairs (each must turn its test red)

1. The records read runs before the suite or before the merge (R-2750: a records call before `lock-exit`, or main not yet at the tip).
2. The records read runs inside the ledger lock callback (R-2750).
3. The wrapper forwards the reader's `process.env` instead of `ghEnvironment` (R-2750: preset `CLICOLOR_FORCE=1` and `GH_FORCE_TTY=1` reach the call).
4. The reader's lines are dropped from the success text (R-2750).
5. Records go to `STORE_SUBPATH`, the suite-runs folder (R-2751: local store gains files, ci-runs has none).
6. The stored record lacks the tip, run, attempt, leg, event or time (R-2751).
7. The name uses the clock or process id, so a second keep adds files (R-2751: six files, not three).
8. The land prunes with `SUITE_RECORDS_KEEP` (R-2752: 300 files, not 304).
9. The prune keeps the oldest, or sorts by the clock instead of artifact time (R-2752: the direct case).
10. The runner omits `fileTimeoutMs`, or writes the 300 s default instead of the environment's value (R-2753).
11. The share compares with `>` instead of `>=` (R-2754: the 100 s file).
12. The limit is a fixed 300 s or 900 s, not the record's own (R-2754: 200 s limit cases).
13. SKIP files are judged, the cap is missing, or notes are not slowest first (R-2754).
14. A record without a limit is judged against a default (R-2754: third record).
15. A records failure throws into the outer catch, so the land reports `refused:` after the merge (R-2755 case e).
16. A failure prints no note, or one note per problem (R-2755 cases a to d).
17. No budget: calls keep starting after it is spent (R-2756: a fourth call).
18. Each call keeps the full 30 s limit (R-2756: the 10,000 ms third call).

## Windows notes

- gh: nana-land starts `gh` with no shell, so a bare name finds `gh.exe` (inferred; FEAT-008's known bug says the fake-gh command case runs only off Windows). A real gh has run the reader only on macOS (FEAT-031 known bug :90). `gh run download --dir` with a backslash temp path is inferred to work.
- Common dir: `git rev-parse --git-common-dir` prints `.git` in a main checkout and an absolute forward-slash path in a linked worktree, such as `C:/...` (inferred for Windows). `suiteRecordsDir` resolves both with `path.isAbsolute` and `path.resolve`, and `path.join` normalizes slashes. Store names hold no colon, because the stamp is colon-free by R-2547's chosen form.
- Prune: `rmSync` can hit EBUSY on Windows (FEAT-031 known bug :74). Here that is one `not kept` note, and the land still exits 0 (R-2755 covers the class through case c).
- Temp: the reader downloads under `os.tmpdir()`. On Windows runners that can be an 8.3 short path (CI-runner memory). The reader only joins paths and never compares them (inferred safe).
- What CI proves: every new test runs on the Windows suite leg, which blocks release. That covers the stub-driven land cases, the store under a Windows temporary repository reached from a linked worktree, the runner's limit field, and the prune. What CI cannot prove: a real gh on Windows, a real Windows land, and the owner's Windows machine landing with gh signed in. Those stay with the owner's next Windows run (HANDOFF's blocking ask).

## Known limits (the seat writes them to docs/known-bugs/FEAT-008.md before the final round)

- Only the tip's runs that exist at land time are kept, normally its pull-request run. The push run on main after the land is never kept.
- Retention is by count: 4,000 records is about 100 days at the measured mean rate, and about 23 days at the 10-19 and 10-20 burst rate.
- The store can reach about 78 MB in the clone's git folder (inferred).
- One record is one hosted-runner sample under four jobs. A note can fire on a slow runner and not on a fast one (land.test.mjs measured 184 to 364 s in one day).
- A record without a per-file limit is not judged, with no note. Only records made before this lane lack it, and every later land tip carries it.
- The slow-file note is advice: nothing refuses, edits or files a bug. A person acts on it.
- The read adds about 3 to 9 s after the merge (measured), and at most the 60 s budget plus one cleanup.
- gh's time-out still reads "gh could not start" inside the failure note (FEAT-031 known bug :94).
- A repository with a github.com origin and a `ci.yml` but no record artifacts gets one `CI records not read` note on every land (inferred). Today only nana-pi has a github.com origin and a workflow (land-reads-ci plan, measured there).
- The local runner's 300 s limit is not judged at the land. The local reader for it is a later lane.
- No code reads the store's history yet. Its age shows only once report-at-land carries `ci-runs`.
- ci-records.mjs keeps its own copy of `numberText`.

## Docs that change

- packages/nana-pack/README.md :270 (land paragraph): after a CI-checked land the helper reads the tip's CI suite records, keeps them in the clone's ci-runs store, prints the reader's lines, and notes each file at or above half its record's per-file limit. Say that a records failure is one land note and never refuses, and that the read stops at its budget.
- README.md :278: one sentence after the ci-records sentence. A land keeps the tip's CI records in a ci-runs store beside suite-runs and notes slow files.
- REQUIREMENTS.md: R-2750, R-2751, R-2752, R-2754, R-2755 and R-2756 under FEAT-008, and R-2753 under FEAT-031. In CAP-07, replace R-2632's `Read by: R-2632 · person: ...` (:2010) with `Read by: R-2632 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci-records.mjs`. Add `Made by: R-2632 · land: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci-records.mjs`, with ` · ci-runs` only under D10's order. The tree check's deliverable count rises by one, for R-2632 (inferred from the skeptic's measured 16 of 33 at c273b4de; other lanes move the base). Optional FEAT-008 purpose amendment: add "and keep the landed tip's CI records".
- docs/known-bugs/FEAT-031.md: close :85 ("no land step, hook or CI step reads the records") and :89 ("headroom ... read by eye"). Reword :83: GitHub's copy expires after 90 days, and the landing clone keeps a copy up to `CI_RECORDS_KEEP`. Reword :92: CI records enter their own ci-runs store, never suite-runs or the runtime map. Reword :64: CI records are kept in the landing clone; other machines keep none.
- docs/known-bugs/FEAT-008.md: the known limits above.
- HANDOFF.md :27: drop "nana-land does not print the CI timing records yet" and make the ask singular for the copier drift line. Add the Landed line and the session entry. Run `nana-writing HANDOFF.md`. The ask "What a land waits for" (:25) stays: the read does not hold the merge.
- docs/requirements-tree.md and docs/code-map.md regenerated (one new lib, one moved test-helper module under the split default).
- Unchanged: ci.yml, scripts/ci-records.mjs, test-locked.mjs, nana-setup, review tools, the rulings file, the shared working section.

## Seat steps

- Before the build, decide Open questions 2 to 4. Put Open question 1 to the owner, with its default.
- Build brief: `Feature: FEAT-008 · Integrate and clean up reviewed changes`, this Precedent section, the rows and tests above, the three existing assertions to narrow, and the D10 order.
- Builder: the larger builder, through `pi-worker --lane-size larger` when the roster sets it.
- After the build, re-run the seat checks the brief names. Diff-check the build for removed escapes in test template literals (builder unescape memory).
- Run the wrong-code pairs above as the lane's mutation table, and again after any seat change to code or tests.
- Push the branch and open a draft PR before the final review, so the Windows and Linux legs run the new tests (CI-runner test gaps memory).
- Reviews: the roster's final reviewer and the land reviewer, each from another model lineage, on the exact tip that lands, plus one independent check. The independent check runs `keepLandCiRecords` against one real tip from a <scratch> copy and compares the stored files with `node scripts/ci-records.mjs <tip>`.
- Run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the final review brief and the land.
- Land with the worktree's own nana-land.mjs (D11). Record the read's real time, the kept count and the notes in the land report.
- Cross-lane: land-records and review-texts-before-round also edit nana-land.mjs, and report-at-land edits deliverables.mjs and product-report.mjs. Whoever lands later merges main and takes a confirmation round. The second of this lane and report-at-land adds `ci-runs` (D10).
- In the report, say that the owner's pick reversed HANDOFF's "both stand" default for the CI records half.

## Open questions (one-word defaults)

1. Keep 4,000 CI records, about 78 MB and about 100 days at the measured rate? Default: `4000`. It is the owner's call: it is the owner's disk, and the pick said "beyond GitHub's 90-day retention". Fewer records would not meet that.
2. Order with report-at-land: this lane lands second and adds `ci-runs`? Default: `after`. The seat decides.
3. Put the new tests in their own file, with land.test.mjs's fixture helpers moved to a shared test module? Default: `split`. land.test.mjs is the slowest Windows file, at 35 to 40% of its limit, and this lane's own note fires on it first. The seat decides.
4. R-2753's home: FEAT-031, beside R-2546? Default: `FEAT-031`. The seat decides.
