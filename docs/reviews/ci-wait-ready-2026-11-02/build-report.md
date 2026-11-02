# CI wait build record

## Scope and rows

Feature FEAT-008, branch `feat/ci-wait-ready`. R-3720 through R-3725 are implemented with backticked exact `file::title` evidence. The requirement diff preceded tagged tests, which preceded implementation. The plan and Revision 2 were already committed by the seat before this build; they remain in the lane history.

- R-3720 / M1: origin-matched remote PR diagnosis, absent/conflicting/stale/ambiguous heads, UNKNOWN exhaustion and recovery, renamed local branch and fork disambiguation. Land reads runs first and makes one readiness read only for absent runs. Existing successful push-only CI and no-CI skips remain accepted.
- R-3721 / M2: two reruns per workflow, stale-attempt barriers, persistent requested-identity memory, failed writes, job pagination and independently advancing workflows. A third cancellation reports three attempts as red.
- R-3722 / M3: realistic three-suite/four-install-check/skipped-release evidence, advisory Linux failure, blocking failures, timeouts, incomplete evidence and capacity wording in land.
- R-3723 / M4: one deadline over readiness, run/jobs reads, rerun writes and sleeps; unfinished/absent runs, API failures and shrinking per-call timeouts.
- R-3724 / M5 and the clean-merge interaction check: success lines, rerun notes, CLI exit codes with an injected Node fake gh, passing pre-land rerun and refusal when its attempt changes during the land.
- R-3725 / M6: exact seals for rerun cap, readiness count/delay, polling interval, wait deadline, PR fields, attempt-job endpoint and advisory workflow rule.

## Files and functions

- `packages/nana-pack/lib/ci-wait.mjs`: `ciReadiness`, `classifyRun`, `waitForCi`; shared `ciTarget` and `ciRunJobs` avoid duplicate identity/job-read logic between the CLI and land.
- `packages/nana-pack/bin/nana-ci-wait.mjs`: bounded async CLI with `--tip`, optional remote `--branch`, optional origin-matching `--repo`, and the shared injected-gh command seam.
- `packages/nana-pack/bin/nana-land.mjs`: CI read/refusal path only; no waiter call, polling or gh write. No-run readiness uses one read. Complete cancellation evidence changes the refusal to capacity-cancelled with `nana-ci-wait --tip <tip>`.
- `packages/nana-pack/lib/land-ci.mjs`: `judgeRuns` also returns its already-selected runs on a valid red/empty response. Both consumers reuse that selection rather than copying it or exporting its private validation/remedy helpers.
- `packages/nana-pack/lib/land-config.mjs`: new sealed policy and API values with provenance; existing read limit, page size, host and conclusion constants are reused.
- `packages/nana-pack/package.json`: register the new command, with executable CLI file mode.
- `packages/nana-pack/tests/ci-wait.test.mjs`: exactly the six must-meet checks, including the seal check; every async case is awaited under the existing bounded `check` harness. Workflow-text cases include CRLF, trailing spaces/tabs and no final newline. Fixtures write only OS temporary directories.
- `packages/nana-pack/tests/land-clean-merge-race.test.mjs`: one added check containing the two required interaction fixtures.
- `packages/nana-pack/README.md`: CI paragraph documents command, dependencies, boundaries and residual.
- `REQUIREMENTS.md`, generated `docs/code-map.md`, generated `docs/requirements-tree.md`, and this lane folder: contracts and evidence.
- `docs/known-bugs/FEAT-008.md` and `FEAT-006.md`: only the two exact brief-authorized appended lines. No old bug text was changed.

## Real workflow classification

The tip workflow has three suite legs, four install-check legs and release skipped for PRs. Overall success wins, preserving the land contract. Recovery requires a completed run and all pages of attempt-matched job evidence, with at least one cancelled job. Success, skipped and neutral jobs are harmless. Any blocking failure or timed_out job refuses. Only the explicitly recognized suite `continue-on-error` stanza at the tip permits `suite (ubuntu-latest)` failure in an overall cancelled run. The rule is sealed with the plan's `ci.yml:68` provenance. Unknown/missing workflow text cannot authorize the advisory-failure exception.

## Existing-test edits

No existing assertion, fixture or title was changed. In particular, `land-ci-read.test.mjs` and `land-ci-edge.test.mjs` remain byte-identical. Revision 2's read-first design preserves the one-call assertions on passing paths, so its forecast edits proved unnecessary. The sole existing-test-file change is the brief-authorized new clean-merge interaction check, tagged R-3724; it leaves the original race check intact.

