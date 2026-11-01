# ci-suite plan attack (2026-11-01)

Adversary for the `ci-suite` gate lane. Read: the plan, `nana-land.mjs`, `land-config.mjs`, `land-ci.mjs`,
`ci-records.mjs`, `land-ci-records.mjs`, `suite-records.mjs`, `land-records.mjs`, `scripts/test.mjs`,
`scripts/test-locked.mjs`, `scripts/product-report.mjs`, `.github/workflows/ci.yml`, the builder preamble,
`pi-watchdog.mjs`. Checked with `gh run list` and the stored local and CI records for tip 6c4b5363.
Threat model as the plan states it: honest variation in, forgery out.

## MUST

### M1. The record proof does not prove the full suite ran — the lane under test defines its own proof

The proof accepts any darwin record with `exitCode` 0 from a judged newest run. The record says nothing
about *which* suite ran: `scripts/test.mjs` writes `files`, `exitCode`, `platform`, `jobs`, `coverage`
and no filter list (lines 614-630), and `collect()` silently narrows to `filters` (line 194). The
workflow and the runner the CI run executes are the lane's own versions, read from the tip.

Failing cases (all honest):
- A builder narrows the macOS step to `npm test -- packages/nana-pack/tests/land` while chasing a CI
  failure and does not revert it. CI goes green, the darwin record holds 6 files with exit 0, the run
  concludes `success`, and the land merges with no full suite anywhere.
- A lane changes `scripts/test.mjs` so `collect()` finds nothing (a moved tests folder, a bad exclude).
  The record has 0 files and exit 0; the proof passes.
- A lane adds a CI-only entry to the runner's skip table; the darwin record passes with that file
  skipped, and no local run ever executes it.

Fix:
1. Fall back to the local suite, with reason `the lane changes the CI workflow or test runner`, when
   `git diff --name-only <captured main> <tip>` touches `.github/workflows/` or `scripts/test.mjs`
   (declare the list once in `land-config.mjs`).
2. Have the runner write `filters` (the array it used) into the record; a qualifying record has
   `filters` present and empty and at least one final file. Old records without the field do not
   qualify (fail closed; they fall back).
3. Add both cases to R-3432's table and to the seat's wrong-code pairs ("accept a filtered record").

### M2. "Same coverage" misses the pi version — the local suite was the only suite run against the pi the seat uses

The plan's differing-check section compares outcomes only. It misses what the suite exercises:
- CI's suite legs install pi `1.4.0` (`PI_VERSION`); the floor `1.0.3` runs only in install-check,
  never under the suite.
- This Mac runs pi `1.0.2` (`pi --version` and `$(npm root -g)/@earendil-works/pi-coding-agent`,
  checked 2026-11-01), below the supported floor.
- 30 suite test files reference the installed pi (`git grep -l "npm root -g\|findPi\|pi-coding-agent"`
  over package and app tests).

So after this lane no full suite ever runs against the pi version the seat actually runs. A pack
change that breaks on the owner's pi but passes on 1.4.0 lands green. The owner's decision rested on
"I'm assuming they have the same coverage"; this is the one real coverage difference and the plan
does not name it.

Fix: add it to "The differing check" and to the owner questions, with options: (a) accept, as a
FEAT-008 known bug, plus a doctor nudge that the machine is below the floor; (b) add a macOS floor-pi
suite leg (about 19 CI minutes per tip); (c) keep the local suite when the land machine's pi version
differs from `PI_VERSION`. Default: (a), stated as such. File-level labels I re-checked: local land
record and CI macOS record at 6c4b5363 both hold 252 files with identical final labels, so the
planner's file-level count holds.

### M3. The fallback on an unread CI contradicts a standing ruling the plan leaves in place

Ruling 2026-10-10: "In nana-pi, Windows testing is required." R-2589's refusal on an unreadable CI is
what enforced it at the land. The plan turns that refusal into a local fallback with no Windows run
(A3), but its proposed ruling bullet neither amends nor removes the 10-10 bullet, and the rulings
file says a new ruling "removes any ruling it replaces". Seats would then hold two contradictory
standing rulings.

