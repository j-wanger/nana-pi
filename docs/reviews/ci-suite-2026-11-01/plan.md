# ci-suite plan (2026-11-01, revision 2)

Lane class: `gate: packages/nana-pack/bin/nana-land.mjs — land tool` (rerun after revision 2 with `node scripts/lane-class.mjs --root . --files` over every file named under Precedent and the forecast).

Revision 2 takes plan-attack.md (beside this file): M1 to M4, S1 to S7, and N2, N5 and N8. The rest of the notes need no action. Seat decisions on M1 to M4, S1 and S7 are applied as given.

## Purpose

Agreed intent, the owner's words (2026-11-01): "Yes option 1, local suite only if github CI unavailable (I'm assuming they have the same coverage)."

Today every builder and every land runs the locked full suite on this Mac (about 11 minutes, one machine lock), so builds and lands queue. CI already runs the same suite on macOS, Linux and Windows for every pushed tip, and `nana-land` already refuses until that CI has passed. This lane lets the tip's passing CI stand in for the local suite when the land can prove CI ran the full suite on this machine's platform. Every refusal `nana-land` makes today stays. The install-check ruling of 2026-10-12 stays: setup and hook lanes still run the install check locally on macOS. The Windows ruling of 2026-10-10 stays true: in nana-pi no tip lands without a passing CI run, Windows leg included.

Five-line design:

1. `nana-land merge` judges CI exactly as today and refuses on every state it refuses today, including an unreadable CI (see Question 1).
2. When CI passed, it skips `--suite` only if the lane changes neither `.github/workflows/` nor `scripts/test.mjs`, and every darwin-leg CI suite record (or this machine's platform's) from a judged run is unfiltered, holds files, and exited 0. Otherwise it runs `--suite` as today.
3. The test runner writes the file filter it used into its suite record, so a filtered run can never count as a full suite.
4. The success output and the land end record name the source (`suite: ci` with run, attempt and platform, or `suite: local` with the reason). A CI land records `suiteMs` null, and every land-record reader shows `suite ci`.
5. Builders push their last commit and stop; the seat waits for CI. The preamble, a 2026-11-01 ruling, nana-pi's own AGENTS.md section and the shared land checklist ("where the project's AGENTS.md says CI covers its suite") say so.

### When the local suite runs

With Question 1 at its default, "CI unavailable" narrows to "CI cannot stand in". The land runs the local `--suite` command, and records `suite: local` with the reason, in exactly these cases:

- **CI does not apply** (R-2590, unchanged): no `origin` remote; `origin` is not a strict github.com repository URL; the tip tracks no `.yml`/`.yaml` file in `.github/workflows`. CI state `skipped`.
- **The lane changes the CI workflow or the test runner**: `git diff --name-only <captured main> <tip>` names a path under `.github/workflows/` or `scripts/test.mjs`. The list is declared once in `land-config.mjs`. CI must still pass first. Reason `the lane changes the CI workflow or test runner`.
- **CI passed but did not prove a full suite**: every workflow's newest run succeeded, but the qualifying-record rule below fails. CI state `passed`.

Qualifying-record rule. The proof platform is the land machine's platform, injected into `runLandCore` (default `process.platform`). Take every CI suite record for the tip from a judged newest run whose `platform` equals the proof platform. For each leg, keep the highest attempt present in that run. The proof holds only when at least one leg remains and every kept record has a `filters` field that is an empty array, at least one final file, and `exitCode` 0. A record without `filters` fails, which covers every record made before this lane. The proof fails when the records read fails or passes its budget.

Everything else refuses before any suite, as today:

- CI cannot be read: `gh` cannot start, exits non-zero, times out, or prints anything other than a workflow-run list (R-2589). The run-list call gets one retry after a non-zero exit before refusing; the count is declared in `land-config.mjs` (S3). A timeout or a missing `gh` is not retried.
- The newest run of any workflow is unfinished (R-2587), including a queue stuck by an Actions outage (S2).
- The newest run of any workflow concluded anything but `success`, including `cancelled` (R-2586).
- No run exists for the tip (R-2587).

