**Replicate 0 should not start at HEAD `54c3bc7`.** The registration probe crashes **after its model call**, and accounting/checker gaps remain.

Read-only review; no model calls, file edits, or spending commands. I read all ten test files rather than executing their writing tests. Targeted reproductions used memory-only stubs and non-writing commands.

Paths below are relative to `~/nana-pi`; `BENCH` = `apps/bench`, `STUDY` = `BENCH/studies/tool-profiles-2026-09-08`.

## A. Nested accounting — FINDING: BLOCK

**What passes:** pi’s primary agent loop awaits tool execution before requesting its next assistant response. The window therefore excludes ordinary parent-loop calls, including later parent retries. Calls made by a tool through pi-ai—summaries, subagents, mid-tool retries—are **nested spend**, not parent spend merely because they use pi’s SDK.

However, this is a timing discriminator, not caller identity or complete transport coverage. Unrelated concurrent requests, background work outside the window, and non-fetch transports invalidate the universal claim.

**BLOCK — incomplete coverage still reports known totals.**  
`BENCH/lib/nested.mjs:144–151`; `BENCH/ext/bench-nested-usage.ts:35–65`.

Independent reconciliation of `_nested-verify/raw/verify-nested/web-only/rep0/stream.jsonl`:

- Assistant messages: **1,759 + 1,944 + 2,001 + 2,076 = 7,780**, model `gpt-5.6-sol`.
- Tool-carried usage: **8,509**, model `gpt-5.6-terra`.
- Observed sum: **16,289**, counted once.

But **both** tool results, lines **45 and 92**, report successful `summary-model` work using **`openai-codex/gpt-5.6-luna`**. Neither summary’s usage appears in that sum. The extension’s `summary-review.ts:378–410` calls a model and discards its usage. The second window already has measured Terra traffic, so the new silence rule cannot flag its missing Luna spend.

**Minimal fix:** preserve/account for summary calls through their actual model-call boundary, or conservatively flag those paths unknown even when other requests were measured. Describe 16,289 as **observed spend**, not proven total spend.

**SHOULD — silence detection leaks across windows.**  
`BENCH/lib/nested.mjs:132–138,189–190`. A non-LLM-only window returns a null snapshot without resetting `observed`; a subsequent silent window is then incorrectly considered observed. Reproduced without networking.

**Minimal fix:** track observations per tool invocation and reset completed-window state even when no snapshot is emitted.

The zero-observed rule does **not** flag every C run: unused web tools produce no window. It conservatively flags cache-only/local tools too. Keeping unknown is preferable to inventing zero, but blanket exclusion of C’s cost comparison is a diagnostic limitation—not evidence against C. Its current implementation is simultaneously over-conservative for known local work and under-conservative for mixed measured/unmeasured work.

## B. Public cost path — FINDING: SHOULD

**PASS:** installed public declarations confirm `Usage`, `calculateCost(model, usage)`, and root-exported `ModelRuntime`. `allowModelNetwork:false` prevents catalog networking during creation. Assistant costs are summed without repricing; observed nested tokens are separate.

**SHOULD — null pricing is lost when records reach aggregation.**  
`BENCH/run.mjs:278`; `BENCH/aggregate.mjs:42–45`.

The runner writes a numeric `cost` using zero when `nestedCost` is null. Aggregation trusts that numeric field before checking unpriced nested usage. Reproduction: runner helper returns **null**, aggregator returns **$0.01** for the same unpriceable record.

**Minimal fix:** write `cost:null` with a reason whenever total cost is unavailable; use one shared cost helper. Unknown nested spend also needs a lower-bound/null distinction.

**SHOULD — nested models are pooled before pricing.**  
`BENCH/lib/usage.mjs:168–179`. All nested usage is priced using the **first** model ID. That is not “per nested model,” especially once Luna summaries are captured.

**Minimal fix:** retain usage by `(provider, model)`, price each bucket once, then sum. Preserve optional `reasoning`/`cacheWrite1h` when carrying public Usage fields.

Provider fallback order is tolerable for this pinned Codex study **only with verified nested provider identity**; it is not generally safe. Also pass the prepared catalog paths into `ModelRuntime.create`, rather than implicitly consulting the parent’s default agent directory.

## C. Checkers — FINDING: BLOCK

**PASS:** plain early `process.exit(0)` and late exit-code overrides with visible FAIL lines are now rejected. `all` executes every child and correctly lets grader errors dominate. Persisted live-key successes/failures are reused; r5 has its expected-value tripwire.

**BLOCK — stdout is still forgeable by the allowed source.**  
`BENCH/lib/checkers.mjs:150–166`; `STUDY/tasks/c7-bugfix.json:32–37`; `tasks/c8-guard.json:24–37`.

Printing 112 fabricated PASS lines and exiting zero passes `suite`; confirmed read-only. More generally, allowed `blocks.mjs` can rewrite logged FAIL labels to PASS and force exit zero. This can defeat both suite counts, including the hidden guard probe, without implementing the requested behavior. c7’s forbidden-string check does not establish semantic correction.