Failing case: `gh` is signed out on this Mac (exit 4). The land runs the macOS suite and merges a
change whose Windows leg was never run; under the 10-10 ruling that land should not have happened.

Fix: either (a) name the conflict as an owner question with the default "fallback lands are the one
exception; main's push run is the Windows check", and reword the 10-10 bullet in the same change,
pinned in `rulings.test.mjs`; or (b) keep refusing on `unread` in nana-pi (owner's "unavailable" would
then mean only "CI does not apply"). Also: in the gh-missing case the seat's post-land main CI check
cannot read CI either, so "main's push run catches it" is unobserved on that machine; say so.

### M4. The preamble change leaves three lines that contradict it, and the plan pins only one

Only `touchedTestsBeforeCommit` changes (R-3435). Still in `builder-preamble.md` after the change:
- line 31: "Run the repository's full suite as its `AGENTS.md` says, including one machine lock when
  the repo declares one." — ambiguous at best beside the new line;
- `readCiOnce`: "When your brief asks for CI, read the finished run once and report. Do not wait for
  another notification." — conditional on the brief, and says not to wait, while the new line makes a
  finished passing run mandatory and the plan says "read the run state in short commands";
- Report shape: "the suite summary line with its check count" — no such local line exists on a CI
  build; the builder must fetch it from the job log or `ci-records`, which the preamble does not say.