Fail closed: the only path that skips the local suite is a positive proof. Any state the code cannot classify ends in a refusal or the local suite, never the skip.

## Assumptions

- A1. "Every leg" means every blocking leg. The workflow run concludes `success` only when the macOS and Windows suite legs and all four install-check legs pass. The Linux leg stays non-blocking (`continue-on-error`, R-1531; plan-attack N4 agrees). The local suite never ran Linux.
- A2. `--suite` stays a required argument because it is the fallback command. R-1003's four-option contract holds, and the seat's land command does not change.
- A3 (seat decision on M2). Before this lane is relied on, the seat upgrades this Mac's pi from 1.0.2 to 1.4.0, the `PI_VERSION` that CI's suite legs install, so CI tests the seat's pi. The check is `pi --version` equal to `PI_VERSION` in `.github/workflows/ci.yml`; the seat runs it at session start and before each land, with `nana-setup doctor`'s pi dependencies row as the machine-wide view. May be wrong after any pi upgrade on either side; the check is by hand, not enforced by `nana-land`. Residual: another nana project whose seat pi differs from its CI's pi has no suite run against the seat's pi.
- A4 (seat decision on S1). Builders push their last commit and do not wait for CI, so the stall watchdog never sees a long CI wait. The seat waits for CI (Claude Code Monitor, or pi in the foreground), and `nana-land` refuses until the run passes. A builder's report shows the pushed branch, the full SHA of the pushed tip, and the push command's exit code in place of a suite line; the seat reads CI for that SHA.
- A5. The seat's own verify step reads the CI run for the reported SHA instead of re-running the locked suite. The ruling line covers the seat. `nana-seat.md` is not edited; its "run the full suite whole" line still governs fallback runs.
- A6. A pull-request run tests the tip merged with its base. With base `main` and main an ancestor of the tip, that merge has the tip's tree. A stacked pull request whose base is another branch tests a different tree (N2); this stays a residual, because nana-pi lanes open their pull requests against main.
- A7. CI macOS and this Mac differ in three check outcomes in two files (see "The differing check"). None changes a verdict. The one check CI macOS lacks is covered on the blocking Windows leg. The pi version is the real coverage difference, handled by A3.
- A8. On a CI land no locked suite runs. So the land writes no runtime map, no land product report and no local suite record (Question 2).
- A9. The fallback file list is the seat's: `.github/workflows/` and `scripts/test.mjs`. `packages/nana-pack/lib/test-runner-config.mjs` (run-alone list and skip reasons) and `windows-skips-config.mjs` also shape what CI runs, but are left out by the seat's decision. The list is declared once, so adding them is a config change.

## Open choices

- O1. Read the CI records once before the merge and reuse the parsed result for `keepLandCiRecords` after it, or read twice. Builder's call; report it.
- O2. Names of the new end-record fields (proposal: `suite` in `["ci", "local"]`, null when not reached, and `suiteWhy` for `local`). `LAND_CI_STATES` does not change.
- O3. Exact text of the `suite:` success line, declared once in `land-config.mjs`.
- O4. Whether R-977 and R-2588 retire with successor rows in this lane's range or keep their IDs with narrowed text. R-1110 retires: R-3436 replaces it. R-2589 is unchanged.
- O5. How the runner's `filters` field reaches the record: the array `scripts/test.mjs` used, empty for an unfiltered run. The schema stays 1; readers that validate record keys accept the new field.

## Questions for the owner

Question: When CI applies but gives no passing verdict — GitHub unreadable (gh missing, failing or timing out), a run stuck in the queue, a cancelled run, or no run for the tip — should the land refuse, or fall back to the local macOS suite?
Default: refuse, as today (the remedy is to fix gh, wait, re-run the run, or push the tip).
What the default gains and misses: gains the 2026-10-10 Windows ruling on every land, and catches an unpushed tip; misses landing during a GitHub or Actions outage, which a local fallback would allow without any Windows run.
Cost of a wrong guess: easy to undo — one judgement function in `land-ci.mjs`; a wrong fallback could land a Windows-only break, and with gh down the seat's main CI check could not see it either.
If answered otherwise: the four cases run `--suite`, the 2026-10-10 ruling is reworded in the same change to name fallback lands as its one exception, R-2586's cancelled case, R-2587 and R-2589 retire, and a stuck-queue limit is declared in `land-config.mjs`.

