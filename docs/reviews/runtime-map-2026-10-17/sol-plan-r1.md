Four MUST findings stand.

- **MUST — Spawned children with replacement environments are silently missed.** The design relies on `NODE_V8_COVERAGE` inheritance. Real tests spawn Node children with replacement environments, including `packages/nana-pack/tests/roster-notice.test.mjs:406` and `:445`. Those children receive no coverage variable, so their executed hook code is omitted. Users then receive an incorrect per-test runtime map. Add attribution for children whose `env` does not spread `process.env`, plus a requirement, check, and mutation pair covering that exact shape.

- **MUST — Zero-test results can appear current when the relationship is stale or unknown.** R-1292 and R-1293 mark measured test lines stale, but a block with zero measured lines has nothing to mark. A newly tracked file, or a dependency change that makes an existing test begin executing another file, can therefore print `(0): —` without a stale marker. A developer can act on that wrong result by skipping the relevant test. Mark the whole runtime result stale or unknown when the measured checkout no longer matches, including zero-result blocks. Pin this with dependency-change and newly tracked-file cases.

- **MUST — Cancelling a measurement on Windows can leave the suite running.** The plan explicitly carries this as residual 12. On Windows, terminating `test-locked` can leave npm, the runner, and its active test alive. The dead lock-holder PID can then be reclaimed while that suite still runs, allowing the next land suite to overlap it and produce an unreliable gate result. The measurement command must terminate the Windows process tree and prove no runner remains after cancellation.

- **MUST — The plan still offers a measurement run as land-gate evidence.** D3 option (b) permits replacing the plain pre-land suite with the coverage run. The plan itself identifies coverage-dependent verdict changes as its most likely wrong assumption. A test that passes only under coverage could therefore turn a land green, while the reverse could turn it red. Remove option (b) and state that measurement never substitutes for the ordinary locked suite.

Additional findings:

- **SHOULD — Resolve or reject an empty or relative `NANA_COVERAGE_DIR`.** A relative value makes child coverage land under individual working directories and can scatter untracked files through the checkout. The threat model explicitly includes an ambient coverage variable.

- **SHOULD — Pin `clean: false`.** M11 proves only a clean fixture. An implementation that mistakes `git status` exit zero for a clean tree would pass the planned checks.

- **SHOULD — Close the no-git mismatch.** Section 3.4 promises a diagnostic when no git common directory exists, but R-1295 and I6 do not require or test it.

- **SHOULD — Bound pair 35 independently.** Its unbounded-wait mutation can consume the mutation runner’s full per-file timeout instead of failing promptly.

- **SHOULD — Exercise Windows short-path repository forms.** The threat model includes 8.3 paths, but the planned Windows checks cover drive-letter case and links only.

- **NOTE — The plan names probe artifacts as adjacent evidence, but those artifacts are absent from this revision.** This is citation bookkeeping rather than a product defect.

The unset runner path, map-check isolation, one-`shall` row form, and revised M15 ordering check are otherwise well specified.

VERDICT: SEND-BACK
