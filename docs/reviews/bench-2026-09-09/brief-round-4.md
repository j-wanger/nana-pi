# Review brief — nana-pi apps/bench, astra GO/NO-GO (fourth look) at HEAD 79c8d1c

Your third review (NO-GO) is at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/review-astra-bench3.md. Every BLOCK and SHOULD was folded and committed as 79c8d1c (`git -C ~/nana-pi show --stat HEAD` and its message). Decide whether replicate 0 (44 runs + C registration probe) may start. Read-only; no model spend; never run run.mjs with --go/--smoke. Do not re-open accepted trade-offs.

## Folds to verify (each was a BLOCK or SHOULD of yours)
1. E: registrationProbe(pricer) explicit; evidence + ledger written BEFORE judgement; test/integration.test.mjs (33) drives probe + executeRun with a stub child (success / missing tool / nonzero / timeout / unspawnable / torn ledger tail / post-processing throw keeps measured tokens). readJsonl tail repair shared by results/ledger/keys; treeAlive kill confirmation incl. probes; streak restored on resume; budget rechecked after probes; child timeout capped by remaining wall.
2. A: root cause found — pi-ai's Codex transport is WebSocket (no fetch), so the summary-model call (luna) never hit the fetch wrapper. Sidecar now wraps globalThis.WebSocket (model connection inside a window → unknown) AND reads the tool's {phase, model} report, marking unknown any phase whose model was not measured even in a window with measured traffic. Window state resets at every close. 16,289 relabelled OBSERVED.
3. B: shared costOfRecord; cost:null + costReason; per-(provider, model) nested pricing; explicit catalog paths; reasoning/cacheWrite1h carried.
4. C: withinLines (declaredSite per task), denyAdded token denylist on added lines, trusted-suite under `--require lib/harness-sentinel.cjs` (copied from outside the fixture; process.exit throws for untrusted code; stdout writes attributed by call stack; completion marker); revert-and-fail requires a completed run reporting a failure. Sentinel content-pinned.
5. D: one ordered procedure (unknown-spend → sufficiency → regression incl. two-wins-doubled-spend → improvement → non-regression affirmative → inconclusive); C-for-research needs IMPROVEMENT; C-as-default needs affirmative code non-regression; N→5 = distinct task ids; stops never authorize more reps.

## Read
- ~/nana-pi/apps/bench/run.mjs, lib/{nested,usage,checkers,harness-sentinel.cjs,plan,agentdir,pi-exports}.mjs, ext/bench-nested-usage.ts, aggregate.mjs
- studies/tool-profiles-2026-09-08/{DESIGN.md,study.json,tasks/c7-bugfix.json,c8-guard.json}
- tests: integration.test.mjs, nested.test.mjs, checkers.test.mjs, study-tasks.test.mjs
- pi-ai: $(npm root -g)/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/api/openai-codex-responses.js (how the WebSocket is constructed — module-scope capture vs globalThis at call time? `ws` package vs global?) — this decides whether the WebSocket wrapper can ever fire.

## Dimensions
A. Nested detectors: will the WebSocket wrapper see pi-ai's socket (construction site, globalThis vs captured constructor vs `ws`)? Is the {phase, model} detector robust to pi-web-access's actual details shape? If both miss, is the failure LOUD (unknown) or silent? Is "unknown" now over-firing so that C can never be costed — and if so, is that acceptable for a pilot whose C cost claim would then be INSUFFICIENT rather than wrong?
B. Sentinel/trusted-suite: can the allowed source still forge (monkey-patching process.stdout.write before the sentinel attributes, Error.prepareStackTrace tampering, worker threads, writing the completion marker itself, editing the copied sentinel path)? Is the trusted-file attribution by stack frames sound on Node 22 with source maps off?
C. Probe/run persistence: any path left where a paid call's spend is not persisted; is ledger accounting exact for probe + runs; kill confirmation on macOS for a detached group.
D. Decision procedure: exactly one verdict in every case; C rules consistent with the ordered procedure; no outcome-forcing.
E. Anything NEW introduced by this fold.
F. Rep-0 checklist (≤6 concrete field checks) — restate briefly.

End with ≤5 maintainer lines and exactly one line: `VERDICT: GO` or `VERDICT: NO-GO`.
