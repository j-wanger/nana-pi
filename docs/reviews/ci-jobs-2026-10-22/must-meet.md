# ci-jobs · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-019 · Release usable templates and report support

Class: ordinary (the CI workflow, one test file, the ledger and its outline; no install, hook, gate or land-tool file). Ladder: the seat's wrong-code pairs, one final reviewer from another model family, and the CI evidence below. Builder: the small builder. Threat model: honest variation in scope — a slower or busier hosted runner, fewer cores, a file near its time limit, a hung test file, held output; deliberate forgery out (a hand-edited workflow that skips the suite).

Ruling: the owner, 2026-10-22, top priority — artifacts and timers come from the runs that already happen. The wall-time audit found each CI wait about 33 minutes, set by the Windows suite leg running one file at a time. HANDOFF's queue names "CI runs four test files at a time".

## Measurements

Probe PR #165, run 39761155058 at main 09e38e7d with `--jobs=4`; baseline run 39749520397 at one file at a time; the adversary parsed eight more 10-22 runs (39698024336 to 39755437952).

| Leg | One at a time | Four at a time | Failing files at four |
|---|---|---|---|
| ubuntu-latest | 896 s | 257 s | ci-workflow (R-1313 pins the old step text) |
| macos-latest | 1110 s | 392 s | ci-workflow |
| windows-latest | 1955 s | 736 s | ci-workflow; review-ledger timed out at 300 s (104 of 165 checks done) |

