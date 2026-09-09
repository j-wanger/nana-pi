## A. Nested usage — FINDING: BLOCK

The sidecar approach is viable; this implementation does **not** deliver exact totals.

- **Own-call contamination:** `ext/bench-nested-usage.ts:26,84–104` matches every Responses endpoint, without identifying the caller. pi-web-access’s `openai-search.ts:525` uses global `fetch` in the same process, so it is intercepted—not bypassed through imported undici. But pi’s own Codex SSE transport also uses `globalThis.fetch`; its usage can therefore be attached again as nested usage. WebSocket transport escaping interception does not make this safe.
- **Lost late usage:** `ext/bench-nested-usage.ts:113` returns before awaiting `inflight` when the accumulator is empty. A last tool’s clone can finish afterward, with no subsequent tool result to carry it. A mocked, network-free reproduction confirmed this. The timeout also does not mark unfinished harvesting unknown.
- **Double-counted nested usage:** `lib/usage.mjs:110` includes tool usage in `tokens`; `aggregate.mjs:37` adds `nestedTokens` again. The shipped fixture contains **1,530 assistant + 4,810 nested = 6,340**, but aggregation reports **11,150**. The passing test incorrectly labels 4,700 input tokens as “own.”
- **Unknown suppressed:** `lib/usage.mjs:118` checks `benchNested.unknown` only when usage is absent. A result containing measured usage **and** an unknown call reports `nestedUnknown:false`. Confirmed with the fixture.

**Minimal fix:** scope interception to identified nested requests; track each request through completion and deduplicate terminal usage; await harvesting before the empty check; persist unresolved/failed harvesting as unknown. Separate assistant and tool usage in the parser, and propagate unknown independently. Add deterministic coverage for these cases before further spend.

## B. Completion and grader handling — FINDING: SHOULD

**Completion fold passes:** `lib/usage.mjs:141` accepts a plain assistant answer with no tools. It parses the entire capture, so an earlier `agent_settled` does not cause later `message_end` events to be discarded. The documented distinction between `agent_end` and `agent_settled` is correctly applied.

**Grader classification remains incomplete:**

- `lib/checkers.mjs:126` treats an unspawnable grader command as a model failure.
- `lib/checkers.mjs:198` accepts any nonzero/null status—including spawn failure or timeout—as evidence that reverting broke the test.
- `lib/checkers.mjs:230–237` short-circuits on an ordinary failure, contrary to its promise that a grader error in *any* child dominates.

**Minimal fix:** distinguish oracle infrastructure failures from assertion failures; require a genuine assertion failure for revert-and-fail; ensure composite grader errors dominate. Records actually classified `grader-error` are correctly excluded from success denominators.

## C. Agent-directory isolation — FINDING: SHOULD

The pinned retry, provider-retry, compaction and tool settings are real. The prepared directory and `--no-approve` address settings contamination. Permissions and fresh-copy/no-copy-back behavior match the decision.

`PI_OFFLINE=1` disables startup networking, **not** model/tool networking; C remains functional.

**Credential caveat:** `lib/agentdir.mjs:84–93`, `DESIGN.md:50–54` understate OAuth rotation risk. A benchmark refresh can invalidate the refresh token still stored in the operator’s unchanged `auth.json`; copying the old source again can compound that. Separate files and locks do not isolate server-side credentials.

**Minimal fix:** document this operator-impact risk and verify either an independently authorized benchmark credential or a supported no-refresh execution window. Do not treat “never copied back” as proof the operator’s login is unaffected.

## D. Decision rule — FINDING: BLOCK

`DESIGN.md:163–169` permits contradictory verdicts:

- B gains one success but doubles total spend: both **improvement** and **regression**.
- B satisfies non-regression’s total/6-of-8 conditions but exceeds 1.5× on one cheap task: both **non-regression** and **regression**.

The sum-of-task-medians guard is useful, but its precedence is undefined.

`DESIGN.md:160` also leaves the comparison-level outcome unspecified when a task lacks decided runs. With unequal denominators, 3/3 versus 2/2 can produce a raw-success “win” without an observed correctness difference.