**Minimal fix:** constrain allowed source changes to the requested implementation and reject process/output/test-harness interference, or evaluate assertions in a trusted isolated harness. Add forged-PASS adversarial cases, not just bare early exits.

**SHOULD — “genuine assertion failure” remains overstated.**  
`BENCH/lib/checkers.mjs:238–255`; `STUDY/tasks/c8-guard.json:40–44`.

Without `expectFail`, any ordinary nonzero exit qualifies. The paired test rejects always-failing tests, but a test importing an unrelated newly added export can pass before restoration and fail with an import error afterward.

**Minimal fix:** require evidence that restoration fails on the guard assertion, rather than module loading or arbitrary exit status. A regex alone is not tamper-proof evidence.

## D. Decision rule — FINDING: BLOCK

**PASS:** known-spend A/B rules now have explicit precedence; rates with **D≥2 per arm** avoid inventing a win from 3/3 versus 2/2.

**BLOCK — C adoption still bypasses the stated precedence.**  
`STUDY/DESIGN.md:215–218,237–242`.

- C research’s standalone adoption formula can authorize adoption despite a cost REGRESSION—for example, two task wins with doubled spend.
- “Code comparison is not a REGRESSION” includes **INSUFFICIENT DATA** and **INCONCLUSIVE**, neither of which establishes safe default adoption.
- Rule 0 leaves ambiguous whether unknown spend yields insufficient data immediately or only after testing correctness-only clauses and counterfactual cost verdicts.

**Minimal fix:** write one explicit decision procedure. Apply sufficiency and regression guards before C adoption; require affirmative code non-regression evidence for default adoption; specify exactly how unknown spend interacts with correctness-only conclusions.

**SHOULD — N→5 counting/stopping needs one clarification.**  
`STUDY/DESIGN.md:244–250`; `BENCH/lib/plan.mjs:74–99,106`.

Fingerprint exclusion and prefix-preserving schedule extension are sound. Specify whether “three tasks” means distinct task IDs or task-comparison pairs; shared code tasks currently invite double counting. A systemic/budget stop must require explicit clearance, not automatically authorize more repetitions.

## E. Operations — FINDING: BLOCK

**BLOCK — registration probe crashes after spending.**  
`BENCH/run.mjs:360–369,555–559`.

`registrationProbe()` references **`opts.pricer`**, but `opts` is outside its scope. A stubbed reproduction reached one simulated paid call, then threw:

`ReferenceError: opts is not defined`

No evidence or ledger write occurred. The advertised 44-run replicate cannot complete; restarting repeats the unrecorded probe.

**Minimal fix:** pass `pricer` explicitly. Add a no-model integration test covering the full probe→evidence→ledger path, including failure/timeout exits. Persist spend and kill status before judging probe success.

**SHOULD — persistence and budget limits remain weaker than advertised.**

- `run.mjs:414–439`: ledger/key readers skip torn tails but do not repair append boundaries. The next appended record can disappear too. Apply the results-file repair discipline.
- `run.mjs:307–308`: exceptions after a paid child—asset copying, diffing, evidence writes—replace measured spend with a zero-token harness record. Preserve accumulated child metrics through postprocessing failures.
- `run.mjs:119–120`: kill confirmation tests only the leader PID, not surviving descendants. Confirm process-group/tree death; apply the same stop handling to probes.
- `run.mjs:540,551–561`: systemic streak resets on resume; budgets are checked between runs and not rechecked after probes. Restore the trailing streak and recheck after probes.

The three-failure stop now includes run-errors: **PASS**. Nevertheless, **3.5M tokens / 6h are between-run thresholds**, not hard ceilings. Unknown/in-flight usage can exceed them; wall time also excludes grading. Document that bound and cap each child by remaining wall allowance.

## F. Rep-0 checklist before reps 1–2

After fixes and a fresh approval:

1. **Identity:** 44 unique `(task, profile, rep:0)` records; matching `fingerprint`, `block`, and schedule; no pilot records.
2. **Health:** inspect `state`, `ok`, `exit`, `signal`, `killedCleanly`, `error`; require clean `diagnostics.settled`, `dangling`, `badLines`.
3. **Settings:** `retries:0`, empty `retryEvents`, `compactions:0`, empty `extensionErrors`; verify load-probe model and compaction results.
4. **Nested accounting:** reconcile `tokens`, `nestedTokens`, `nestedModels`, `nestedCalls`, `nestedUnknown`, `nestedUnknownReason`, `spend` against search **and summary** evidence.
5. **Correctness/oracles:** inspect edit `check`, `changedFiles`, evidence diffs and actual assertions; verify identical `keys.jsonl` outcomes for each `block`.
6. **Recost:** reconcile all-state `spend`, `cost`, `nestedCost`, `nestedCostReason`, `wallMs` plus registration-probe ledger entries; project remaining runs with headroom.

### For the maintainer
Do not launch rep 0 at this HEAD: the paid probe deterministically crashes afterward.
Fix probe persistence, mixed-path nested accounting, checker forgery, and C decision precedence first.
The live trace proves 16,289 observed tokens—not complete nested coverage.
Recheck the integrated paths without models before requesting spend approval.

VERDICT: NO-GO