Question: On a land that skips the local suite, should the runtime map, the land product report and the local suite-record store simply not be refreshed, or should the land still refresh them?
Default: not refreshed at CI lands; they refresh at fallback lands and by hand (`npm run map:measure`, `npm run report`), and their `Made by:` lines say so.
What the default gains and misses: gains the whole 11 minutes and a free machine lock; misses freshness — all three pass the product page's 30-day stale line without hand runs, and the slower-file baseline (R-2551) thins, which a post-land background measure would prevent.
Cost of a wrong guess: easy to undo — a later lane can start a background measure after the merge, or have the macOS CI leg measure coverage and upload it.
If answered otherwise: nana-land starts `npm run map:measure` detached after a CI land, which still takes the lock for about 11 minutes, but off the land's path.

Question: Should CI stand in for the local suite only with the unfiltered, passing same-platform record, or whenever every workflow run concluded success?
Default: require the record.
What the default gains and misses: gains proof that CI ran the full suite on this OS, and template projects, whose CI uploads no suite record, keep their local suite; misses 3 to 9 seconds per land, and a lost upload costs an 11-minute local run.
Cost of a wrong guess: easy to undo — one condition.
If answered otherwise: any all-success CI skips the local suite, including a project whose only workflow lints or runs a narrowed test step.

## Feature

Feature: FEAT-008 · Integrate and clean up reviewed changes

