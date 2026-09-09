# Review brief — nana-pi apps/bench, astra GO/NO-GO (sixth look) at HEAD 09e6f4b

Your fifth review (NO-GO) is at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/review-astra-bench5.md. A FRESH worker folded every finding and committed 09e6f4b (`git -C ~/nana-pi show --stat HEAD` + message). This is a benchmark-grader verification review: state which robustness properties the implementation guarantees, with file:line; gaps are test-coverage findings. Read-only; no model spend; never run run.mjs with --go/--smoke. Do not re-open A (nested detectors), D (decision procedure) or C-pricing wiring from earlier rounds unless regressed.

## What changed (verify each)
E. loadProbe stray `onBuffer` removed; six stubbed loadProbe cases. c8 runs the new test against the FIXED source again (unconditional-fail / unparseable / import-throw tests → fail; honest pair passes both halves).
A. eval-module.mjs rewritten: spec file unlinked after open before spawn (nonce not on disk; /dev/fd/4 unreadable — tested); exactly one HMAC-valid verdict, shape + probe count validated (selectSignedVerdict/judgeVerdict exported, 14 cases); prototype-independent verdict (captured Object.keys/own-property serializer, uncurried Hmac update/digest, Reflect.apply, prototype-chain identity for error classes) — 15 patch shapes rejected with a wrong fix + a positive control that patches all and fixes; non-primitive returns rejected before ===; unresolved top-level await → grader-error unless the partial verdict already holds a failing probe. Probe sets c7 13 / c8 19, all re-derived from the pristine fixture in tests.
B. INFLIGHT keyed map; probes + runs registered until append ACKNOWLEDGED; handleInterrupt: signal → bounded drain (1200 ms) → treeAlive confirm → live buffer evidence + `run-error: interrupted` record (cost null, nestedUnknown true) → exit 130. Tests: interrupt during child / postprocessing / append / probe; real appendLedger/appendResult on the happy path; failing results append stops the study.
C. cost:null + reason persisted when nestedUnknown; budget uses observed cost; pricedNestedCost; DESIGN.md Codex transport wording corrected.
Guard: test/orchestration-paths.test.mjs drives loadProbe, registrationProbe, executeRun, runPlan, SIGINT path with stubs.

## Read
- ~/nana-pi/apps/bench/lib/eval-module.mjs, lib/checkers.mjs (eval-module policy, selectSignedVerdict, judgeVerdict), run.mjs (loadProbe, registrationProbe, executeRun, runPlan, handleInterrupt, INFLIGHT), lib/usage.mjs (cost helpers)
- studies/tool-profiles-2026-09-08/{tasks/c7-bugfix.json, c8-guard.json, DESIGN.md, study.json}
- tests: orchestration-paths.test.mjs, checkers.test.mjs (adversarial matrix + positive control), study-tasks.test.mjs, integration.test.mjs

## Dimensions
A. Evaluator isolation properties (verification register): for each of (1) nonce unreachable after fd 4 close and spec unlink, (2) exactly-one-verdict policy, (3) prototype-independent verdict construction incl. the two post-import paths the worker could not audit (fs.writeSync(fd, string) and Hmac digest — do Node 22 internals on those paths use primordials?), (4) primitive-only comparison, (5) unfinished evaluation classification — state GUARANTEED (file:line) or GAP (coverage finding + minimal fix). Probe sets: any remaining input class that a wrong fix satisfies?
B. Interrupt salvage: is the registered→acknowledged window airtight for probes and runs; is the 1200 ms drain a correctness risk or only an evidence-completeness risk; does exit 130 after persistence leave any child alive; does the SIGINT wiring test exercise the real handler?
C. Regressions/new: anything new in this fold (the worker was fresh — different blind spots); does orchestration-paths.test.mjs actually reach every orchestration function (grep the exports vs the test)?
D. Persisted record contract: cost/observedCost/pricedNestedCost/nestedUnknown consistent across run record, aggregate cell, profile row, DESIGN.md.
E. Readiness: with 741 checks and five folds, what is the residual risk of spending replicate 0 (44 runs + 1 probe)? Name the top 3 things to read in rep-0 output.

End with ≤5 maintainer lines and exactly one line: `VERDICT: GO` or `VERDICT: NO-GO`.