The Windows suite job took 16 minutes in all at four, against about 33 at one. Windows review-ledger takes 221 to 299 s alone over nine runs (299 s is 99.6% of the runner's 300 s limit, so main is already at the edge). At four, it had done 104 checks at 300 s; alone it reaches check 104 at 218 s, a 1.38× slowdown, which projects 390 to 412 s at four. The probe's heaviest slowdowns (requirements-lift 1.90×, macOS review-ledger 1.84×) would take it to about 570 s. macOS review-ledger took 184 s at four (61% of 300).

## Seat decisions

- **D1 · One job count, sealed in the job's env.** The suite job's `env` sets `NANA_CI_JOBS: "4"` with a `chosen` comment directly above it ("chosen; measured clean at 4 against 1 in probe run 39761155058"; the probe never tried 3 or 6). Each suite step passes `--jobs=${{ env.NANA_CI_JOBS }}` to the runner after npm's `--` (adversary M2: without `--`, npm takes the flag and the runner runs one file at a time). A YAML file cannot import a JS name, so the workflow is the value's one home; it does not reuse `SUITE_JOBS`, the 10-core seat Mac's locked-suite default. The `NANA_` prefix keeps it out of every test file's env (R-618 strips ambient `NANA_*` but `NANA_TEST_*`).
- **D2 · One per-file limit for every leg, sealed in the job's env (M1, S1).** The suite job's `env` sets `NANA_TEST_TIMEOUT_MS: "900000"` with a `chosen` comment directly above it: about twice review-ledger's projected 412 s at four on Windows. macOS blocks release too and has the same file at 61% under load, so every leg gets it; the cost is five more minutes when a file hangs on Linux or macOS. A hung file still ends by about minute 31 of the job's 90. The runner already reads the variable; no runner code changes. Joining `RUN_ALONE` is not enough: the file is at the old limit even alone.
- **D3 · Verbose stays on Windows.** R-1313 holds; its check matches the new step line and still pins `--verbose`. At four jobs each file's output prints as one block when it ends (FEAT-031's known bug).
- **D4 · The workflow's other dated comments.** The `timeout-minutes: 90` comment's "about 2.6 times the slowest leg" is a dated measurement; it stays, with one added sentence that the suite legs run four files at a time since this lane.
- **D5 · Copier's first download stays a known bug (S6).** Main's macOS leg failed once on 2026-10-22 (run 39755298929) when template-acceptance's 15 s `uvx copier --version` probe ran out during copier's first download. At four, four template files start together on that empty cache. The seat records it and counts it in the evidence runs; if it fires there, the lane adds a cache warm-up step before the suite steps in a further build.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2556 | Each `npm test` step of the root CI suite job shall pass `--jobs=${{ env.NANA_CI_JOBS }}` to the runner after npm's `--`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2556: every CI suite step passes the job count to the runner after npm's separator` |
| R-2557 | The root CI suite job's `env` shall set `NANA_CI_JOBS` to the sealed value 4, with the word `chosen` in the comment lines directly above that line. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2557: the suite job's count of test files at once is sealed at 4 with a chosen comment directly above it` |
| R-2558 | The root CI workflow shall set `NANA_TEST_TIMEOUT_MS` only in the suite job's `env`, to the sealed value 900000, with the word `chosen` in the comment lines directly above that line. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2558: the per-file time limit is set once, in the suite job's env, sealed at 900000 with a chosen comment directly above it` |

R-1313 keeps its text and title; its check matches the new Windows step line and still requires `--verbose`.

### What each test does, and why it is red on main

- **R-2556.** Reads `.github/workflows/ci.yml`'s suite job; finds every step whose `run:` invokes `npm test`; requires at least two; splits each run line at the first standalone `--`; the arguments after it include exactly one `--jobs=` argument, equal to `--jobs=${{ env.NANA_CI_JOBS }}`; nothing before it holds `--jobs`. Red: no `--jobs=` today.
- **R-2557.** The suite job's `env` block holds exactly one `NANA_CI_JOBS:` line, its value the string 4, with `chosen` in the comment lines directly above it; no other place in the file sets the name. Red: unset today.
- **R-2558.** Every occurrence of `NANA_TEST_TIMEOUT_MS` in the file (workflow `env`, any job's `env`, any step's `env`, an inline `NANA_TEST_TIMEOUT_MS=` in a run line) is the one line in the suite job's `env`, its value the string 900000, with `chosen` in the comment lines directly above it. Red: unset today.

## Tunables

- `NANA_CI_JOBS: "4"` in the suite job's `env` — chosen; measured clean at 4 against 1 (probe run 39761155058, 2026-10-22). Sealed by R-2557.
- `NANA_TEST_TIMEOUT_MS: "900000"` in the suite job's `env` — chosen: about twice review-ledger's projected 412 s at four on Windows (runs 39731735341 and 39761155058). Sealed by R-2558.

## Known limits (carried to the feature files)

- At four jobs a leg prints each file's output when that file ends, not live; a runner crash also drops the held output of up to three running files.
- The 900 s limit hides a slow file's drift until it doubles. review-ledger is the file to split; that is a later lane's call.
- Seconds in the CI logs are seconds under load.
- Four files off the run-alone list slow down under load and passed the single probe: recover (20 s rebuild deadline), post-edit's kill checks, mutation-runner's contention check, agent-dir-hostile (10 s handler bound). The evidence runs watch them.
- The first-try Windows failure count in HANDOFF restarts at this land, because the job count changed.
- Copier's first download can time out template-acceptance's 15 s probe (D5).

## Evidence and seat steps

- One build with the small builder.
- Wrong-code pairs: a step without `--jobs`; `npm test --jobs=…` with no `--`; a literal job count in a step; a third `npm test` step without it; `NANA_CI_JOBS` at 3 or with no `chosen`; the limit in the workflow-level `env`; the limit inline in a run line; the limit in a step's `env`; the limit at 600000 or with no `chosen`; the Windows step without `--verbose`.
- CI on the lane's draft PR: all three suite legs and both install checks green at the final tip. The Windows suite leg runs three times there (the push, then two re-runs). Every first-try failure is reported with its file; a re-run counts only after a failure in a file a known-bug line names.
- Notes in the reviewed change: the HANDOFF queue line out and the first-try count restarted; FEAT-031's and FEAT-019's lines that say CI runs one file at a time removed or reworded; the known limits above.