Rows R-3430 to R-3449 (closed range). R-3430, R-3431, R-3432, R-3434 and R-3435 sit in FEAT-008. R-3433 (the runner's filter field) sits beside R-2547 in its feature. R-3436 (preamble) sits in FEAT-006 and replaces R-1110. R-3437 (ruling and working pattern) sits in FEAT-001 beside R-1410. Each cites FEAT-008.

## Threat model

In scope, honest variation in our tools' output: GitHub and Actions outages, API errors and rate limits; `gh` missing, signed out, slow or printing a malformed list; cancelled, re-run (whole or failed-jobs-only), queued and running runs; several workflows per tip; a flaky leg that passes on a re-run; a tip with no run; a missing suite-record upload (it is `continue-on-error`); artifacts past retention; records from earlier attempts, other platforms, two darwin legs, or a filtered or empty run; a lane that narrows the CI step or breaks the runner's collection; a land machine on another OS than CI; a seat pi that differs from CI's.

Out of scope: deliberate forgery — a workflow or person uploading a fake record, a forged `gh` on PATH, a tampered land ledger. A finding outside the model is a residual.

Residuals to record as known bugs (the seat writes them; builders never edit known-bug files):

- FEAT-008: "the latest attempt wins" (line 14) now also lets a re-run flake stand in for the local suite.
- FEAT-008: a stacked pull request with a non-main base tests another tree (A6, N2).
- FEAT-008: the fallback list leaves out the runner config and Windows skip files (A9).
- FEAT-008: a project whose seat pi differs from its CI pi has no suite run against the seat's pi (A3).
- FEAT-029 line 18 and FEAT-039 line 46: the runtime map and land report are also skipped at CI lands.
- The suite-record feature: the slower-file baseline (R-2551) thins because builders and CI lands record no local runs; CI slow-file notes (R-2754) partly replace it.
- FEAT-031 or FEAT-008: the macOS CI runner skips R-1740 and R-1741, so a macOS-only break there is caught only by a local run.

## Precedent

- packages/nana-pack/lib/land-ci.mjs — the pure `ciScope` and `judgeRuns` judgements. Add the record proof and the changed-path test as pure functions here, each returning a proof or a reason.
- packages/nana-pack/bin/nana-land.mjs — `runLandCore`'s `ci` and `suite` stages, its injected `runGh`/`runGit`/`now`, and the `lifecycle` object. Inject `platform` the same way (S4). The changed-path list reads `git diff --name-only` through the injected `runGit`.
- packages/nana-pack/lib/ci-records.mjs — `readCiRecords` returns `parsed` items with run, leg, attempt and record. Import it; never re-implement artifact listing or download.
- packages/nana-pack/lib/land-ci-records.mjs — `keepLandCiRecords` and its private `budgetedGh` wrapper. Ruling 2026-10-22: if the pre-merge read needs the budget wrapper, move it to a named export in this module and import it; do not copy it.
- packages/nana-pack/lib/gh-runner.mjs — `ghDefault` and `ghEnvironment`, already used by nana-land; the one retry wraps this seam.
- packages/nana-pack/lib/land-config.mjs — contract values and tunables with provenance (`CI_READ_TIMEOUT_MS`, `CI_DONE_STATUS`). The fallback path list, the retry count and the `suite:` prefix go here.
- packages/nana-pack/lib/land-records-config.mjs and packages/nana-pack/lib/land-records.mjs — the vocabulary, `renderLandRecordLine`, `renderLandAttemptLine` and `landLaneSummary`. Add the suite source the way the CI state was added.
- scripts/test.mjs — the schema-1 whole-run record write (`NANA_SUITE_RECORD_FILE`) and the `filters` array it already computes; add the field there.
- packages/nana-pack/lib/suite-records.mjs — `baselineText` and `baselineOf`; only the "the next land records one" text changes (S6).
- packages/nana-pack/tests/land-fixtures.mjs — `ciFixture`, `workflowRun`, `runList` and `executeCi` with its `suiteRan` flag. Extend the fake gh to answer the artifact list and download calls, as packages/nana-pack/tests/land-ci-records.test.mjs already does.
- packages/nana-pack/prompts/builder-preamble.md and packages/nana-pack/tests/worker-lane.test.mjs — the `RULE_LINE` pins for R-1110. Change four lines in place and pin each.
- packages/nana-pack/rules/nana-rulings.md and packages/nana-pack/tests/rulings.test.mjs — the dated-bullet format; append one bullet.
- templates/_shared/working-under-nana-pi.md — the single source of the shared land checklist. AGENTS.md's marker region is its rendered copy, regenerated with `nana-setup project`.
- AGENTS.md — "Shared-machine test runs" is nana-pi's own section after the markers; "CI covers this repository's suite" goes there only (S7). "Install check before a land" is left alone.
- packages/nana-pack/README.md (the `nana-land merge` paragraph) and README.md (the runtime-map and land product report sentences) — the contract text the readme check holds.

From `npm run map:search`: "judge CI workflow runs for land" and "land record CI state vocabulary" returned the land modules above. "fall back when gh read fails" added `gh-runner.mjs`.

## Outside precedent

bors-ng (Apache-2.0, archived) — borrow: its merge gate is the CI status of the exact commit being merged, with no local test run, and a missing status never counts as a pass.

Also seen: GitHub's required status checks (a service, not open source) gate merges on named checks the same way.

## Must-meet

Eight tests, rows R-3430 to R-3437. Build order: 4 (runner field) first, because the proof reads that field; then 1 to 3 and 5; then 6; then 7 and 8.

1. **R-3430 — CI stands in for the suite.** WHEN CI applies, every newest run succeeded, the lane changes no fallback path, and the qualifying-record rule holds for the injected proof platform, nana-land shall merge without running `--suite`. It prints one `suite: ci` line naming the run id, attempt and platform, and writes `suite: "ci"` and `suiteMs: null` in the end record. Pins: the injected suite never called; the exact line; both fields. The test injects `platform: "darwin"`, so it runs the same on every CI leg.
2. **R-3431 — an unproven full suite falls back.** IF every newest run succeeded but the qualifying-record rule fails, THEN nana-land shall run `--suite` and print `suite: local` naming why. Table test, each case calling the suite once:
   - no record for the injected platform;
   - only another platform's record;
   - a non-zero exit;
   - `filters` non-empty;
   - `filters` missing;
   - zero final files;
   - a passing record only from a superseded run;
   - an earlier attempt passing where that leg's highest attempt in the run failed;
   - two darwin legs with one failing;
   - a records read that fails or passes its budget.
   One positive case: a failed-jobs-only re-run whose darwin record exists only at attempt 1, with the run's latest attempt `success`, qualifies.
3. **R-3432 — a lane that changes CI or the runner falls back.** IF the diff from captured main to the tip names a path under `.github/workflows/` or `scripts/test.mjs`, THEN nana-land shall run `--suite` even when a qualifying record exists, and print the declared reason. Pins: suite called for each path, plus a negative: a change elsewhere under `scripts/` still skips.
4. **R-3433 — the runner records its filter.** WHEN `scripts/test.mjs` writes a whole-run record, the record shall carry `filters` as the array of path filters it used, empty for an unfiltered run. Pins: `[]` for a full run and the given substrings for a filtered one.
5. **R-3434 — refusals stay refusals.** IF CI applies and gh cannot read it, a newest run is unfinished, cancelled or failed, or the tip has no run, THEN nana-land shall refuse before any suite with today's text, even when a qualifying record would exist. Pins: `suiteRan` false for a gh non-zero exit after its one retry, a cancelled run beside a passing darwin record, and a tip with no run. One sealed-tunable test pins the retry count by name. (Flips if Question 1 is answered otherwise.)
6. **R-3435 — every reader names the source.** WHERE CI does not apply, nana-land runs `--suite`, and its end record carries `suite: "local"` with CI state `skipped`. `renderLandRecordLine` and `renderLandAttemptLine` (the build report's land lines) show `suite ci` for a CI land and the local minutes otherwise. `landLaneSummary` counts a CI land's suite as 0 minutes. An end record from before this lane, with no `suite` field, renders byte for byte as today. Pins: the rendered lines and the summary.
7. **R-3436 — the builder preamble (replaces R-1110).** The preamble shall carry each of these lines exactly once, with R-1110's other rules unchanged, and none of the three replaced lines:
   - `Each commit follows a green run of the tests your change touches.`
   - `Run the repository's full suite only where its \`AGENTS.md\` says CI does not cover it, with one machine lock when the repo declares one. Read every exit code standalone; no pipe before \`&&\` or a commit.`
   - `Where \`AGENTS.md\` says CI covers the suite, push your last commit and stop: do not wait for or read its CI run, and commit nothing after the push.` (replaces "read CI once")
   - `Then commits; per item, files, rows, mutation pairs, commands and exit codes; the pushed branch, the pushed tip's full SHA and the push's exit code, or the full-suite summary line with its check count where you ran it; and what was not done.`
   R-1110's twelve rules map one to one: "touched tests before each commit and the full suite before the last" becomes the first line, "read CI once" becomes the third, and "the suite check count in the report" becomes the fourth. The second line is pinned as a new line. Pins: the four `RULE_LINE` entries, plus a check that the old touched-tests, read-CI-once and report-shape text is absent.
8. **R-3437 — the ruling and the working pattern.** `nana-rulings.md` shall carry one 2026-11-01 bullet and still carry the 2026-10-10 Windows bullet and the 2026-10-12 install-check bullet unchanged. The shared land checklist shall say that `nana-land` runs the suite only when the tip's CI cannot stand in, where the project's AGENTS.md says CI covers its suite. Its closing post-land step shall read "run map and README checks and the suite check this project's AGENTS.md names" in place of "locked full-suite checks" (S6). nana-pi AGENTS.md's Shared-machine section shall say that CI covers this repository's suite and that main's push run, read by the seat's main CI check, is the post-land suite check. Pins: the bullet by text; both older bullets present; the sentences; AGENTS.md's marker region equal to the rendered shared source.

Proposed ruling bullet (does not contradict the 2026-10-10 Windows ruling, since every nana-pi land still needs a passing CI run):
`- 2026-11-01: In nana-pi, a tip's passing GitHub CI stands in for the local full suite for builders, seats and lands. Builders push and do not wait; the seat waits for CI. The local locked suite runs only when CI cannot stand in.`

### Expected changes to existing tests and rows (forecast, never a limit)

- packages/nana-pack/tests/land.test.mjs: R-2588's case still runs the suite when its fixture has no records; its title and row change (O4). Cases that assert `suiteRan` true after a CI pass keep it only without a qualifying record.
- packages/nana-pack/tests/land-records.test.mjs and the build-report land lines (R-2811, R-2814, R-2815): the new fields.
- packages/nana-pack/tests/suite-records.test.mjs: the `baselineText` wording ("the next land records one" becomes, for example, "the next local land or hand run records one").
- packages/nana-pack/tests/test-runner.test.mjs or the record-file tests: the new `filters` field.
- packages/nana-pack/tests/ci-records.test.mjs and land-ci-records.test.mjs: only if they validate record keys, or if O1 moves the read.
- packages/nana-pack/tests/worker-lane.test.mjs: the three replaced pins.
- packages/nana-pack/tests/runtime-land.test.mjs: no change expected; the locked suite's land path is untouched and runs on every fallback land.
- REQUIREMENTS.md:
  - R-977 and R-2588 (O4);
  - R-1110 retired for R-3436;
  - R-981 and R-1005 wording that says "after the suite";
  - the `Made by:` lines for R-1272, R-1014 and R-2547 name fallback lands and the hand commands (Question 2).
- `npm run map` after the module changes. `map:check`, `readme:check`, the requirements trace and the tree check are green.
- This lane changes `scripts/test.mjs`, so its own land falls back to the local suite by R-3432. That is expected.

### Seat wrong-code pairs (gate lane)

1. Skip the suite whenever `judgeRuns` passes, with no record proof → test 2 fails.
2. Accept a filtered record, or one with no `filters` field → test 2 fails.
3. Accept a record with zero files → test 2 fails.
4. Accept another platform's record, or read `process.platform` instead of the injected value → tests 1 and 2 fail.
5. Accept a superseded run's record, or an earlier passing attempt over a failed later one → test 2 fails.
6. Ignore the changed-path list → test 3 fails.
7. Fall back to local on an unreadable or cancelled CI → test 5 fails.
8. Record `suiteMs` 0 on a CI land, or render an old record differently → tests 1 and 6 fail.
9. Leave the old "full suite before the last" text in the preamble beside the new line → test 7 fails.

## The differing check

The seat's count at tip 6c4b5363 was this Mac 8,908 pass and 44 skip, and CI's macOS leg (run 41324050038) 8,906 pass and 45 skip. File labels match: 252 files with identical final labels on both, confirmed again in plan-attack.md. Re-running every CI-skip file locally at the same tip found three differing check outcomes in two files, which add up exactly to the totals:

- `packages/nana-pack/tests/post-edit-utf8.test.mjs`: R-1740 and R-1741 pass here but skip on CI macOS ("the direct control already wrote UTF-8 bytes under the forced host locale"). The runner's Python ignores the forced ISO-8859-1 locale, so the test cannot set up the failure.
- `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs`: CI macOS has `pwsh`, so the pwsh oracle really runs. This Mac has none and prints one extra SKIP line, so CI covers more here.

It does not matter for a land. CI's Windows leg, which blocks, runs and passes R-1740 and R-1741 (4 pass), and a non-UTF-8 default code page is the real-world case there. The real coverage difference is the pi version, not a check: CI's suite legs run pi 1.4.0 and this Mac runs 1.0.2, below the 1.0.3 floor. Thirty suite files exercise the installed pi. A3 closes this by upgrading the seat's pi to 1.4.0.

## Unresolved

- Question 1's default narrows the owner's "unavailable" to "cannot stand in". The owner's words can also read as "fall back during an outage", which the default refuses to protect the Windows ruling. The owner should confirm.
- Question 2 touches the 2026-10-22 artifacts ruling: three land-made or suite-made artifacts are refreshed only at fallback lands and by hand.
- A3's pi check is by hand. Nothing in `nana-land` compares the seat's pi to `PI_VERSION`. A later lane could add that comparison, or the seat can make it a land note.