## Wrong-code runs

`wrong-code.txt` records all runs and exits; `wrong-code.mjs` reproduces the manual temporary-copy code mutations. No assertion is inverted, and no suite test runs or copies this manual harness.

- Base: all M1–M6 fail with exit 1 because the waiter module is absent. The new interaction check passes on the base with exit 0 because that identity guard already exists.
- Wrong-code pairs: skipped readiness (M1), rerun despite blocking jobs (M3), no rerun cap (M2), capacity treated as success (M2), unbounded deadline (M4), forgotten requested identities after newer pending evidence (M2), CLI always red (M5), wrong cap seal (M6), removed land identity guard (interaction). Each wrong run exits 1 and names the cited failed check; every restored-code run exits 0.
- The first temporary-copy harness run was invalid: it omitted a transitive setup module, so both sides exited 1. The log retains those failures. Adding that source dependency to the temporary copy fixed the harness; all later pairs meet 1/0.
- The added stale-regression fixture first failed against the initial implementation, exit 1. Persistent requested-identity memory corrected it, exit 0. A separate code-removal mutation now pins that memory.

## Precedent and departures

All Precedent files were read before implementation. `judgeRuns`, `githubRepoOf`, `ghDefault`, `ghResult`, `ghEnvironment` and `ghFromEnvironment` are imported, not copied. The existing bounded async test harness is imported from `profile-fixture.mjs`.

- No private helper export or move was needed. `judgeRuns` returns more of its own result instead of a second caller duplicating newest-run selection.
- Compared with the synchronous main-CI CLI, the waiter CLI uses top-level await and injected sleep because polling must release the event loop and be clock-testable. Land remains synchronous and read-only; it explicitly requests one readiness read, while the waiter owns UNKNOWN retries.
- API reads follow land's `--hostname github.com` plus explicit repository endpoint precedent, not Revision 2's literal `--repo` on every call: `gh api` does not accept `--repo`. PR/rerun commands use host-qualified `--repo github.com/<owner>/<repo>`. See `gh-evidence.md` for quotations and limits.
- The main-CI command is called by Node path rather than registered in the pack bin map. This command is also registered because land's required remedy uses its bare executable name.
- No live GitHub request validated cancelled-job restart semantics. Local help confirms `--failed` and its dependency wording, not explicitly cancelled jobs. That service behaviour remains the plan's assumption; the fakes prove invocation and response handling only.

## Known-bug context touched

The added manual-cancel residual remains. The existing Linux continue-on-error success contract remains; only cancelled-run recovery consults the tip's rule. Latest successful attempts still qualify. Fast-forward lands retain their one snapshot, and clean merges retain their identity re-read; neither race window is expanded by polling inside land. The existing one-page run-list and never-started-workflow limits remain. New command targeting is explicit, but the old raw rerun remedy for non-capacity failures is not changed. The new CLI has portable injected Node-gh coverage; old land CLI platform limits are unchanged. The brief's missing-gh preamble exception is recorded, not fixed in the launcher.

## Commands and exits

`build-1-green.txt` records sequential, standalone test exits. Required files: `ci-wait`, `land`, `land-ci-read`, `land-ci-edge`, `land-clean-merge`, `land-clean-merge-race`, `main-ci`, `test-runner`: all exit 0. Additional affected land files `land-merge`, `land-ci-suite`, `land-ci-records`, `land-records`: all exit 0. No local full suite ran: root `AGENTS.md` explicitly assigns it to CI. No push, CI read, real gh API request, model session or subagent ran.

`generators.txt` records `npm run map` and `node scripts/requirements-tree.mjs --write`, both exit 0. `checks.txt` retains an early README path-claim failure and early missing evidence-marker failures, then their corrected green runs. Map check, README check, trace, tree and known-bugs checks all exit 0. The known-bugs scanner reports the pre-existing FEAT-013 size advisory, with zero names and exit 0. Generated logs replace local path prefixes with placeholders and trim trailing output whitespace. The writing check runs on the final technical response; required identifiers, paths and SHA remain under the technical-record exemption.

Lane classification:

```text
gate: packages/nana-pack/bin/nana-land.mjs — land tool
```

The final response supplies the committed full tip and seat checks rerun on that exact commit. Windows execution and hosted CI remain for the seat; only the portable Node-fake cases ran locally.
