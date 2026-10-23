# ci-timing-records: plan attack (adversary, 2026-10-22, main 61ac64f3)

Target: `lanes/ci-timing-records-plan-draft.md`. Every claim below was measured on the seat Mac at 61ac64f3 with read-only reads and GET calls, unless it says "inferred". Raw logs and scripts for the measurements are in the session scratch `ctr-attack/`.

Counts: **M 4 · S 12 · N 12**.

Confirmed from the draft (no change): the rows use only R-2631 to R-2638; all eight are red on main (no knob, no upload step, no script); the brief check passes on the draft (`brief-check.mjs` → `precedent: 14 checked at HEAD 61ac64f3`); the two runs at 61ac64f3, the attempt-2 copy shape, the job names, 0 artifacts, 90-day retention and gh 2.91.0 all re-measured as stated; `NANA_SUITE_RECORD_FILE` is scrubbed from test children (scripts/test.mjs:327); the step `env:` placement after `if:` keeps R-597, R-996, R-1031, R-1313, R-2556, R-2557, R-2558 and R-2577 matching (ci-workflow.test.mjs read in full); `runner` context is not available in job-level `env`, so per-step env is right; lane class ordinary is right for the scope as drafted.

---

## M — must change the plan

### M1. The reader logic sits where no package can reuse it, and a concurrent lane builds the same gh access

- **What.** All gh access, run, artifact and job resolution go into `scripts/ci-records.mjs`. The code map forbids packages to import scripts: `code-map.config.json` layer "apps": "They may import the packages; a package may not import them", and `scripts/` matches that layer. The land-reads-ci lane is a build pick in this same power-mode slate (gate class, R-2586 to R-2595). It makes nana-land read the CI result, so it needs the same "runs for a sha, latest-attempt jobs" gh calls (inferred: no plan text for it exists in the repo or the session scratch at 61ac64f3). Two gh runners would land a day apart. The plan rule says a copy is a finding. The Precedent line "none: no tracked code calls gh today" is true at main, but it misses that sibling.
- **Change.** Put the gh runner, the run, artifact and job resolution and the record reading in `packages/nana-pack/lib/ci-records.mjs` (fs, gh and temp root injected; names in the config). Make `scripts/ci-records.mjs` a thin `main(argv, gh)` CLI on the requirements-moved shape. Add a Precedent line naming land-reads-ci's module, and add a seat step. Whichever lane lands second merges main and imports the first lane's runner instead of keeping its own. If land-reads-ci lands first, this lane's build brief names its module by path.

### M2. The plan counts a reader nothing runs

- **What.** The plan adds `Read by: R-2632 · code: scripts/ci-records.mjs`. Measured: `node scripts/requirements-tree.mjs --check` prints `deliverables: 14 of 39 made and read by code`, so the plan's lines make it 15 of 40. But ci-records runs only in this lane's own seat step. No land step, hook, CI step or rule calls it after the lane. This is the runtime-map gap that triggered the owner's 2026-10-22 ruling: built, and never used. Repo precedent for seat-run commands is honest about it. R-1560 says "Made by: manual: someone runs review-timeline by hand; no brief, land step or hook calls it / Read by: person". R-1460 says "Made by: manual: the seat runs scripts/requirements-moved.mjs by hand / Read by: rule".
- **Change.** Pick a trigger and write the line to match it.
  - (a) Default: `Read by: R-2632 · person: the seat runs scripts/ci-records.mjs by hand; no land step, hook or CI step runs it`, with no code line. The count stays at 14 of 40, and a FEAT-031 known-bug line says the same. The Landed and HANDOFF text must not call the records read by code.
  - (b) nana-land's CI check (land-reads-ci, or its follow-up) calls M1's lib and prints the tip's `ci record:` lines with the land note prefix, as suite-records' lines reach the land report. That is a real code reader. Doing it in this lane makes it a land-tool lane: gate class, land reviewer, independent check.
  - Add to Open: "nana-land prints the tip's CI record lines": default `yes`, in land-reads-ci or the lane after it.

### M3. R-2636 (the runtime-map ratio line) fails the subtraction test, and it drops the comparison suite-records assigned to this lane