Also the new line's wording "your last commit follows a finished passing CI run on the pushed tip"
cannot be met: any commit after reading CI (the preamble's own "send long script output to a
committed file") creates a new tip with no run.

Failing case: a luna builder reads line 31 plus the shared-machine section's fallback wording, runs the
locked suite anyway (11 minutes, machine lock held), then reports the local summary line — the lane
saves nothing. Or it commits the CI log as the last commit and reports a tip CI never ran.

Fix: edit all four lines in one change and pin each in `worker-lane.test.mjs`: line 31 says the full
local suite runs only where AGENTS.md says CI does not cover it; the CI line says "the final pushed tip
has a finished passing CI run; commit nothing after reading it"; the report shape asks for the CI run
id, attempt and the macOS and Windows totals (`node packages/nana-pack/bin/ci-records.mjs <tip>` prints
them); `readCiOnce` folds into the new line. If the rule count must stay, say which lines merge.

## SHOULD

### S1. The stall watchdog versus a 35-to-40-minute CI wait (inferred, not measured)

`pi-watchdog` kills a pi builder after `--stall-secs` (default 75) of flat CPU on pi's own pid. The
Windows leg's slowest measured time is 34.5 minutes and growing (ci.yml comment). The seat's usual
relaunch value, 1200 s, is shorter than that. A builder that waits with one `gh run watch` or a
`sleep` loop may be killed; one that polls in sub-75 s commands survives at the cost of about 40
model turns. The plan's A4 relies on the preamble wording only, with no test or measurement.

Fix (simplest): the builder pushes, reports the run id and does not wait; the seat (Claude Code
Monitor, or pi foreground) waits, and `nana-land` already refuses until the run passes. That fits
"builders rely on CI" and removes the watchdog question. Otherwise measure one pi build waiting on a
real run under the default and 1200 s before the land, and record it.

### S2. A GitHub Actions outage still blocks every land

During an Actions incident the API answers and runs sit `queued`; the plan refuses (R-2587) and
offers no fallback, and the seat cannot force one (`--suite` is the only lever, and a cancelled run
also refuses under Question 1's default). The owner's words were "local suite only if github CI
unavailable"; a stuck queue is the common form of unavailable. Add this to Question 1 (default
refuse, or "newest run queued longer than N minutes falls back", N declared once).

### S3. Transient read errors become silent Windows-free lands

One 502 or a secondary rate limit on the run-list call now falls back (11 minutes, no Windows). One
retry of the run-list call before declaring `unread` costs under a second and removes most of these.
Declare the retry count in `land-config.mjs`.

### S4. The land machine's platform must be injectable

The plan reads `process.platform`. A fixture holding a darwin record would fall back on the Windows
and Linux CI legs, so R-3430's test either goes red on Windows (which blocks release) or is written
with `process.platform` and never tests a cross-platform mismatch. Inject `platform` into
`runLandCore` like `runGh`; R-3432's "only another platform's record" case uses it.

### S5. Readers of the land record beyond the closing line

- `renderLandAttemptLine` (used by `build-report` land lines, R-2814) prints `suite -` for a CI land,
  identical to a refusal before the suite. R-3434 pins only `renderLandRecordLine`. Pin the attempt
  line too (`suite ci`).
- `landLaneSummary` sums `suiteMs`; a CI land contributes 0, which is right, but say so in R-3434.
- Decide `suiteMs` for a CI land (null, not 0) and pin it; the 10-24 land-records mutants include
  "a preflight refusal records suite 0", so the null-versus-0 meaning is already load-bearing.

### S6. Readers of the local suite-record store lose their input

- `suite-records.mjs` `baselineText` prints "no baseline exists (the next land records one)"; after
  this lane the next land usually records nothing, so the line is false. Change the text.
- `baselineOf` prefers `trigger === "land"` records on main; with builders and lands not running full
  suites, the slower-file comparison (R-2551) has almost no baseline. The CI slow-file notes (R-2754)
  partly replace it. Record as a residual.
- The shared land checklist still ends "Then run map, README, and locked full-suite checks" after the
  land. If that stays, the 11 minutes move rather than disappear; if it goes, say so in R-3436.

### S7. Keep "CI covers this repository's suite" out of the shared region

`templates/_shared/working-under-nana-pi.md` renders into every nana project's AGENTS.md. The template
projects' CI is one Linux job with no suite record. If the shared checklist says CI replaces the local
suite, builders in those projects stop running their suite while their lands always fall back. Put the
"CI covers the suite" sentence in nana-pi's own Shared-machine section only; the shared checklist says
only "where the project's AGENTS.md says CI covers its suite".

## NOTE

- N1. Stale and wrong-SHA runs: safe. Runs are listed by `head_sha=<tip>`; any later commit (docs-only
  included) is a new SHA with no run and refuses. The records reader filters by the same SHA.
- N2. Pull-request merge commit (A6): holds only when the PR's base is main. A stacked PR whose base is
  not an ancestor of the tip tests a different tree. Cheap guard: require the run's
  `pull_requests[].base.ref` to be `main` for `pull_request` events, or record it as a residual.
- N3. Failed-jobs-only re-runs: safe as planned. The carried macOS job keeps its attempt-1 artifact and
  `jobs?filter=latest` reports it at attempt 1, so `ci-records` raises no "left no record" problem.
  A full re-run whose macOS attempt-2 upload failed falls to the attempt-1 record; both are the same
  SHA and the run succeeded, so that is acceptable.
- N4. Linux `continue-on-error`: A1 is right; the run concludes success with a red Linux leg, and the
  darwin proof never reads the Linux record.
- N5. Two darwin legs (a future `macos-13` beside `macos-latest`) make "the leg whose platform equals"
  ambiguous. Define it as "every darwin leg's highest-attempt record passes".
- N6. The proof read downloads every artifact of every `ci.yml` run for the SHA (3 legs, up to 2 runs)
  inside the 60 s budget. Only the darwin artifact of the judged run is needed; fine at today's 3-9 s.
- N7. The local land suite ran under coverage with one plain re-run of failed files (`rerun-failed`);
  CI runs once, plain. CI is stricter on flakes, looser on coverage-only failures. No action.
- N8. Artifact ages on the product page: with CI lands, the runtime map, the land report and the
  suite-record store age past the 30-day stale line unless fallbacks or hand runs refresh them.
  Question 2 covers the first two; add the suite-record store.
- N9. Pages workflow (`pages.yml`) runs on push to main and on issues only, so it never judges a lane
  tip. After a land, the tip SHA gains a `push` ci run; irrelevant to the land.

## Must-meet coverage

The six tests pin the main path well. Missing, by finding:
- M1: a passing darwin record from a filtered run falls back; a lane touching the workflow or runner
  falls back.
- M3: the ruling text change, if (a).
- M4: each changed preamble line.
- S4: a cross-platform mismatch with injected platform.
- S5: the attempt line renders `suite ci`; `suiteMs` null on a CI land.
- Not needed as must-meets: S2 and S3 thresholds (sealed-tunable pins only).
