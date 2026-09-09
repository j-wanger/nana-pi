# Review brief — nana-pi apps/bench, astra RE-CHECK after the FIX-FIRST fold (replicate 0 is running in parallel; the full N=3 run is gated on you)

You reviewed this pre-registration earlier tonight (FIX-FIRST; your text: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/review-astra-bench.md). The worker folded every BLOCK and most SHOULDs; the maintainer added two decisions (C runs code too; prepared agent dir ~/.pi/bench-agent with auth copied fresh per run, never copied back). Re-check ONLY whether the folds are sound and whether anything new was introduced. Do not re-litigate accepted trade-offs (navigation/metadata pilot framing; r6 memorizable kept as a named threat; multi-file maintenance task deferred to a next study). Read-only; no model spend; do not run run.mjs with --go/--smoke.

## Read (committed as nana-pi HEAD "apps/bench: reusable pi benchmark…")
- ~/nana-pi/apps/bench/{run.mjs,aggregate.mjs,README.md}, lib/{profiles,usage,checkers,fixture,plan,agentdir}.mjs, ext/bench-nested-usage.ts
- ~/nana-pi/apps/bench/studies/tool-profiles-2026-09-08/{DESIGN.md,study.json,tasks/*.json}
- ~/nana-pi/apps/bench/test/*.test.mjs (314 checks)
- pi 0.84.4 docs for any claim (rpc.md:864-866 agent_end vs agent_settled; rpc.md:1109 auto_retry_start; settings.md:118,143-147,226-228; extensions.md:851,2013 tool_result usage)

## Dimensions
A. Nested-usage SIDECAR (the worker chose a fetch-wrapping sidecar extension over patching pi-web-access, to keep the upstream file byte-identical): is wrapping globalThis.fetch inside a pi extension sound — does it see pi-web-access's Responses calls (same process/realm? undici vs global fetch?), can it double-count pi's OWN model calls, does it attribute correctly under parallel tool calls (worker says approximate; total exact), and does "nestedUnknown never zero" hold when the wrapper sees a call but no usage field? What would you check in the first real C stream to trust it?
B. Completion semantics: exit 0 AND agent_settled AND no dangling tool call — any legitimate run shape that fails this (e.g. a model that answers with no tool calls; a run where pi emits agent_settled before the last message_end)? Grader-error handling correct and outside denominators?
C. Agent-dir isolation: pinned settings keys real and effective (worker: bare RPC probe showed autoCompactionEnabled true → with the prepared dir false); auth.json copied fresh per run, 0600, never back — token refresh implications for the OPERATOR's ~/.pi/agent/auth.json (could the bench's refreshed token invalidate the operator's? OAuth refresh-token rotation); PI_OFFLINE=1 vs C needing network in tools.
D. Decision rule as now written (DESIGN.md): decidable at N=3? Total-spend guard sound? INCONCLUSIVE path? N→5 pre-declaration? Any remaining outcome-forcing?
E. Checkers: changed-paths + revert-and-fail for c7/c8 — any remaining gaming vector; live-key snapshot-per-block correct; r5 source-discovery key robust to registry drift during the run?
F. Ops: the run in progress is `--go --rep 0` (44 runs + 1 paid registration probe). Budget/systemic stops sound? What must the maintainer verify in rep-0 output BEFORE continuing to reps 1-2 (list ≤ 6 concrete checks with the field names in results.jsonl)?

## Output
Per dimension: PASS or FINDING (BLOCK = stop the run / SHOULD / NIT, file:line, minimal fix). Then the ≤6-item rep-0 checklist. End with exactly one line: `VERDICT: CONTINUE` or `VERDICT: STOP`.