- **What.**
  - suite-records' D7 (docs/reviews/suite-records-2026-10-22/plan-draft.md:33) decided "Do not merge into the runtime map". It gave the next CI lane this job: "compare it with the newest main run's record for its platform, using this lane's comparison code".
  - The draft's D6 serves the merge question, which D7 already decided and which the draft itself answers "no merge". Its second use, a Windows bound for setting a time limit, comes straight from R-2635's slowest line on the Windows record. That line holds real Windows seconds, so it needs no ratio.
  - R-2636 adds two tunables (`RATIO_MIN_SECONDS`, `RATIO_QUANTILES`), a map read, a new quantile routine and the widest test. apps/bench/aggregate.mjs:29-35 already holds a quantile routine (linear interpolation). Meanwhile the draft's D7 lists "each leg compares with main's last record" under "not in this lane", with no reason.
- **Measured** (job logs of three consecutive main push runs: 39817301252, 39835301485 and 39840123612, attempt 1). slowerText's thresholds (≥ 10 s and ≥ 1.5×) between consecutive same-leg runs find these slower files per pair: macOS 0 and 1, Windows 1 and 3, Linux 0 and 4. At least one is real growth: precedent-first added 171 lines to worker-lane.test.mjs between the last two tips (`git diff --stat`). So the D7 comparison prints at most 4 files per leg, inside `SLOWER_LIST_MAX`.
- **Change.** Drop R-2636, `RATIO_MIN_SECONDS`, `RATIO_QUANTILES`, the map read and pairs 13 and 14 (default `drop`). Keep the ID for one of these:
  - (a) Default: leave R-2636 unused.
  - (b) If the seat wants a comparison: "WHEN ci-records prints a record, it shall follow it with the slower line against the newest earlier push run on main whose same leg has a record, or say none exists". It reuses `slowerText` (suite-records.mjs:180-195, exported) and the decided D7 design.
  - Either way, add to Open: "comparison line": default `drop`.

### M4. The default lets a record upload failure block release, against this record family's own rule

- **What.** The draft keeps the upload step without `continue-on-error`, so an artifact-service failure fails a leg. ci.yml:88 has `release: needs: [suite, install-check]`, so on macOS or Windows that blocks release. Main never fails a leg for a reason outside the tests today. suite-records settled the rule for this record (D3, adversary M2, and R-2553): "a record problem never changes the suite's exit code". The runner's own write sits in a try/catch for exactly that reason (scripts/test.mjs:598-614). R-1530's helper rejects every step-level `continue-on-error` (ci-workflow.test.mjs:120-126). It does so because one on an `npm test` step would quietly stop a failing suite from blocking release.
- **Change.** Flip the open question's default to `yes`.
  - Put `continue-on-error: true` on the upload step only.
  - Narrow R-1530's helper. It reads job-level lines as today, and accepts exactly one step-level `continue-on-error: true` when it sits inside the `uses: actions/upload-artifact@v4` step. It still refuses one on any other step.
  - R-2632's test pins it. Add the pair "continue-on-error moved onto an npm test step", which must turn R-1530 red.
  - Move the "artifact-service failure blocks release" line out of Known limits. In its place: "an upload failure leaves that leg without a record; the reader names it."

---

## S — should change

