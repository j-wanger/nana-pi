The lane does what the brief asks, and I found no MUST. `nana-land` skips the local suite only after a positive proof on the exact tip. Every way that proof can fail sends the land to the local suite. Every refusal that exists today still refuses.

**What I checked**
- **Real CI data:** I ran the lane's real reader and `proveCiSuite` against GitHub for 711e351f, run 41334086687. It read three records (darwin, linux, win32), each with `filters: []`, 253 files and exit 0. The proof accepted the macOS attempt-1 record. With today's CI output, a seat land at a passing tip would skip the 11-minute suite.
- **Touched tests:** they all pass: land-ci-suite 6, land 66, land-ci-records 7, land-records 7, suite-records 9, rulings 22, worker-lane 67. `nana-writing HANDOFF.md` reports 0 over and 0 banned.
- **Only an unfiltered, same-platform, passing record from the newest run is accepted.** `judgeRuns` keeps only each workflow's newest run. `proveCiSuite` drops records from other runs and other platforms and keeps each leg's highest attempt. Every kept record needs a `filters` array that is empty, at least one final file, and `exitCode === 0`. Records from before this lane have no `filters` and fail.
- **Every read failure falls back to the local suite.** A reader error, any reader problem, a blown budget or an exception inside `proveCiSuite` all run `--suite`. A failed `git diff` refuses with a message, which is loud, not silent.
- **Runner or workflow changes always run locally.** The diff uses `--no-renames`, so a rename lists both old and new names. Build 2 pinned this with a real-repo rename case.
- **A red local suite still blocks.** That code is unchanged inside `if (!suiteProof.ok)`.
- **Behaviour without CI matches today, plus the designed changes.** Refusals and their text are unchanged. Old end records render byte for byte the same. The only new output is the planned `suite: local <reason>` line, plus the new record fields `suite` and `suiteWhy`. A non-zero run-list exit now gets one retry, as R-3434 specifies.

**SHOULD**
- **Preamble wording:** `packages/nana-pack/prompts/builder-preamble.md` now says to run the full suite "only where its `AGENTS.md` says CI does not cover it". That reverses the default for projects whose AGENTS.md says nothing about CI, such as nana-agent-loop, which also has no workflows. Read literally, a builder there would neither run the full suite nor push and stop. The land still runs the local suite in those projects, so a red suite is only caught later, not let through. Wording such as "unless its `AGENTS.md` says CI covers it" would keep the old default.

**NOTEs (known-bug candidates)**
- **Budget check:** in `budgetedGh`, the `budgetStopped` getter now also counts time spent after the last call. In `keepLandCiRecords` it is read after the records are stored. So the post-merge "stopped at the 60 s budget" note can now appear on a read that finished. The note is advisory only.
- **Quoted paths:** `git diff --name-only` without `-z` quotes non-ASCII paths, so a workflow file with a non-ASCII name would not match `.github/workflows/`. That input is contrived.
- **Composite actions:** a future `.github/actions/` folder would not be on the fallback list.
- **Test fixture:** the rename test writes `"console.log('suite');\\n"`, a literal backslash-n rather than a newline. It is cosmetic, and the test still works.
- **Residuals already recorded:** pull-request runs test the tip merged with its base, the runner config files are left off the list, and the `package.json` test script is not checked. These are already in the FEAT-008 known-bug file.

VERDICT: LAND