**Minimal fix:** declare mutually exclusive precedence, explicit insufficient-data handling, and how unequal decided counts affect success comparisons. Apply the unknown-spend veto before C adoption.

**SHOULD:** `DESIGN.md:184–185` gives a reasonable outcome-independent N→5 trigger, but define when it is evaluated, which comparisons count, and the schedule-extension procedure. Changing `repeats` currently changes the fingerprint and prevents ordinary resume (`lib/plan.mjs:63–67,89`).

## E. Checkers and live keys — FINDING: BLOCK

**Gaming remains:** the allowlist permits editing `blocks.mjs` itself. Adding `process.exit(0)` there bypasses c7’s suite. For c8, the same early exit makes the new test, hidden probe and existing suite appear green; restoring pristine `blocks.mjs` then makes a real invalid-input assertion fail. Thus **revert-and-fail can also pass without a guard**.

Locations: `tasks/c7-bugfix.json:24–30`, `tasks/c8-guard.json:16–39`.

**Minimal fix:** c7 can require the declared source correction and completed assertions. Both tasks need externally verified probe/test completion—not exit status alone—and adversarial coverage for early exit inside the **allowed** source file.

**SHOULD — snapshot lifecycle:** `run.mjs:447–455,479` caches keys only in memory; it never reloads `keys.jsonl` on resume. On snapshot failure, `undefined` causes per-run refetching in `lib/checkers.mjs:212–215`. Both violate one-oracle-per-block.

Persist and reload block outcomes, including oracle failures; never silently refetch within a block.

**r5:** publication-time ordering is appropriate and ordinary later releases do not change the answer. Historical deletion/metadata alteration remains unguarded because `tasks/r5-source-discovery.json:14–18` lacks an `expect` tripwire. Pin `0.20.0` and validate publication timestamps.

## F. Operations — FINDING: BLOCK

`run.mjs:473` excludes **all `run-error` records** from the systemic-stop streak. Repeated authentication failures, spawn failures or timeouts can therefore exhaust the remaining schedule rather than stop after three failures.

**Minimal fix:** include systemic run errors and stop immediately if child termination cannot be confirmed.

**SHOULD — budget ledger:** `run.mjs:422–438,465–466` loses probe spend across invocations, repeats registration probes on each invocation, and excludes probe wall time. Its limits are checked only between runs, not hard in-flight caps. Currently `totalTokens` includes reported nested usage accidentally; after fixing A, budget accounting must explicitly add nested spend exactly once. Unknown spend must prevent claiming the budget is fully accounted.

## Rep-0 checklist before reps 1–2

1. **Identity/completeness:** exactly 44 unique `(task, profile, rep:0)` tuples, expected `family`/`block`, one intended `fingerprint`; no foreign pilot records.
2. **Run health:** inspect `state`, `ok`, `exit`, `signal`, `error`; successful records require `diagnostics.settled:true`, `diagnostics.dangling:0`, and `diagnostics.badLines:0`.
3. **Settings effectiveness:** `retries:0`, empty `retryEvents`, `compactions:0`, empty `extensionErrors`; inspect `evidence` for startup errors.
4. **First real C search:** reconcile `toolCalls`, `nestedCalls`, `nestedTokens`, `nestedUnknown`, `tokens` and `totalTokens` against `evidence/stream.jsonl`. Verify every nested Responses request is accounted once, own calls are excluded, and mixed/late unknowns remain flagged. Fields alone cannot prove interception coverage.
5. **Grading evidence:** inspect every edit pass’s `check`, `changedFiles` and `evidence` diff; verify actual assertion completion. Research arms sharing `block` must show the same oracle key in `check.detail`.
6. **Recost:** reconcile `totalTokens`, `nestedTokens`, `nestedUnknown`, `wallMs` and probe evidence across all states, including failures; project the remaining 88 runs with headroom and verify no systemic failure streak was ignored.

VERDICT: STOP