- **S1. R-2633 is wider than its test.** The row says "under CI's `--verbose` and `--jobs` arguments". The test passes `--verbose --jobs=2`, but CI passes `--jobs=${{ env.NANA_CI_JOBS }}` (4) and `--verbose` only on Windows (ci.yml:82-85). If CI's arguments change later, nothing notices. Change: read the runner arguments from ci.yml's two `npm test` lines in the test, with `NANA_CI_JOBS` taken from the job env. Or narrow the row to "under `--verbose` and `--jobs=N`".
- **S2. Pair 11's second half survives.** `rootRecord` (test-runner.test.mjs:519-526) has PASS, FAIL and SKIP files but no unnamed failure, and the draft's R-2634 fixture lists none. So "unnamed failures left out of FAIL" stays green. Change: R-2633 also reads `recordedMutation`'s record (test-runner.test.mjs:563-577, a tracked-file change gives one unnamed failure), or R-2634's fixture adds an `unnamedFailures` entry. Note that a self-test mismatch is pushed to `unnamedFailures` without `tally.FAIL++` (scripts/test.mjs:595). Any count must match the runner's printed totals, which is the rule R-2633 checks.
- **S3. The fake gh does not behave like the real one.** Measured: `gh help exit-codes` says auth required exits 4, not 1. A 404 from `gh api` writes `{"message":"Not Found",…,"status":"404"}` to stdout and `gh: Not Found (HTTP 404)` to stderr, with exit 1. A reader that ignores the status reads that body as an empty listing. It then says "no CI run" or names every leg missing, never "gh failed". Change: R-2638's signed-out case exits 4. Every failing fake prints a JSON error body on stdout. The pair is "only status 1 is a failure, or stdout is parsed whatever the status".
- **S4. A leg still running reads as a missing record.** v4 artifacts show in the REST listing as soon as they upload (inferred from upload-artifact v4's docs; 0 artifacts exist to probe). So during a run, finished legs print and running legs fall into R-2637's "no record" line with a null conclusion. The draft's only in-progress case is R-2638's "no artifact at all". Change: add an R-2637 case where a job's `status` is `in_progress` or `queued`. The line names the leg as still running, not missing. Add that pair.
- **S5. A re-run that dies before its write stays hidden.** R-2637 fires only when a leg has no record artifact "in that run". Take a failed leg re-run with "re-run failed jobs" whose attempt 2 crashes or is cancelled before the runner writes. Attempt 1's record still exists, so nothing says the newest attempt has none. Change: a leg's latest-attempt job whose `started_at` is later than its newest record artifact's `created_at` gets the line "attempt N left no record". This works because copied jobs keep attempt 1's times, measured on job 120087894627, and attempt 1's record was made after that start. Note: `created_at` on artifacts is inferred from the REST schema. Add the case to R-2637's test.
- **S6. No row covers one run's listing failing while another prints.** If the artifacts or jobs call fails for one run (rate limit, network) while another run prints, R-2637 covers only download and read failures, and R-2638 covers only total failure. Change: widen R-2637 to "or a run's artifact or job listing fails". Add the fake-gh case: the jobs call fails for run 2, and run 1's records still print with exit 0.
- **S7. The temp cleanup in `finally` has no guard on Windows.** FEAT-031's known bugs record an EBUSY on temp cleanup that killed the runner in run 39464607963. The draft removes the download root in `finally`. A throw there replaces the printed result and the exit code. Change: wrap the removal. A failure prints one line naming the folder, and the exit code stays as computed. Test it with an injected remove that throws EBUSY.
- **S8. Two upload-step forms go unpinned.** (a) `if-no-files-found: error` would turn a runner write failure into a failed leg. R-2546 and R-2553 let that write fail while the suite passes. (b) An upload `path:` that differs from the knob path: R-2632 asserts "the same path expression", but no pair drives it. Change: R-2632 pins `if-no-files-found` absent or `warn`, and both forms become pairs.
- **S9. Sixteen pairs is above the 8 to 15 bound,** and the strongest new cases have none. Proposed 15:
  1. upload with the default `if`
  2. name without `github.run_attempt`
  3. upload path not the knob path
  4. `if-no-files-found: error`
  5. knob on the non-Windows step only
  6. `continue-on-error` moved onto an `npm test` step (R-1530, per M4)
  7. no workflow-path filter
  8. only the newest attempt per leg kept
  9. every artifact downloaded into one folder
  10. revision passed unresolved
  11. unnamed failures left out of FAIL
  12. slowest list ascending, uncapped or holding a SKIP
  13. legs matched to artifacts by attempt
  14. a running leg reported as missing
  15. gh's status ignored, or only status 1 treated as failure

  Dropped: the per-leg-name pair, which R-2632's name check already covers; the runner-context pair, which GitHub refuses at parse and the draft PR shows; the expired-artifact pair, merged into 7's case set; and pairs 13 and 14 with R-2636 (M3).
- **S10. The README must name gh as a runtime dependency.** AGENTS.md says "Every README states its runtime dependencies" (the owner, 2026-09-09). The draft's README sentence names the command but not gh, its sign-in, or the only tested system: gh 2.91.0 on macOS. Change: add a note under README's Dependencies, or a line in the sentence, saying ci-records shells out to gh, signed in. Also note that tests use a fake and that a real gh was run on macOS only.
- **S11. `CI_WORKFLOW_PATH` already names something else.** ci-workflow.test.mjs:17 reads `process.env.CI_WORKFLOW_PATH`, an absolute override for which workflow file the test reads. R-2631, R-2632 and the seal test live in that file and would import a constant of the same name with another meaning: GitHub's run `path`. Change: rename the constant, for example to `CI_WORKFLOW_RUN_PATH`. One name for one thing.
- **S12. The re-run survival claim is inferred, not measured.** "Both the failing and the passing record of a re-run leg survive" follows from the measured re-run shape. But that runs' artifact listing spans attempts is unmeasured: there are 0 artifacts. The draft PR proves only attempt 1. Change: mark it inferred. Add a seat step: on the draft PR, re-run one leg (`gh run rerun <id> --job <job id>`, the Linux leg is the cheapest at about 7 min). Then confirm ci-records prints that leg's `-1` and `-2` records and does not call the copied legs missing.

---

## N — notes

- **N1. D1 has a stronger reason.** scripts/requirements-tree.mjs:273 reports a deliverable "is homed under another capability". FEAT-019 is under CAP-04, so R-2632 can be a CAP-07 deliverable only if it lives in FEAT-031. Add this as the first reason.
- **N2. `GH_PAGE_SIZE` is measurable, and was measured.** `per_page=150` on the runs endpoint returns 100 (2026-10-22). Provenance: measured, not inferred.
- **N3. The draft's ratio table does not reproduce at p90.** This matters only if R-2636 survives M3. Map seconds equal the land record's for all 208 files. Nearest rank against the map at 61ac64f3 gives macOS 1.03/1.52/2.41, Linux 0.53/1.08/2.24 and Windows 0.98/2.51/4.41. The draft says 2.28 and 2.15 at p90. Linear interpolation gives 2.36 and 2.22.
- **N4. Say why a record beats parsing the logs.** suite-records' D7 called upload alone an orphan because "CI logs already keep the same lines for 90 days". Measured: the Windows verbose log of job 120038628458 holds 7,448 lines that start with `PASS `, against 190 runner per-file lines. The record is R-2546's pinned schema; the log is human output. Put this in D2.
- **N5. Keep suite-records-config.mjs importing only land-config.mjs.** R-2553's real-runner fixture (suite-records.test.mjs:459-460) copies exactly five config files into a temp root. A new import there breaks R-2553 for a reason unrelated to records.
- **N6. R-616's person line is already stale on main.** "Nothing keeps the seconds" stopped being true when suite-records landed, because R-2547 keeps them locally. Say the edit fixes a stale line as well as adding CI.
- **N7. A live use exists.** HANDOFF Next item 4 counts first-try Windows failures over the next 20 CI runs, by hand today. The attempt-numbered records answer it directly. Name it in D5 as the first use, and name a count mode across main's runs as the follow-up.
- **N8. R-2634's row says "each record artifact", but the test skips expired ones.** Write "each unexpired record artifact".
- **N9. Show labels in R-2635's list.** A timed-out FAIL at the per-file limit is the entry the time-limit question needs, so the slowest list should show any non-PASS label beside its seconds. R-1272's "any non-PASS label" is the precedent.
- **N10. More precedent.**
  - The test-side JSON command knob: packages/nana-pack/tests/land.test.mjs:562 and runtime-land.test.mjs:178, which use `[process.execPath, fake]`.
  - Running the real runner from another test file: suite-records.test.mjs:452-470 (`runnerFixture`). With it, R-2633 could live in ci-records.test.mjs and keep test-runner.test.mjs free of a ci-records dependency.
  - A Windows PATH-command launch, if gh ever arrives as a shim: packages/nana-pack/bin/review-launch.mjs:26-29.
- **N11. Two line numbers are off by one.** runtime-map.mjs `dataPath` is :34-42 and `loadRuntime` is :63-78. The other cited lines match.
- **N12. A simpler gh call exists, with a trade.** `gh run list --commit <sha> --workflow ci.yml --json databaseId,event,attempt,status,conclusion` returns 312 bytes against 23,880 for the raw runs call. It filters by workflow on the server, and `gh run view <id> --json jobs` gives the latest attempt's jobs. Both depend on gh-version flags; the raw `gh api` path does not. Keep `gh api`, but the 4 MiB cap then needs to exist. Node's default spawnSync maxBuffer is 1 MiB, below the draft's 1.2 MB estimate for 100 runs.

## Open questions this attack adds (one-word defaults)

- The reader's trigger: the seat by hand, recorded as a person reader, or nana-land at each land (M2): default `person` for this lane, then `yes` to nana-land printing the tip's lines in land-reads-ci or the lane after.
- R-2636: drop, or replace with the slower line against main's last same-leg record (M3): default `drop`.
- `continue-on-error` on the upload step only (M4): default `yes`.
