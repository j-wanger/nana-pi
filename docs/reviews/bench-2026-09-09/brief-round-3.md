# Review brief — nana-pi apps/bench, astra GO/NO-GO before spend (third look)

Your two earlier reviews (FIX-FIRST, then STOP) are at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/review-astra-bench.md and review-astra-bench2.md. The worker folded every BLOCK/SHOULD from the second; the maintainer also ruled (lineup option b) that usage/cost math moves onto pi-ai's PUBLIC exports. All of it is committed as nana-pi HEAD 54c3bc7 (read its commit message: `git -C ~/nana-pi show --stat HEAD`). Decide whether replicate 0 (44 runs + C registration probe) may start. Do not re-open accepted trade-offs (navigation/metadata pilot; r6 memorization named as threat; shared-login symlink; multi-file task deferred). Read-only; no model spend; never run run.mjs with --go/--smoke.

## Read
- ~/nana-pi/apps/bench/lib/nested.mjs, ext/bench-nested-usage.ts, lib/usage.mjs, lib/pi-exports.mjs, lib/checkers.mjs (suite / revert-and-fail / all / live-key), lib/plan.mjs, lib/agentdir.mjs, run.mjs (ledger, systemic stop, kill), aggregate.mjs
- studies/tool-profiles-2026-09-08/DESIGN.md (decision rule section), study.json, tasks/c7-bugfix.json, c8-guard.json, r5-source-discovery.json
- Live evidence of the nested path: studies/_nested-verify/ (record + raw stream) — reconcile yourself: own 7,780 (gpt-5.6-sol) / nested 8,509 (gpt-5.6-terra) / spend 16,289.
- tests: apps/bench/test/*.test.mjs (463 checks) — read nested.test.mjs, study-tasks.test.mjs (adversarial early-exit cases), usage.test.mjs.
- pi 0.84.4: pi-ai dist/types.d.ts:265-286 (Usage), dist/models.d.ts:192 (calculateCost), pi-coding-agent root exports (ModelRuntime).

## Dimensions (answer each, PASS or FINDING with BLOCK/SHOULD/NIT + file:line + minimal fix)
A. Nested accounting now: is the tool_call→tool_result window a sound discriminator against pi's own model calls (any pi path that issues a model request DURING a tool execution — e.g. subagent-style tools, retries mid-tool)? Does the "zero observed requests → unknown" rule risk flagging every C run and vetoing C by construction (the worker expects it to fire) — is that the right failure mode or over-conservative?
B. Cost path: pi-ai `Usage`/`calculateCost` + offline `ModelRuntime.getModel` — correct types, no double pricing (pi already prices assistant messages; nested priced once afterwards), null-with-reason where unpriceable, provider fallback order risk acceptable for this single-provider study?
C. Checkers: does `suite` (exit 0 + pristine PASS count + no FAIL) close the early-exit vector for both edit tasks? Any remaining gaming (e.g. printing fake PASS lines from the source file)? revert-and-fail genuine-assertion detection sound?
D. Decision rule precedence as written — exactly one verdict in every case? Rate comparison with D≥2? N→5 procedure sound and fingerprint-stable?
E. Ops: ledger persistence, systemic stop incl. run-error, kill confirmation, budget caps (3.5M tokens / 6h) — anything that lets a broken run burn quota unattended?
F. Rep-0 checklist: ≤6 concrete checks (field names) the maintainer verifies before reps 1-2.

End with ≤6 lines for the maintainer and exactly one line: `VERDICT: GO` or `VERDICT: NO-GO`.
